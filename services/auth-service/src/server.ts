import cors from "cors";
import express from "express";
import type { UserRole } from "@scanmenu/shared";
import {
  createSessionDb,
  createUserDb,
  deleteSessionDb,
  findUserDb,
  getSessionDb,
  getUsersDb,
  hasAuthDb,
  initAuthDatabase,
  type AuthSessionRecord,
  type AuthUserRecord
} from "./db.js";

interface DemoUser {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  preferredLanguage: string;
  restaurantId?: string;
  restaurantName?: string;
  permissions?: string[];
}

interface DemoSession {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

const users: DemoUser[] = [
  {
    id: "usr_platform_owner",
    name: "Mohamed",
    username: "scanmenu-admin",
    email: "owner@scanmenu.local",
    role: "platform_owner",
    preferredLanguage: "ar"
  },
  {
    id: "usr_restaurant_owner",
    name: "Anna Petrova",
    username: "bistro-owner",
    email: "owner@bistro.local",
    role: "restaurant_owner",
    preferredLanguage: "ru",
    restaurantId: "rst_bistro_01",
    restaurantName: "Bistro Aurora"
  },
  {
    id: "usr_staff_kitchen",
    name: "Ivan Kitchen",
    username: "bistro-kitchen",
    email: "kitchen@bistro.local",
    role: "staff",
    preferredLanguage: "ru",
    restaurantId: "rst_bistro_01",
    restaurantName: "Bistro Aurora",
    permissions: ["orders:read", "orders:update", "kitchen:read"]
  },
  {
    id: "usr_staff_cashier",
    name: "Mira Cashier",
    username: "bistro-cashier",
    email: "cashier@bistro.local",
    role: "staff",
    preferredLanguage: "en",
    restaurantId: "rst_bistro_01",
    restaurantName: "Bistro Aurora",
    permissions: ["orders:read", "payments:read", "cashier:write"]
  },
  {
    id: "usr_customer",
    name: "Omar Ali",
    username: "omar-customer",
    email: "customer@scanmenu.local",
    role: "customer",
    preferredLanguage: "ar"
  },
  {
    id: "usr_delivery_partner",
    name: "Delivery Partner",
    username: "delivery-partner",
    email: "driver@scanmenu.local",
    role: "delivery_partner",
    preferredLanguage: "ar",
    permissions: ["delivery:read", "delivery:update"]
  },
  {
    id: "usr_farmer_partner",
    name: "Farm Partner",
    username: "farm-partner",
    email: "farmer@scanmenu.local",
    role: "farmer_partner",
    preferredLanguage: "ar",
    permissions: ["supply:read", "supply:write"]
  },
  {
    id: "usr_supplier_partner",
    name: "Grocery Supplier",
    username: "supplier-partner",
    email: "supplier@scanmenu.local",
    role: "supplier_partner",
    preferredLanguage: "ar",
    permissions: ["supply:read", "inventory:write"]
  }
];

const sessions = new Map<string, DemoSession>();
const restaurantRoles = ["owner", "manager", "cashier", "kitchen", "waiter", "viewer"] as const;
type RestaurantRole = (typeof restaurantRoles)[number];

const rolePermissions: Record<RestaurantRole, string[]> = {
  owner: ["*"],
  manager: ["menu:write", "orders:read", "orders:update", "staff:write", "profile:write"],
  cashier: ["orders:read", "orders:update", "payments:write", "cashier:read"],
  kitchen: ["orders:read", "orders:update", "kitchen:read"],
  waiter: ["orders:read", "waiter:read", "waiter:update"],
  viewer: ["orders:read"]
};

const port = Number(process.env.AUTH_SERVICE_PORT ?? 4101);
const dbReady = initAuthDatabase(users as AuthUserRecord[]).catch((error) => {
  console.error("Auth database init failed; using in-memory fallback", error);
});

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ data: { service: "auth-service", status: "ok" } });
  });

  app.get("/users", async (_req, res) => {
    await dbReady;
    res.json({ data: hasAuthDb() ? await getUsersDb() : users });
  });

  app.get("/permissions", (_req, res) => {
    res.json({ data: rolePermissions });
  });

  app.get("/restaurants/:restaurantId/staff", async (req, res) => {
    await dbReady;
    const sourceUsers = hasAuthDb() ? await getUsersDb() : users;
    res.json({
      data: sourceUsers.filter((user) => user.restaurantId === req.params.restaurantId && isRestaurantRole(user.role))
    });
  });

  app.post("/register/customer", async (req, res) => {
  await dbReady;
  const email = String(req.body.email ?? "customer@example.com").trim().toLowerCase();
  const username = uniqueUsername(String(req.body.username ?? email.split("@")[0] ?? "customer"));
  const phone = String(req.body.phone ?? "").trim();
  const termsAccepted = Boolean(req.body.termsAccepted);
  const privacyAccepted = Boolean(req.body.privacyAccepted);

  if (!termsAccepted || !privacyAccepted) {
    res.status(400).json({ error: "Terms of Use and Privacy Policy consent is required" });
    return;
  }

  if (await isIdentityTaken({ email, phone, username })) {
    res.status(409).json({ error: "Email, phone, or username is already registered" });
    return;
  }

  const user: DemoUser = {
    id: `usr_${Date.now()}`,
    name: String(req.body.name ?? "Customer"),
    username,
    email,
    phone,
    role: "customer",
    preferredLanguage: String(req.body.preferredLanguage ?? "en")
  };

  if (hasAuthDb()) await createUserDb(user);
  else users.push(user);
  const session = await createSession(user.id);

  res.status(201).json({
    data: {
      user,
      session,
      accessToken: session.id,
      redirectTo: getRedirectForRole(user.role)
    }
  });
  });

  app.post("/register/staff", async (req, res) => {
  await dbReady;
  const email = String(req.body.email ?? "staff@example.com").trim().toLowerCase();
  const username = uniqueUsername(String(req.body.username ?? email.split("@")[0] ?? "staff"));
  const requestedRole = String(req.body.role ?? "viewer");
  const role = restaurantRoles.includes(requestedRole as RestaurantRole) ? (requestedRole as RestaurantRole) : "viewer";
  const restaurantId = String(req.body.restaurantId ?? "rst_bistro_01");

  if (await isIdentityTaken({ email, username })) {
    res.status(409).json({ error: "Email, phone, or username is already registered" });
    return;
  }

  const user: DemoUser = {
    id: `usr_${Date.now()}`,
    name: String(req.body.name ?? "Staff Member"),
    username,
    email,
    role,
    preferredLanguage: String(req.body.preferredLanguage ?? "en"),
    restaurantId,
    restaurantName: String(req.body.restaurantName ?? "Bistro Aurora"),
    permissions: rolePermissions[role]
  };

  if (hasAuthDb()) await createUserDb(user);
  else users.push(user);
  res.status(201).json({ data: user });
  });

  app.post("/register/restaurant", async (req, res) => {
  await dbReady;
  const firstName = String(req.body.firstName ?? "").trim();
  const lastName = String(req.body.lastName ?? "").trim();
  const restaurantName = String(req.body.restaurantName ?? "").trim();
  const phone = String(req.body.phone ?? "").trim();
  const email = String(req.body.email ?? `${phone || "restaurant"}@scanmenu.local`).trim().toLowerCase();
  const requestedUsername = String(req.body.username ?? "").trim();
  const username = uniqueUsername(requestedUsername || restaurantName || email.split("@")[0] || "restaurant");
  const password = String(req.body.password ?? "");
  const confirmPassword = String(req.body.confirmPassword ?? "");
  const termsAccepted = Boolean(req.body.termsAccepted);
  const privacyAccepted = Boolean(req.body.privacyAccepted);

  if (!firstName || !restaurantName || !phone || !password) {
    res.status(400).json({ error: "Missing required restaurant registration fields" });
    return;
  }

  if (!termsAccepted || !privacyAccepted) {
    res.status(400).json({ error: "Terms of Use and Privacy Policy consent is required" });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  if (await isIdentityTaken({ email, phone, username })) {
    res.status(409).json({ error: "Email, phone, or username is already registered" });
    return;
  }

  const user: DemoUser = {
    id: `usr_${Date.now()}`,
    name: `${firstName} ${lastName}`.trim(),
    username,
    email,
    phone,
    role: "restaurant_owner",
    preferredLanguage: String(req.body.preferredLanguage ?? "en"),
    restaurantId: `rst_${Date.now()}`,
    restaurantName
  };

  if (hasAuthDb()) await createUserDb(user);
  else users.push(user);
  const session = await createSession(user.id);

  res.status(201).json({
    data: {
      user,
      session,
      accessToken: session.id,
      redirectTo: getRedirectForRole(user.role)
    }
  });
  });

  app.post("/login", async (req, res) => {
  await dbReady;
  const identifier = String(req.body.identifier ?? "").trim().toLowerCase();

  if (!identifier || !String(req.body.password ?? "")) {
    res.status(400).json({ error: "Email, username, or phone and password are required" });
    return;
  }

  const user = await findUserByIdentifier(identifier);

  if (!user) {
    res.status(401).json({ error: "Invalid login credentials" });
    return;
  }
  const session = await createSession(user.id);

  res.json({
    data: {
      user,
      session,
      accessToken: session.id,
      redirectTo: getRedirectForRole(user.role)
    }
  });
  });

  app.get("/session/:sessionId", async (req, res) => {
  await dbReady;
  const session = hasAuthDb() ? await getSessionDb(req.params.sessionId) : sessions.get(req.params.sessionId);

  if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
    if (session) {
      if (hasAuthDb()) await deleteSessionDb(session.id);
      else sessions.delete(session.id);
    }

    res.status(401).json({ error: "Session expired or not found" });
    return;
  }

  const sourceUsers = hasAuthDb() ? await getUsersDb() : users;
  const user = sourceUsers.find((item) => item.id === session.userId);

  if (!user) {
    if (hasAuthDb()) await deleteSessionDb(session.id);
    else sessions.delete(session.id);
    res.status(401).json({ error: "Session user not found" });
    return;
  }

  res.json({
    data: {
      session,
      user,
      redirectTo: getRedirectForRole(user.role)
    }
  });
  });

  app.post("/logout", async (req, res) => {
  await dbReady;
  const sessionId = String(req.body.sessionId ?? "");

  if (sessionId) {
    if (hasAuthDb()) await deleteSessionDb(sessionId);
    else sessions.delete(sessionId);
  }

  res.json({ data: { ok: true } });
  });

  return app;
}

function getRedirectForRole(role: UserRole) {
  if (role === "platform_owner") {
    return "/admin";
  }

  if (role === "restaurant_owner" || isRestaurantRole(role)) {
    return "/restaurant";
  }

  if (role === "staff" || role === "accountant") {
    return "/staff";
  }

  if (role === "delivery_partner" || role === "farmer_partner" || role === "supplier_partner") {
    return "/partners";
  }

  if (role === "customer") {
    return "/customer";
  }

  return "/";
}

function isRestaurantRole(role: UserRole | string): role is RestaurantRole {
  return restaurantRoles.includes(role as RestaurantRole);
}

async function findUserByIdentifier(identifier: string) {
  if (hasAuthDb()) {
    return findUserDb({ email: identifier, phone: identifier, username: identifier });
  }

  return users.find((item) => {
    return (
      item.email.toLowerCase() === identifier ||
      item.username.toLowerCase() === identifier ||
      item.phone?.toLowerCase() === identifier
    );
  });
}

async function createSession(userId: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 8);
  const session: AuthSessionRecord = {
    id: `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  if (hasAuthDb()) await createSessionDb(session);
  else sessions.set(session.id, session);
  return session;
}

async function isIdentityTaken(identity: { email: string; phone?: string; username: string }) {
  if (hasAuthDb()) {
    return Boolean(await findUserDb(identity));
  }

  return users.some((item) => {
    return (
      item.email.toLowerCase() === identity.email.toLowerCase() ||
      item.username.toLowerCase() === identity.username.toLowerCase() ||
      (identity.phone ? item.phone?.toLowerCase() === identity.phone.toLowerCase() : false)
    );
  });
}

function uniqueUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

const app = createApp();

if (!process.env.SCANMENU_SKIP_LISTEN) {
  app.listen(port, () => {
    console.log(`Auth service listening on http://localhost:${port}`);
  });
}
