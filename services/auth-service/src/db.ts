import { Pool } from "pg";
import type { UserRole } from "@scanmenu/shared";

export interface AuthUserRecord {
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

export interface AuthSessionRecord {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

export function hasAuthDb() {
  return Boolean(pool);
}

export async function initAuthDatabase(seedUsers: AuthUserRecord[]) {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS scanmenu_users (
      id text PRIMARY KEY,
      name text NOT NULL,
      username text NOT NULL UNIQUE,
      email text NOT NULL UNIQUE,
      phone text,
      role text NOT NULL,
      preferred_language text NOT NULL DEFAULT 'en',
      restaurant_id text,
      restaurant_name text,
      permissions jsonb NOT NULL DEFAULT '[]',
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS scanmenu_sessions (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES scanmenu_users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL,
      expires_at timestamptz NOT NULL
    );
  `);

  for (const user of seedUsers) {
    await createUserDb(user, true);
  }
}

export async function getUsersDb() {
  const result = await pool!.query("SELECT * FROM scanmenu_users ORDER BY created_at");
  return result.rows.map(mapUser);
}

export async function findUserDb(predicate: { email?: string; phone?: string; username?: string }) {
  const result = await pool!.query(
    `SELECT * FROM scanmenu_users
     WHERE ($1::text IS NOT NULL AND email = $1)
        OR ($2::text IS NOT NULL AND phone = $2)
        OR ($3::text IS NOT NULL AND username = $3)
     LIMIT 1`,
    [predicate.email ?? null, predicate.phone ?? null, predicate.username ?? null]
  );
  return result.rows[0] ? mapUser(result.rows[0]) : undefined;
}

export async function createUserDb(user: AuthUserRecord, ignoreConflict = false) {
  const conflict = ignoreConflict ? "ON CONFLICT (id) DO NOTHING" : "";
  await pool!.query(
    `INSERT INTO scanmenu_users (
      id, name, username, email, phone, role, preferred_language, restaurant_id, restaurant_name, permissions
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ${conflict}`,
    [
      user.id,
      user.name,
      user.username,
      user.email,
      user.phone ?? null,
      user.role,
      user.preferredLanguage,
      user.restaurantId ?? null,
      user.restaurantName ?? null,
      JSON.stringify(user.permissions ?? [])
    ]
  );
  return user;
}

export async function createSessionDb(session: AuthSessionRecord) {
  await pool!.query(
    "INSERT INTO scanmenu_sessions (id, user_id, created_at, expires_at) VALUES ($1,$2,$3,$4)",
    [session.id, session.userId, session.createdAt, session.expiresAt]
  );
  return session;
}

export async function getSessionDb(sessionId: string) {
  const result = await pool!.query("SELECT * FROM scanmenu_sessions WHERE id = $1", [sessionId]);
  return result.rows[0] ? mapSession(result.rows[0]) : undefined;
}

export async function deleteSessionDb(sessionId: string) {
  await pool!.query("DELETE FROM scanmenu_sessions WHERE id = $1", [sessionId]);
}

function mapUser(row: Record<string, unknown>): AuthUserRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    username: String(row.username),
    email: String(row.email),
    phone: row.phone ? String(row.phone) : undefined,
    role: String(row.role) as UserRole,
    preferredLanguage: String(row.preferred_language),
    restaurantId: row.restaurant_id ? String(row.restaurant_id) : undefined,
    restaurantName: row.restaurant_name ? String(row.restaurant_name) : undefined,
    permissions: Array.isArray(row.permissions) ? row.permissions.map(String) : []
  };
}

function mapSession(row: Record<string, unknown>): AuthSessionRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    createdAt: new Date(String(row.created_at)).toISOString(),
    expiresAt: new Date(String(row.expires_at)).toISOString()
  };
}
