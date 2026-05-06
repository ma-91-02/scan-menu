import cors from "cors";
import express from "express";
import type { StaffRole, UserRole } from "@scanmenu/shared";
import {
  createRestaurantDb,
  createRestaurantStaffDb,
  createSessionDb,
  createUserDb,
  deleteSessionDb,
  deleteSessionsForUserDb,
  findUserByPasswordResetTokenDb,
  findUserByVerificationTokenDb,
  findUserDb,
  getRestaurantStaffForUserDb,
  getSessionDb,
  getStaffForRestaurantDb,
  getUsersDb,
  hasAuthDb,
  initAuthDatabase,
  markAuthDbUnavailable,
  updateUserDb,
  type AuthSessionRecord,
  type AuthUserRecord,
  type RestaurantAuthRecord,
  type RestaurantStaffRecord
} from "./db.js";
import { getEmailConfigStatus, sendPasswordResetEmail, sendVerificationEmail } from "./email.js";
import {
  createEmailVerificationToken,
  createId,
  createPasswordResetToken,
  createSessionToken,
  hashEmailToken,
  hashPassword,
  hashToken,
  verifyPassword
} from "./security.js";

const port = Number(process.env.AUTH_SERVICE_PORT ?? 4101);
const defaultDemoPassword = process.env.SCANMENU_DEMO_PASSWORD ?? "password";
const termsVersion = "1.0";
const privacyVersion = "1.0";
const verificationTtlMs = 1000 * 60 * 60 * 24;
const passwordResetTtlMs = 1000 * 60 * 30;
const sessionTtlMs = 1000 * 60 * 60 * 8;
const restaurantRoles = ["owner", "manager", "cashier", "kitchen", "waiter", "viewer"] as const;

const rolePermissions: Record<StaffRole, string[]> = {
  owner: ["*"],
  manager: ["menu:write", "orders:read", "orders:update", "staff:write", "profile:write"],
  cashier: ["orders:read", "orders:update", "payments:write", "cashier:read"],
  kitchen: ["orders:read", "orders:update", "kitchen:read"],
  waiter: ["orders:read", "waiter:read", "waiter:update"],
  viewer: ["orders:read"]
};

const users: AuthUserRecord[] = [];
const restaurants: RestaurantAuthRecord[] = [];
const restaurantStaff: RestaurantStaffRecord[] = [];
const sessions = new Map<string, AuthSessionRecord>();

const dbReady = prepareSeedData()
  .then((seed) => initAuthDatabase(seed.users, seed.restaurants, seed.staff))
  .catch((error) => {
    markAuthDbUnavailable();
    console.error("Auth database init failed; using in-memory fallback", error);
  });

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      data: {
        service: "auth-service",
        status: "ok",
        database: hasAuthDb() ? "postgres" : "memory",
        email: getEmailConfigStatus(),
        publicWebUrl: process.env.PUBLIC_WEB_URL ?? "http://localhost:3000",
        publicApiUrl: process.env.PUBLIC_API_URL ?? "http://localhost:4000"
      }
    });
  });

  app.get("/users", async (_req, res) => {
    await dbReady;
    const sourceUsers = hasAuthDb() ? await getUsersDb() : users;
    res.json({ data: sourceUsers.map(toPublicUser) });
  });

  app.get("/permissions", (_req, res) => {
    res.json({ data: rolePermissions });
  });

  app.post("/register/customer", async (req, res) => {
    await dbReady;
    const input = normalizeCustomerRegistration(req.body);
    const consentError = validateConsent(input);
    if (consentError) {
      res.status(400).json({ error: consentError });
      return;
    }

    if (!input.name || !input.email || !input.password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    if (await isIdentityTaken({ email: input.email, username: input.username })) {
      res.status(409).json({ error: "Email or username is already registered" });
      return;
    }

    const verificationToken = createEmailVerificationToken();
    const user = await buildUser({
      name: input.name,
      username: input.username,
      email: input.email,
      phone: input.phone,
      password: input.password,
      role: "customer",
      preferredLanguage: input.preferredLanguage,
      acceptedTerms: input.acceptedTerms,
      acceptedPrivacy: input.acceptedPrivacy,
      verificationToken,
      verificationExpiresAt: input.debugVerificationExpiresAt
    });

    await saveUser(user);
    await sendVerificationEmail({ to: user.email, language: user.preferredLanguage, name: user.name, token: verificationToken });

    res.status(201).json({
      data: {
        user: toPublicUser(user),
        requiresEmailVerification: true,
        message: "Please verify your email before signing in.",
        ...debugTokens({ emailVerificationToken: verificationToken })
      }
    });
  });

  app.post("/register/restaurant-owner", async (req, res) => {
    await dbReady;
    const input = normalizeRestaurantOwnerRegistration(req.body);
    const consentError = validateConsent(input);
    if (consentError) {
      res.status(400).json({ error: consentError });
      return;
    }

    if (!input.name || !input.email || !input.password || !input.restaurantName) {
      res.status(400).json({ error: "Name, email, password, and restaurant name are required" });
      return;
    }

    if (await isIdentityTaken({ email: input.email, username: input.username })) {
      res.status(409).json({ error: "Email or username is already registered" });
      return;
    }

    const verificationToken = createEmailVerificationToken();
    const restaurantId = createId("rst");
    const user = await buildUser({
      name: input.name,
      username: input.username,
      email: input.email,
      phone: input.phone,
      password: input.password,
      role: "restaurant_owner",
      preferredLanguage: input.preferredLanguage,
      restaurantId,
      restaurantName: input.restaurantName,
      staffRole: "owner",
      permissions: rolePermissions.owner,
      acceptedTerms: input.acceptedTerms,
      acceptedPrivacy: input.acceptedPrivacy,
      verificationToken,
      verificationExpiresAt: input.debugVerificationExpiresAt
    });
    const restaurant: RestaurantAuthRecord = {
      id: restaurantId,
      ownerId: user.id,
      name: input.restaurantName,
      slug: uniqueSlug(input.restaurantName),
      operatingLanguage: input.preferredLanguage,
      country: input.country,
      city: input.city,
      address: input.address,
      phone: input.phone,
      email: input.email,
      planId: "basic"
    };
    const staff = buildStaffLink(restaurantId, user.id, "owner");

    await saveUser(user);
    await saveRestaurant(restaurant);
    await saveStaff(staff);
    await sendVerificationEmail({ to: user.email, language: user.preferredLanguage, name: user.name, token: verificationToken });

    res.status(201).json({
      data: {
        user: toPublicUser(user),
        restaurant,
        staff,
        requiresEmailVerification: true,
        message: "Please verify your email before signing in.",
        ...debugTokens({ emailVerificationToken: verificationToken })
      }
    });
  });

  app.post("/register/restaurant", async (req, res) => {
    await dbReady;
    const input = normalizeRestaurantOwnerRegistration({
      ...req.body,
      name: `${String(req.body.firstName ?? "").trim()} ${String(req.body.lastName ?? "").trim()}`.trim(),
      acceptedTerms: req.body.acceptedTerms ?? req.body.termsAccepted,
      acceptedPrivacy: req.body.acceptedPrivacy ?? req.body.privacyAccepted
    });
    await registerRestaurantOwner(input, res);
  });

  app.post("/restaurants/:restaurantId/staff", async (req, res) => {
    await dbReady;
    const actor = await requireAuth(req, res);
    if (!actor) return;

    const restaurantId = req.params.restaurantId;
    if (!requireStaffRole(actor, restaurantId, ["owner", "manager"], res)) return;

    const input = normalizeStaffRegistration(req.body, restaurantId);
    if (!input.name || !input.email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }

    if (await isIdentityTaken({ email: input.email, username: input.username })) {
      res.status(409).json({ error: "Email or username is already registered" });
      return;
    }

    const verificationToken = createEmailVerificationToken();
    const password = input.password || createPasswordResetToken();
    const user = await buildUser({
      name: input.name,
      username: input.username,
      email: input.email,
      phone: input.phone,
      password,
      role: "staff",
      preferredLanguage: input.preferredLanguage,
      restaurantId,
      restaurantName: actor.restaurantName,
      staffRole: input.staffRole,
      permissions: rolePermissions[input.staffRole],
      acceptedTerms: true,
      acceptedPrivacy: true,
      verificationToken
    });
    const staff = buildStaffLink(restaurantId, user.id, input.staffRole);

    await saveUser(user);
    await saveStaff(staff);
    await sendVerificationEmail({ to: user.email, language: user.preferredLanguage, name: user.name, token: verificationToken });

    res.status(201).json({
      data: {
        user: toPublicUser(user),
        staff,
        temporaryPasswordIssued: !input.password,
        ...debugTokens({ emailVerificationToken: verificationToken })
      }
    });
  });

  app.post("/register/staff", async (req, res) => {
    await dbReady;
    const actor = await requireAuth(req, res);
    if (!actor) return;

    const restaurantId = String(req.body.restaurantId ?? "");
    if (!requireStaffRole(actor, restaurantId, ["owner", "manager"], res)) return;
    await registerStaff(normalizeStaffRegistration(req.body, restaurantId), actor, restaurantId, res);
  });

  app.get("/restaurants/:restaurantId/staff", async (req, res) => {
    await dbReady;
    const actor = await requireAuth(req, res);
    if (!actor) return;
    if (!requireRestaurantAccess(actor, req.params.restaurantId, res)) return;
    if (!requirePermission(actor, "staff:write", res) && actor.staffRole !== "owner") return;

    const staffUsers = hasAuthDb()
      ? await getStaffForRestaurantDb(req.params.restaurantId)
      : users.filter((user) => user.restaurantId === req.params.restaurantId && (user.role === "staff" || user.role === "restaurant_owner"));
    res.json({ data: staffUsers.map(toPublicUser) });
  });

  app.post("/login", async (req, res) => {
    await dbReady;
    const identifier = String(req.body.identifier ?? req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    if (!identifier || !password) {
      res.status(400).json({ error: "Email, username, or phone and password are required" });
      return;
    }

    const user = await findUserByIdentifier(identifier);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid login credentials" });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({ error: "Email verification is required before login" });
      return;
    }

    const session = await createSession(user.id);
    res.json({
      data: {
        user: toPublicUser(user),
        session: toPublicSession(session),
        accessToken: session.id,
        redirectTo: getRedirectForRole(user)
      }
    });
  });

  app.get("/verify-email", async (req, res) => {
    await dbReady;
    const token = String(req.query.token ?? "");
    const user = token ? await findUserByVerificationToken(token) : undefined;

    if (!user || !user.emailVerificationExpiresAt || new Date(user.emailVerificationExpiresAt).getTime() < Date.now()) {
      res.status(400).json({ error: "Verification link is invalid or expired" });
      return;
    }

    const nextUser: AuthUserRecord = {
      ...user,
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      emailVerificationTokenHash: undefined,
      emailVerificationExpiresAt: undefined
    };
    await updateUser(nextUser);

    res.json({ data: { ok: true, message: "Email verified. You can sign in now." } });
  });

  app.post("/resend-verification", async (req, res) => {
    await dbReady;
    const email = normalizeEmail(req.body.email);
    const user = email ? await findUserByIdentifier(email) : undefined;

    if (user && !user.emailVerified) {
      const verificationToken = createEmailVerificationToken();
      await updateUser({
        ...user,
        emailVerificationTokenHash: hashEmailToken(verificationToken),
        emailVerificationExpiresAt: expiresIn(verificationTtlMs)
      });
      await sendVerificationEmail({ to: user.email, language: user.preferredLanguage, name: user.name, token: verificationToken });
      res.json({ data: { ok: true, ...debugTokens({ emailVerificationToken: verificationToken }) } });
      return;
    }

    res.json({ data: { ok: true } });
  });

  app.post("/forgot-password", async (req, res) => {
    await dbReady;
    const email = normalizeEmail(req.body.email);
    const user = email ? await findUserByIdentifier(email) : undefined;

    if (user) {
      const resetToken = createPasswordResetToken();
      await updateUser({
        ...user,
        passwordResetTokenHash: hashToken(resetToken),
        passwordResetExpiresAt: expiresIn(passwordResetTtlMs)
      });
      await sendPasswordResetEmail({ to: user.email, language: user.preferredLanguage, name: user.name, token: resetToken });
      res.json({ data: { ok: true, ...debugTokens({ passwordResetToken: resetToken }) } });
      return;
    }

    res.json({ data: { ok: true } });
  });

  app.post("/reset-password", async (req, res) => {
    await dbReady;
    const token = String(req.body.token ?? "");
    const newPassword = String(req.body.newPassword ?? "");
    const user = token ? await findUserByPasswordResetToken(token) : undefined;

    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" });
      return;
    }

    if (!user || !user.passwordResetExpiresAt || new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
      res.status(400).json({ error: "Password reset link is invalid or expired" });
      return;
    }

    await updateUser({
      ...user,
      passwordHash: await hashPassword(newPassword),
      passwordResetTokenHash: undefined,
      passwordResetExpiresAt: undefined
    });
    await deleteSessionsForUser(user.id);

    res.json({ data: { ok: true, message: "Password updated. Please sign in again." } });
  });

  app.get("/session/:sessionId", async (req, res) => {
    await dbReady;
    const session = hasAuthDb() ? await getSessionDb(req.params.sessionId) : sessions.get(hashToken(req.params.sessionId));

    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      if (session) await deleteSession(req.params.sessionId);
      res.status(401).json({ error: "Session expired or not found" });
      return;
    }

    const user = await findUserById(session.userId);
    if (!user) {
      await deleteSession(req.params.sessionId);
      res.status(401).json({ error: "Session user not found" });
      return;
    }

    res.json({
      data: {
        session: toPublicSession(session),
        user: toPublicUser(user),
        redirectTo: getRedirectForRole(user)
      }
    });
  });

  app.post("/logout", async (req, res) => {
    await dbReady;
    const sessionId = String(req.body.sessionId ?? "");
    if (sessionId) await deleteSession(sessionId);
    res.json({ data: { ok: true } });
  });

  return app;
}

async function registerRestaurantOwner(input: ReturnType<typeof normalizeRestaurantOwnerRegistration>, res: express.Response) {
  const consentError = validateConsent(input);
  if (consentError) {
    res.status(400).json({ error: consentError });
    return;
  }

  if (!input.name || !input.email || !input.password || !input.restaurantName) {
    res.status(400).json({ error: "Name, email, password, and restaurant name are required" });
    return;
  }

  if (await isIdentityTaken({ email: input.email, username: input.username })) {
    res.status(409).json({ error: "Email or username is already registered" });
    return;
  }

  const verificationToken = createEmailVerificationToken();
  const restaurantId = createId("rst");
  const user = await buildUser({
    name: input.name,
    username: input.username,
    email: input.email,
    phone: input.phone,
    password: input.password,
    role: "restaurant_owner",
    preferredLanguage: input.preferredLanguage,
    restaurantId,
    restaurantName: input.restaurantName,
    staffRole: "owner",
    permissions: rolePermissions.owner,
    acceptedTerms: input.acceptedTerms,
    acceptedPrivacy: input.acceptedPrivacy,
    verificationToken,
    verificationExpiresAt: input.debugVerificationExpiresAt
  });
  const restaurant: RestaurantAuthRecord = {
    id: restaurantId,
    ownerId: user.id,
    name: input.restaurantName,
    slug: uniqueSlug(input.restaurantName),
    operatingLanguage: input.preferredLanguage,
    country: input.country,
    city: input.city,
    address: input.address,
    phone: input.phone,
    email: input.email,
    planId: "basic"
  };
  const staff = buildStaffLink(restaurantId, user.id, "owner");

  await saveUser(user);
  await saveRestaurant(restaurant);
  await saveStaff(staff);
  await sendVerificationEmail({ to: user.email, language: user.preferredLanguage, name: user.name, token: verificationToken });

  res.status(201).json({
    data: {
      user: toPublicUser(user),
      restaurant,
      staff,
      requiresEmailVerification: true,
      message: "Please verify your email before signing in.",
      ...debugTokens({ emailVerificationToken: verificationToken })
    }
  });
}

async function registerStaff(input: ReturnType<typeof normalizeStaffRegistration>, actor: AuthUserRecord, restaurantId: string, res: express.Response) {
  if (!input.name || !input.email) {
    res.status(400).json({ error: "Name and email are required" });
    return;
  }

  if (await isIdentityTaken({ email: input.email, username: input.username })) {
    res.status(409).json({ error: "Email or username is already registered" });
    return;
  }

  const verificationToken = createEmailVerificationToken();
  const password = input.password || createPasswordResetToken();
  const user = await buildUser({
    name: input.name,
    username: input.username,
    email: input.email,
    phone: input.phone,
    password,
    role: "staff",
    preferredLanguage: input.preferredLanguage,
    restaurantId,
    restaurantName: actor.restaurantName,
    staffRole: input.staffRole,
    permissions: rolePermissions[input.staffRole],
    acceptedTerms: true,
    acceptedPrivacy: true,
    verificationToken
  });
  const staff = buildStaffLink(restaurantId, user.id, input.staffRole);

  await saveUser(user);
  await saveStaff(staff);
  await sendVerificationEmail({ to: user.email, language: user.preferredLanguage, name: user.name, token: verificationToken });

  res.status(201).json({
    data: {
      user: toPublicUser(user),
      staff,
      temporaryPasswordIssued: !input.password,
      ...debugTokens({ emailVerificationToken: verificationToken })
    }
  });
}

async function requireAuth(req: express.Request, res: express.Response) {
  const token = String(req.header("x-session-id") ?? req.header("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  if (!token) {
    res.status(401).json({ error: "Authentication is required" });
    return undefined;
  }

  const session = hasAuthDb() ? await getSessionDb(token) : sessions.get(hashToken(token));
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
    res.status(401).json({ error: "Session expired or not found" });
    return undefined;
  }

  const user = await findUserById(session.userId);
  if (!user) {
    res.status(401).json({ error: "Session user not found" });
    return undefined;
  }

  return user;
}

function requireRestaurantAccess(user: AuthUserRecord, restaurantId: string, res: express.Response) {
  if (user.role === "platform_owner") return true;
  if (user.restaurantId === restaurantId) return true;
  res.status(403).json({ error: "Restaurant access is denied" });
  return false;
}

function requireStaffRole(user: AuthUserRecord, restaurantId: string, roles: StaffRole[], res: express.Response) {
  if (!requireRestaurantAccess(user, restaurantId, res)) return false;
  if (user.role === "restaurant_owner" && roles.includes("owner")) return true;
  if (user.staffRole && roles.includes(user.staffRole)) return true;
  res.status(403).json({ error: "Required staff role is missing" });
  return false;
}

function requirePermission(user: AuthUserRecord, permission: string, res: express.Response) {
  if (user.permissions?.includes("*") || user.permissions?.includes(permission)) return true;
  res.status(403).json({ error: "Required permission is missing" });
  return false;
}

async function buildUser(input: {
  name: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  preferredLanguage: string;
  restaurantId?: string;
  restaurantName?: string;
  staffRole?: StaffRole;
  permissions?: string[];
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  verificationToken: string;
  verificationExpiresAt?: string;
}): Promise<AuthUserRecord> {
  const now = new Date().toISOString();
  return {
    id: createId("usr"),
    name: input.name,
    username: input.username,
    email: input.email,
    phone: input.phone,
    passwordHash: await hashPassword(input.password),
    role: input.role,
    preferredLanguage: input.preferredLanguage,
    emailVerified: false,
    emailVerificationTokenHash: hashEmailToken(input.verificationToken),
    emailVerificationExpiresAt: input.verificationExpiresAt ?? expiresIn(verificationTtlMs),
    acceptedTerms: input.acceptedTerms,
    acceptedTermsAt: now,
    termsVersion,
    acceptedPrivacy: input.acceptedPrivacy,
    acceptedPrivacyAt: now,
    privacyVersion,
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName,
    staffRole: input.staffRole,
    permissions: input.permissions ?? []
  };
}

function normalizeCustomerRegistration(body: Record<string, unknown>) {
  const email = normalizeEmail(body.email);
  return {
    name: String(body.name ?? "").trim(),
    email,
    username: uniqueUsername(String(body.username ?? email.split("@")[0] ?? "customer")),
    phone: cleanOptional(body.phone),
    password: String(body.password ?? ""),
    preferredLanguage: normalizeLanguage(body.preferredLanguage),
    acceptedTerms: Boolean(body.acceptedTerms ?? body.termsAccepted),
    acceptedPrivacy: Boolean(body.acceptedPrivacy ?? body.privacyAccepted),
    debugVerificationExpiresAt: debugDate(body.debugVerificationExpiresAt)
  };
}

function normalizeRestaurantOwnerRegistration(body: Record<string, unknown>) {
  const email = normalizeEmail(body.email);
  const name = String(body.name ?? `${String(body.firstName ?? "").trim()} ${String(body.lastName ?? "").trim()}`).trim();
  const restaurantName = String(body.restaurantName ?? "").trim();
  return {
    name,
    email,
    username: uniqueUsername(String(body.username ?? email.split("@")[0] ?? restaurantName ?? "owner")),
    phone: cleanOptional(body.phone),
    password: String(body.password ?? ""),
    restaurantName,
    preferredLanguage: normalizeLanguage(body.preferredLanguage),
    acceptedTerms: Boolean(body.acceptedTerms ?? body.termsAccepted),
    acceptedPrivacy: Boolean(body.acceptedPrivacy ?? body.privacyAccepted),
    debugVerificationExpiresAt: debugDate(body.debugVerificationExpiresAt),
    country: cleanOptional(body.country),
    city: cleanOptional(body.city),
    address: cleanOptional(body.address)
  };
}

function normalizeStaffRegistration(body: Record<string, unknown>, restaurantId: string) {
  const email = normalizeEmail(body.email);
  const requestedRole = String(body.staffRole ?? body.role ?? "viewer");
  const staffRole = restaurantRoles.includes(requestedRole as StaffRole) ? requestedRole as StaffRole : "viewer";
  return {
    name: String(body.name ?? "").trim(),
    email,
    username: uniqueUsername(String(body.username ?? email.split("@")[0] ?? "staff")),
    phone: cleanOptional(body.phone),
    password: cleanOptional(body.password),
    preferredLanguage: normalizeLanguage(body.preferredLanguage),
    restaurantId,
    staffRole
  };
}

function validateConsent(input: { acceptedTerms: boolean; acceptedPrivacy: boolean }) {
  if (!input.acceptedTerms || !input.acceptedPrivacy) {
    return "Terms of Use and Privacy Policy consent is required";
  }
  return "";
}

async function createSession(userId: string) {
  const token = createSessionToken();
  const now = new Date();
  const session: AuthSessionRecord = {
    id: token,
    userId,
    tokenHash: hashToken(token),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + sessionTtlMs).toISOString()
  };

  if (hasAuthDb()) await createSessionDb(session);
  else sessions.set(session.tokenHash, session);
  return session;
}

async function prepareSeedData() {
  if (users.length > 0) return { users, restaurants, staff: restaurantStaff };

  const passwordHash = await hashPassword(defaultDemoPassword);
  const now = new Date().toISOString();
  const seedUsers: AuthUserRecord[] = [
    seedUser("usr_platform_owner", "Mohamed", "scanmenu-admin", "owner@scanmenu.local", "platform_owner", "ar", passwordHash, now),
    seedUser("usr_restaurant_owner", "Anna Petrova", "bistro-owner", "owner@bistro.local", "restaurant_owner", "ru", passwordHash, now, {
      restaurantId: "rst_bistro_01",
      restaurantName: "Bistro Aurora",
      staffRole: "owner",
      permissions: rolePermissions.owner
    }),
    seedUser("usr_staff_kitchen", "Ivan Kitchen", "bistro-kitchen", "kitchen@bistro.local", "staff", "ru", passwordHash, now, {
      restaurantId: "rst_bistro_01",
      restaurantName: "Bistro Aurora",
      staffRole: "kitchen",
      permissions: rolePermissions.kitchen
    }),
    seedUser("usr_staff_cashier", "Mira Cashier", "bistro-cashier", "cashier@bistro.local", "staff", "en", passwordHash, now, {
      restaurantId: "rst_bistro_01",
      restaurantName: "Bistro Aurora",
      staffRole: "cashier",
      permissions: rolePermissions.cashier
    }),
    seedUser("usr_customer", "Omar Ali", "omar-customer", "customer@scanmenu.local", "customer", "ar", passwordHash, now)
  ];
  const seedRestaurants: RestaurantAuthRecord[] = [{
    id: "rst_bistro_01",
    ownerId: "usr_restaurant_owner",
    name: "Bistro Aurora",
    slug: "bistro-aurora",
    operatingLanguage: "ru",
    country: "Russia",
    city: "Moscow",
    address: "Tverskaya 10",
    phone: "+7 900 100 20 30",
    email: "owner@bistro.local",
    planId: "premium"
  }];
  const seedStaff = [
    buildStaffLink("rst_bistro_01", "usr_restaurant_owner", "owner"),
    buildStaffLink("rst_bistro_01", "usr_staff_kitchen", "kitchen"),
    buildStaffLink("rst_bistro_01", "usr_staff_cashier", "cashier")
  ];

  users.push(...seedUsers);
  restaurants.push(...seedRestaurants);
  restaurantStaff.push(...seedStaff);
  return { users: seedUsers, restaurants: seedRestaurants, staff: seedStaff };
}

function seedUser(
  id: string,
  name: string,
  username: string,
  email: string,
  role: UserRole,
  preferredLanguage: string,
  passwordHash: string,
  now: string,
  extra: Partial<AuthUserRecord> = {}
): AuthUserRecord {
  return {
    id,
    name,
    username,
    email,
    role,
    preferredLanguage,
    passwordHash,
    emailVerified: true,
    emailVerifiedAt: now,
    acceptedTerms: true,
    acceptedTermsAt: now,
    termsVersion,
    acceptedPrivacy: true,
    acceptedPrivacyAt: now,
    privacyVersion,
    permissions: [],
    ...extra
  };
}

function buildStaffLink(restaurantId: string, userId: string, staffRole: StaffRole): RestaurantStaffRecord {
  return {
    id: createId("stf"),
    restaurantId,
    userId,
    staffRole,
    permissions: rolePermissions[staffRole]
  };
}

async function saveUser(user: AuthUserRecord) {
  if (hasAuthDb()) await createUserDb(user);
  else users.push(user);
}

async function updateUser(user: AuthUserRecord) {
  if (hasAuthDb()) return updateUserDb(user);
  const index = users.findIndex((item) => item.id === user.id);
  if (index >= 0) users[index] = user;
  return user;
}

async function saveRestaurant(restaurant: RestaurantAuthRecord) {
  if (hasAuthDb()) await createRestaurantDb(restaurant);
  else restaurants.push(restaurant);
}

async function saveStaff(staff: RestaurantStaffRecord) {
  if (hasAuthDb()) await createRestaurantStaffDb(staff);
  else restaurantStaff.push(staff);
}

async function findUserByIdentifier(identifier: string) {
  if (hasAuthDb()) return findUserDb({ email: identifier, phone: identifier, username: identifier });
  return users.find((item) => item.email === identifier || item.username === identifier || item.phone === identifier);
}

async function findUserById(id: string) {
  if (hasAuthDb()) return findUserDb({ id });
  return users.find((item) => item.id === id);
}

async function findUserByVerificationToken(token: string) {
  if (hasAuthDb()) return findUserByVerificationTokenDb(token);
  return users.find((user) => user.emailVerificationTokenHash === hashToken(token));
}

async function findUserByPasswordResetToken(token: string) {
  if (hasAuthDb()) return findUserByPasswordResetTokenDb(token);
  return users.find((user) => user.passwordResetTokenHash === hashToken(token));
}

async function deleteSession(token: string) {
  if (hasAuthDb()) await deleteSessionDb(token);
  else sessions.delete(hashToken(token));
}

async function deleteSessionsForUser(userId: string) {
  if (hasAuthDb()) await deleteSessionsForUserDb(userId);
  else {
    for (const [tokenHash, session] of sessions.entries()) {
      if (session.userId === userId) sessions.delete(tokenHash);
    }
  }
}

async function isIdentityTaken(identity: { email: string; username: string; phone?: string }) {
  if (hasAuthDb()) return Boolean(await findUserDb(identity));
  return users.some((item) => item.email === identity.email || item.username === identity.username || (identity.phone ? item.phone === identity.phone : false));
}

function toPublicUser(user: AuthUserRecord) {
  const { passwordHash, emailVerificationTokenHash, passwordResetTokenHash, ...publicUser } = user;
  return publicUser;
}

function toPublicSession(session: AuthSessionRecord) {
  return {
    id: session.id,
    userId: session.userId,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt
  };
}

function getRedirectForRole(user: AuthUserRecord) {
  if (user.role === "platform_owner") return "/admin";
  if (user.role === "restaurant_owner") return "/restaurant";
  if (user.role === "staff") return roleRedirect(user.staffRole);
  if (user.role === "accountant") return "/staff";
  if (["delivery_partner", "farmer_partner", "supplier_partner"].includes(user.role)) return "/partners";
  if (user.role === "customer") return "/customer";
  return "/";
}

function roleRedirect(staffRole?: StaffRole) {
  if (staffRole === "kitchen") return "/restaurant?tab=kitchen";
  if (staffRole === "cashier") return "/restaurant?tab=cashier";
  return "/staff";
}

function expiresIn(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeLanguage(value: unknown) {
  return String(value ?? "en").trim().toLowerCase() || "en";
}

function cleanOptional(value: unknown) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function debugDate(value: unknown) {
  if (!process.env.SCANMENU_SKIP_LISTEN && process.env.NODE_ENV !== "test") return undefined;
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function uniqueUsername(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return normalized || `user-${Date.now()}`;
}

function uniqueSlug(value: string) {
  return `${uniqueUsername(value)}-${Date.now()}`;
}

function debugTokens(tokens: Record<string, string>) {
  if (process.env.SCANMENU_SKIP_LISTEN || process.env.NODE_ENV === "test") {
    return { debug: tokens };
  }
  return {};
}

const app = createApp();

if (!process.env.SCANMENU_SKIP_LISTEN) {
  app.listen(port, () => {
    console.log(`Auth service listening on http://localhost:${port}`);
  });
}
