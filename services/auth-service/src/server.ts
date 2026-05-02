import cors from "cors";
import express from "express";
import type { UserRole } from "@menuza/shared";

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
    username: "menuza-admin",
    email: "owner@menuza.local",
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
    email: "customer@menuza.local",
    role: "customer",
    preferredLanguage: "ar"
  },
  {
    id: "usr_delivery_partner",
    name: "Delivery Partner",
    username: "delivery-partner",
    email: "driver@menuza.local",
    role: "delivery_partner",
    preferredLanguage: "ar",
    permissions: ["delivery:read", "delivery:update"]
  },
  {
    id: "usr_farmer_partner",
    name: "Farm Partner",
    username: "farm-partner",
    email: "farmer@menuza.local",
    role: "farmer_partner",
    preferredLanguage: "ar",
    permissions: ["supply:read", "supply:write"]
  },
  {
    id: "usr_supplier_partner",
    name: "Grocery Supplier",
    username: "supplier-partner",
    email: "supplier@menuza.local",
    role: "supplier_partner",
    preferredLanguage: "ar",
    permissions: ["supply:read", "inventory:write"]
  }
];

const sessions = new Map<string, DemoSession>();

const app = express();
const port = Number(process.env.AUTH_SERVICE_PORT ?? 4101);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ data: { service: "auth-service", status: "ok" } });
});

app.get("/users", (_req, res) => {
  res.json({ data: users });
});

app.post("/register/customer", (req, res) => {
  const email = String(req.body.email ?? "customer@example.com").trim().toLowerCase();
  const username = uniqueUsername(String(req.body.username ?? email.split("@")[0] ?? "customer"));
  const phone = String(req.body.phone ?? "").trim();

  if (isIdentityTaken({ email, phone, username })) {
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

  users.push(user);
  const session = createSession(user.id);

  res.status(201).json({
    data: {
      user,
      session,
      accessToken: session.id,
      redirectTo: getRedirectForRole(user.role)
    }
  });
});

app.post("/register/staff", (req, res) => {
  const email = String(req.body.email ?? "staff@example.com").trim();
  const username = uniqueUsername(String(req.body.username ?? email.split("@")[0] ?? "staff"));

  const user: DemoUser = {
    id: `usr_${Date.now()}`,
    name: String(req.body.name ?? "Staff Member"),
    username,
    email,
    role: (req.body.role ?? "staff") as UserRole,
    preferredLanguage: String(req.body.preferredLanguage ?? "en"),
    restaurantId: String(req.body.restaurantId ?? "rst_bistro_01")
  };

  users.push(user);
  res.status(201).json({ data: user });
});

app.post("/register/restaurant", (req, res) => {
  const firstName = String(req.body.firstName ?? "").trim();
  const lastName = String(req.body.lastName ?? "").trim();
  const restaurantName = String(req.body.restaurantName ?? "").trim();
  const phone = String(req.body.phone ?? "").trim();
  const email = String(req.body.email ?? `${phone || "restaurant"}@menuza.local`).trim().toLowerCase();
  const requestedUsername = String(req.body.username ?? "").trim();
  const username = uniqueUsername(requestedUsername || restaurantName || email.split("@")[0] || "restaurant");
  const password = String(req.body.password ?? "");
  const confirmPassword = String(req.body.confirmPassword ?? "");

  if (!firstName || !restaurantName || !phone || !password) {
    res.status(400).json({ error: "Missing required restaurant registration fields" });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  if (isIdentityTaken({ email, phone, username })) {
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

  users.push(user);
  const session = createSession(user.id);

  res.status(201).json({
    data: {
      user,
      session,
      accessToken: session.id,
      redirectTo: getRedirectForRole(user.role)
    }
  });
});

app.post("/login", (req, res) => {
  const identifier = String(req.body.identifier ?? "").trim().toLowerCase();

  if (!identifier || !String(req.body.password ?? "")) {
    res.status(400).json({ error: "Email, username, or phone and password are required" });
    return;
  }

  const user = findUserByIdentifier(identifier);

  if (!user) {
    res.status(401).json({ error: "Invalid login credentials" });
    return;
  }
  const session = createSession(user.id);

  res.json({
    data: {
      user,
      session,
      accessToken: session.id,
      redirectTo: getRedirectForRole(user.role)
    }
  });
});

app.get("/session/:sessionId", (req, res) => {
  const session = sessions.get(req.params.sessionId);

  if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
    if (session) {
      sessions.delete(session.id);
    }

    res.status(401).json({ error: "Session expired or not found" });
    return;
  }

  const user = users.find((item) => item.id === session.userId);

  if (!user) {
    sessions.delete(session.id);
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

app.post("/logout", (req, res) => {
  const sessionId = String(req.body.sessionId ?? "");

  if (sessionId) {
    sessions.delete(sessionId);
  }

  res.json({ data: { ok: true } });
});

function getRedirectForRole(role: UserRole) {
  if (role === "platform_owner") {
    return "/admin";
  }

  if (role === "restaurant_owner") {
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

function findUserByIdentifier(identifier: string) {
  return users.find((item) => {
    return (
      item.email.toLowerCase() === identifier ||
      item.username.toLowerCase() === identifier ||
      item.phone?.toLowerCase() === identifier
    );
  });
}

function createSession(userId: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 8);
  const session: DemoSession = {
    id: `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  sessions.set(session.id, session);
  return session;
}

function isIdentityTaken(identity: { email: string; phone?: string; username: string }) {
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

app.listen(port, () => {
  console.log(`Auth service listening on http://localhost:${port}`);
});
