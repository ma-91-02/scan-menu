import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { createApp } from "./server.js";

let server: Server;
let baseUrl: string;

before(() => {
  process.env.BABILI_DISABLE_EMAIL = "true";
  server = createApp().listen(0);
  const address = server.address();

  assert(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  server.close();
});

test("registration fails without privacy/terms acceptance", async () => {
  const response = await post("/register/customer", {
    name: "Consent Test",
    email: uniqueEmail("consent"),
    password: "password123",
    preferredLanguage: "ar",
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.match(payload.error, /consent/i);
});

test("register customer creates unverified user and hides passwordHash", async () => {
  const response = await post("/register/customer", {
    name: "Registered Customer",
    email: uniqueEmail("customer"),
    password: "password123",
    preferredLanguage: "ar",
    acceptedTerms: true,
    acceptedPrivacy: true,
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.data.user.role, "customer");
  assert.equal(payload.data.user.emailVerified, false);
  assert.equal(payload.data.user.acceptedTerms, true);
  assert.equal(payload.data.user.acceptedPrivacy, true);
  assert.equal(payload.data.user.termsVersion, "1.0");
  assert.equal(payload.data.user.privacyVersion, "1.0");
  assert.equal(payload.data.user.passwordHash, undefined);
  assert.equal(payload.data.emailDelivery.delivered, true);
  assert.ok(payload.data.debug.emailVerificationToken);
});

test("register restaurant owner creates user, restaurant, and owner staff link", async () => {
  const response = await post("/register/restaurant-owner", {
    name: "Owner User",
    email: uniqueEmail("owner"),
    password: "password123",
    restaurantName: "Owner Bistro",
    preferredLanguage: "en",
    acceptedTerms: true,
    acceptedPrivacy: true,
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.data.user.role, "restaurant_owner");
  assert.equal(payload.data.user.staffRole, "owner");
  assert.equal(payload.data.restaurant.ownerId, payload.data.user.id);
  assert.equal(payload.data.staff.staffRole, "owner");
  assert.equal(payload.data.user.restaurantId, payload.data.restaurant.id);
});

test("login fails before email verification, then verify email succeeds", async () => {
  const email = uniqueEmail("verify");
  const register = await post("/register/customer", {
    name: "Verify User",
    email,
    password: "password123",
    preferredLanguage: "en",
    acceptedTerms: true,
    acceptedPrivacy: true,
  });
  const registrationPayload = await register.json();
  const blockedLogin = await post("/login", {
    identifier: email,
    password: "password123",
  });
  const blockedPayload = await blockedLogin.json();

  assert.equal(blockedLogin.status, 403);
  assert.match(blockedPayload.error, /verification/i);
  assert.equal(blockedPayload.code, "EMAIL_VERIFICATION_REQUIRED");
  assert.equal(blockedPayload.data.requiresEmailVerification, true);

  const verify = await fetch(
    `${baseUrl}/verify-email?token=${registrationPayload.data.debug.emailVerificationToken}`,
  );
  const verifyPayload = await verify.json();
  assert.equal(verify.status, 200);
  assert.equal(verifyPayload.data.ok, true);

  const login = await post("/login", {
    identifier: email,
    password: "password123",
  });
  const loginPayload = await login.json();
  assert.equal(login.status, 200);
  assert.equal(loginPayload.data.user.emailVerified, true);
  assert.equal(loginPayload.data.user.passwordHash, undefined);
  assert.ok(loginPayload.data.session.id);
});

test("expired verification token fails", async () => {
  const register = await post("/register/customer", {
    name: "Expired Token User",
    email: uniqueEmail("expired"),
    password: "password123",
    preferredLanguage: "en",
    acceptedTerms: true,
    acceptedPrivacy: true,
    debugVerificationExpiresAt: new Date(Date.now() - 1000).toISOString(),
  });
  const payload = await register.json();
  const verify = await fetch(
    `${baseUrl}/verify-email?token=${payload.data.debug.emailVerificationToken}`,
  );

  assert.equal(verify.status, 400);
});

test("resend verification works without leaking account existence", async () => {
  const email = uniqueEmail("resend");
  const register = await post("/register/customer", {
    name: "Resend User",
    email,
    password: "password123",
    preferredLanguage: "en",
    acceptedTerms: true,
    acceptedPrivacy: true,
  });
  await register.json();

  const response = await post("/resend-verification", { email });
  const payload = await response.json();
  const missing = await post("/resend-verification", {
    email: uniqueEmail("missing"),
  });

  assert.equal(response.status, 200);
  assert.equal(payload.data.ok, true);
  assert.ok(payload.data.debug.emailVerificationToken);
  assert.equal(missing.status, 200);
});

test("registering again with an unverified email resends verification instead of blocking", async () => {
  const email = uniqueEmail("repeat-unverified");
  const first = await post("/register/customer", {
    name: "Repeat User",
    email,
    password: "password123",
    preferredLanguage: "en",
    acceptedTerms: true,
    acceptedPrivacy: true,
  });
  assert.equal(first.status, 201);

  const second = await post("/register/customer", {
    name: "Repeat User",
    email,
    password: "password123",
    preferredLanguage: "en",
    acceptedTerms: true,
    acceptedPrivacy: true,
  });
  const payload = await second.json();

  assert.equal(second.status, 202);
  assert.equal(payload.data.resent, true);
  assert.equal(payload.data.requiresEmailVerification, true);
});

test("registering again with an unverified email updates the pending password", async () => {
  const email = uniqueEmail("repeat-password");
  const first = await post("/register/customer", {
    name: "Repeat Password User",
    email,
    password: "old-password",
    preferredLanguage: "en",
    acceptedTerms: true,
    acceptedPrivacy: true,
  });
  assert.equal(first.status, 201);

  const second = await post("/register/customer", {
    name: "Repeat Password User",
    email,
    password: "new-password",
    preferredLanguage: "en",
    acceptedTerms: true,
    acceptedPrivacy: true,
  });
  const secondPayload = await second.json();
  await fetch(
    `${baseUrl}/verify-email?token=${secondPayload.data.debug.emailVerificationToken}`,
  );

  const oldLogin = await post("/login", {
    identifier: email,
    password: "old-password",
  });
  const newLogin = await post("/login", {
    identifier: email,
    password: "new-password",
  });

  assert.equal(second.status, 202);
  assert.equal(oldLogin.status, 401);
  assert.equal(newLogin.status, 200);
});

test("forgot password creates reset token and reset changes password", async () => {
  const email = uniqueEmail("reset");
  const register = await post("/register/customer", {
    name: "Reset User",
    email,
    password: "old-password",
    preferredLanguage: "en",
    acceptedTerms: true,
    acceptedPrivacy: true,
  });
  const registrationPayload = await register.json();
  await fetch(
    `${baseUrl}/verify-email?token=${registrationPayload.data.debug.emailVerificationToken}`,
  );

  const oldLogin = await post("/login", {
    identifier: email,
    password: "old-password",
  });
  assert.equal(oldLogin.status, 200);

  const forgot = await post("/forgot-password", { email });
  const forgotPayload = await forgot.json();
  assert.equal(forgot.status, 200);
  assert.ok(forgotPayload.data.debug.passwordResetToken);

  const reset = await post("/reset-password", {
    token: forgotPayload.data.debug.passwordResetToken,
    newPassword: "new-password",
  });
  assert.equal(reset.status, 200);

  const oldPasswordLogin = await post("/login", {
    identifier: email,
    password: "old-password",
  });
  assert.equal(oldPasswordLogin.status, 401);

  const newPasswordLogin = await post("/login", {
    identifier: email,
    password: "new-password",
  });
  assert.equal(newPasswordLogin.status, 200);
});

test("staff creation requires owner or manager and links staff to restaurantId", async () => {
  const ownerLogin = await post("/login", {
    identifier: "owner@bistro.local",
    password: "password",
  });
  const ownerPayload = await ownerLogin.json();

  const unauthorized = await post("/register/staff", {
    name: "Unauthorized Staff",
    email: uniqueEmail("unauthorized"),
    role: "viewer",
    restaurantId: "rst_bistro_01",
  });
  assert.equal(unauthorized.status, 401);

  const staff = await fetch(`${baseUrl}/restaurants/rst_bistro_01/staff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": ownerPayload.data.session.id,
    },
    body: JSON.stringify({
      name: "Kitchen User",
      email: uniqueEmail("kitchen"),
      username: uniqueUsername("kitchen"),
      staffRole: "kitchen",
      preferredLanguage: "ru",
    }),
  });
  const payload = await staff.json();

  assert.equal(staff.status, 201);
  assert.equal(payload.data.user.role, "staff");
  assert.equal(payload.data.user.staffRole, "kitchen");
  assert.equal(payload.data.user.restaurantId, "rst_bistro_01");
  assert.deepEqual(payload.data.user.permissions, [
    "orders:read",
    "orders:update",
    "kitchen:read",
  ]);
});

test("user cannot access another restaurant staff data", async () => {
  const ownerLogin = await post("/login", {
    identifier: "owner@bistro.local",
    password: "password",
  });
  const ownerPayload = await ownerLogin.json();
  const response = await fetch(`${baseUrl}/restaurants/rst_other/staff`, {
    headers: { "x-session-id": ownerPayload.data.session.id },
  });

  assert.equal(response.status, 403);
});

test("password hash is used and never returned from login", async () => {
  const login = await post("/login", {
    identifier: "customer@babili.local",
    password: "password",
  });
  const payload = await login.json();

  assert.equal(login.status, 200);
  assert.equal(payload.data.user.passwordHash, undefined);
  assert.ok(!JSON.stringify(payload).includes("password_hash"));
});

test("authenticated user can delete own account and old session stops working", async () => {
  const email = uniqueEmail("delete-account");
  const register = await post("/register/customer", {
    name: "Delete Account User",
    email,
    password: "password123",
    preferredLanguage: "en",
    acceptedTerms: true,
    acceptedPrivacy: true,
  });
  const registerPayload = await register.json();
  await fetch(
    `${baseUrl}/verify-email?token=${registerPayload.data.debug.emailVerificationToken}`,
  );

  const login = await post("/login", {
    identifier: email,
    password: "password123",
  });
  const loginPayload = await login.json();
  const sessionId = loginPayload.data.session.id;
  const deleted = await fetch(`${baseUrl}/account`, {
    method: "DELETE",
    headers: { "x-session-id": sessionId },
  });
  const deletedPayload = await deleted.json();
  const oldSession = await fetch(`${baseUrl}/session/${sessionId}`);

  assert.equal(deleted.status, 200);
  assert.equal(deletedPayload.data.ok, true);
  assert.equal(oldSession.status, 401);
});

async function post(path: string, body: Record<string, unknown>) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@babili.local`;
}

function uniqueUsername(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
