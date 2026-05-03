import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { createApp } from "./server.js";

let server: Server;
let baseUrl: string;

before(() => {
  server = createApp().listen(0);
  const address = server.address();

  assert(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  server.close();
});

test("rejects customer registration without terms and privacy consent", async () => {
  const response = await fetch(`${baseUrl}/register/customer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Consent Test",
      email: `consent-${Date.now()}@scanmenu.local`,
      username: `consent-${Date.now()}`,
      preferredLanguage: "ar"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.match(payload.error, /consent/i);
});

test("registers customer with consent and returns customer redirect", async () => {
  const response = await fetch(`${baseUrl}/register/customer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Registered Customer",
      email: `registered-${Date.now()}@scanmenu.local`,
      username: `registered-${Date.now()}`,
      preferredLanguage: "ar",
      termsAccepted: true,
      privacyAccepted: true,
      consentAt: new Date().toISOString()
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.data.user.role, "customer");
  assert.equal(payload.data.redirectTo, "/customer");
});

test("rejects restaurant registration without terms and privacy consent", async () => {
  const response = await fetch(`${baseUrl}/register/restaurant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: "Owner",
      restaurantName: "Consent Bistro",
      username: `restaurant-consent-${Date.now()}`,
      phone: `+1555${Date.now()}`,
      email: `restaurant-consent-${Date.now()}@scanmenu.local`,
      password: "password",
      confirmPassword: "password",
      preferredLanguage: "en"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.match(payload.error, /consent/i);
});

test("logs in an existing customer to the customer area", async () => {
  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "customer@scanmenu.local",
      password: "password"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.data.user.role, "customer");
  assert.equal(payload.data.redirectTo, "/customer");
});

test("creates restaurant staff with role permissions", async () => {
  const response = await fetch(`${baseUrl}/register/staff`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Kitchen User",
      email: `kitchen-${Date.now()}@scanmenu.local`,
      username: `kitchen-${Date.now()}`,
      role: "kitchen",
      restaurantId: "rst_bistro_01",
      restaurantName: "Bistro Aurora",
      preferredLanguage: "ru"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.data.role, "kitchen");
  assert.deepEqual(payload.data.permissions, ["orders:read", "orders:update", "kitchen:read"]);
});
