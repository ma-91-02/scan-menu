import { Pool } from "pg";
import type { StaffRole, UserRole } from "@babili/shared";
import { hashToken } from "./security.js";

export interface AuthUserRecord {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  preferredLanguage: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: string;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: string;
  acceptedTerms: boolean;
  acceptedTermsAt?: string;
  termsVersion?: string;
  acceptedPrivacy: boolean;
  acceptedPrivacyAt?: string;
  privacyVersion?: string;
  restaurantId?: string;
  restaurantName?: string;
  staffRole?: StaffRole;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RestaurantAuthRecord {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  operatingLanguage: string;
  country?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  planId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RestaurantStaffRecord {
  id: string;
  restaurantId: string;
  userId: string;
  staffRole: StaffRole;
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
}

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
let authDbAvailable = Boolean(pool);

export function hasAuthDb() {
  return authDbAvailable;
}

export function markAuthDbUnavailable() {
  authDbAvailable = false;
}

export async function initAuthDatabase(
  seedUsers: AuthUserRecord[],
  seedRestaurants: RestaurantAuthRecord[] = [],
  seedStaff: RestaurantStaffRecord[] = [],
) {
  if (!pool || !authDbAvailable) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS babili_users (
      id text PRIMARY KEY,
      name text NOT NULL,
      username text NOT NULL UNIQUE,
      email text NOT NULL UNIQUE,
      phone text,
      password_hash text,
      role text NOT NULL,
      preferred_language text NOT NULL DEFAULT 'en',
      email_verified boolean NOT NULL DEFAULT false,
      email_verified_at timestamptz,
      email_verification_token_hash text,
      email_verification_expires_at timestamptz,
      password_reset_token_hash text,
      password_reset_expires_at timestamptz,
      accepted_terms boolean NOT NULL DEFAULT false,
      accepted_terms_at timestamptz,
      terms_version text,
      accepted_privacy boolean NOT NULL DEFAULT false,
      accepted_privacy_at timestamptz,
      privacy_version text,
      restaurant_id text,
      restaurant_name text,
      staff_role text,
      permissions jsonb NOT NULL DEFAULT '[]',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS password_hash text;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS email_verification_token_hash text;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS email_verification_expires_at timestamptz;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS password_reset_token_hash text;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS password_reset_expires_at timestamptz;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS accepted_terms boolean NOT NULL DEFAULT false;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS terms_version text;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS accepted_privacy boolean NOT NULL DEFAULT false;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS accepted_privacy_at timestamptz;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS privacy_version text;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS restaurant_id text;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS restaurant_name text;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS staff_role text;
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '[]';
    ALTER TABLE babili_users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

    CREATE TABLE IF NOT EXISTS babili_auth_restaurants (
      id text PRIMARY KEY,
      owner_id text NOT NULL REFERENCES babili_users(id) ON DELETE CASCADE,
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      operating_language text NOT NULL DEFAULT 'en',
      country text,
      city text,
      address text,
      phone text,
      email text,
      plan_id text NOT NULL DEFAULT 'basic',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS babili_restaurant_staff (
      id text PRIMARY KEY,
      restaurant_id text NOT NULL REFERENCES babili_auth_restaurants(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES babili_users(id) ON DELETE CASCADE,
      staff_role text NOT NULL,
      permissions jsonb NOT NULL DEFAULT '[]',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (restaurant_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS babili_sessions (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES babili_users(id) ON DELETE CASCADE,
      token_hash text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL,
      expires_at timestamptz NOT NULL
    );

    ALTER TABLE babili_sessions ADD COLUMN IF NOT EXISTS token_hash text;
  `);

  for (const user of seedUsers) await createUserDb(user, true);
  for (const restaurant of seedRestaurants)
    await createRestaurantDb(restaurant, true);
  for (const staff of seedStaff) await createRestaurantStaffDb(staff, true);
}

export async function getUsersDb() {
  const result = await pool!.query(
    "SELECT * FROM babili_users ORDER BY created_at",
  );
  return result.rows.map(mapUser);
}

export async function findUserDb(predicate: {
  email?: string;
  phone?: string;
  username?: string;
  id?: string;
}) {
  const result = await pool!.query(
    `SELECT * FROM babili_users
     WHERE ($1::text IS NOT NULL AND email = $1)
        OR ($2::text IS NOT NULL AND phone = $2)
        OR ($3::text IS NOT NULL AND username = $3)
        OR ($4::text IS NOT NULL AND id = $4)
     LIMIT 1`,
    [
      predicate.email ?? null,
      predicate.phone ?? null,
      predicate.username ?? null,
      predicate.id ?? null,
    ],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : undefined;
}

export async function findUserByVerificationTokenDb(token: string) {
  const result = await pool!.query(
    "SELECT * FROM babili_users WHERE email_verification_token_hash = $1 LIMIT 1",
    [hashToken(token)],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : undefined;
}

export async function findUserByPasswordResetTokenDb(token: string) {
  const result = await pool!.query(
    "SELECT * FROM babili_users WHERE password_reset_token_hash = $1 LIMIT 1",
    [hashToken(token)],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : undefined;
}

export async function createUserDb(
  user: AuthUserRecord,
  ignoreConflict = false,
) {
  const conflict = ignoreConflict
    ? `ON CONFLICT (id) DO UPDATE SET
        password_hash = COALESCE(babili_users.password_hash, EXCLUDED.password_hash),
        email_verified = babili_users.email_verified OR EXCLUDED.email_verified,
        accepted_terms = babili_users.accepted_terms OR EXCLUDED.accepted_terms,
        accepted_privacy = babili_users.accepted_privacy OR EXCLUDED.accepted_privacy,
        updated_at = now()`
    : "";
  await pool!.query(
    `INSERT INTO babili_users (
      id, name, username, email, phone, password_hash, role, preferred_language, email_verified, email_verified_at,
      email_verification_token_hash, email_verification_expires_at, password_reset_token_hash, password_reset_expires_at,
      accepted_terms, accepted_terms_at, terms_version, accepted_privacy, accepted_privacy_at, privacy_version,
      restaurant_id, restaurant_name, staff_role, permissions
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) ${conflict}`,
    [
      user.id,
      user.name,
      user.username,
      user.email,
      user.phone ?? null,
      user.passwordHash ?? null,
      user.role,
      user.preferredLanguage,
      user.emailVerified,
      user.emailVerifiedAt ?? null,
      user.emailVerificationTokenHash ?? null,
      user.emailVerificationExpiresAt ?? null,
      user.passwordResetTokenHash ?? null,
      user.passwordResetExpiresAt ?? null,
      user.acceptedTerms,
      user.acceptedTermsAt ?? null,
      user.termsVersion ?? null,
      user.acceptedPrivacy,
      user.acceptedPrivacyAt ?? null,
      user.privacyVersion ?? null,
      user.restaurantId ?? null,
      user.restaurantName ?? null,
      user.staffRole ?? null,
      JSON.stringify(user.permissions ?? []),
    ],
  );
  return user;
}

export async function updateUserDb(user: AuthUserRecord) {
  const result = await pool!.query(
    `UPDATE babili_users SET
      name = $2,
      username = $3,
      email = $4,
      phone = $5,
      password_hash = $6,
      role = $7,
      preferred_language = $8,
      email_verified = $9,
      email_verified_at = $10,
      email_verification_token_hash = $11,
      email_verification_expires_at = $12,
      password_reset_token_hash = $13,
      password_reset_expires_at = $14,
      accepted_terms = $15,
      accepted_terms_at = $16,
      terms_version = $17,
      accepted_privacy = $18,
      accepted_privacy_at = $19,
      privacy_version = $20,
      restaurant_id = $21,
      restaurant_name = $22,
      staff_role = $23,
      permissions = $24,
      updated_at = now()
    WHERE id = $1
    RETURNING *`,
    [
      user.id,
      user.name,
      user.username,
      user.email,
      user.phone ?? null,
      user.passwordHash ?? null,
      user.role,
      user.preferredLanguage,
      user.emailVerified,
      user.emailVerifiedAt ?? null,
      user.emailVerificationTokenHash ?? null,
      user.emailVerificationExpiresAt ?? null,
      user.passwordResetTokenHash ?? null,
      user.passwordResetExpiresAt ?? null,
      user.acceptedTerms,
      user.acceptedTermsAt ?? null,
      user.termsVersion ?? null,
      user.acceptedPrivacy,
      user.acceptedPrivacyAt ?? null,
      user.privacyVersion ?? null,
      user.restaurantId ?? null,
      user.restaurantName ?? null,
      user.staffRole ?? null,
      JSON.stringify(user.permissions ?? []),
    ],
  );
  return mapUser(result.rows[0]);
}

export async function createRestaurantDb(
  restaurant: RestaurantAuthRecord,
  ignoreConflict = false,
) {
  const conflict = ignoreConflict ? "ON CONFLICT (id) DO NOTHING" : "";
  await pool!.query(
    `INSERT INTO babili_auth_restaurants (
      id, owner_id, name, slug, operating_language, country, city, address, phone, email, plan_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ${conflict}`,
    [
      restaurant.id,
      restaurant.ownerId,
      restaurant.name,
      restaurant.slug,
      restaurant.operatingLanguage,
      restaurant.country ?? null,
      restaurant.city ?? null,
      restaurant.address ?? null,
      restaurant.phone ?? null,
      restaurant.email ?? null,
      restaurant.planId,
    ],
  );
  return restaurant;
}

export async function createRestaurantStaffDb(
  staff: RestaurantStaffRecord,
  ignoreConflict = false,
) {
  const conflict = ignoreConflict
    ? "ON CONFLICT (restaurant_id, user_id) DO NOTHING"
    : "";
  await pool!.query(
    `INSERT INTO babili_restaurant_staff (id, restaurant_id, user_id, staff_role, permissions)
     VALUES ($1,$2,$3,$4,$5) ${conflict}`,
    [
      staff.id,
      staff.restaurantId,
      staff.userId,
      staff.staffRole,
      JSON.stringify(staff.permissions),
    ],
  );
  return staff;
}

export async function getStaffForRestaurantDb(restaurantId: string) {
  const result = await pool!.query(
    `SELECT u.*, s.staff_role AS linked_staff_role, s.permissions AS linked_permissions
     FROM babili_restaurant_staff s
     JOIN babili_users u ON u.id = s.user_id
     WHERE s.restaurant_id = $1
     ORDER BY s.created_at`,
    [restaurantId],
  );
  return result.rows.map(mapUser);
}

export async function getRestaurantStaffForUserDb(
  userId: string,
  restaurantId?: string,
) {
  const result = await pool!.query(
    `SELECT * FROM babili_restaurant_staff
     WHERE user_id = $1 AND ($2::text IS NULL OR restaurant_id = $2)
     LIMIT 1`,
    [userId, restaurantId ?? null],
  );
  return result.rows[0] ? mapStaff(result.rows[0]) : undefined;
}

export async function createSessionDb(session: AuthSessionRecord) {
  await pool!.query(
    "INSERT INTO babili_sessions (id, user_id, token_hash, created_at, expires_at) VALUES ($1,$2,$3,$4,$5)",
    [
      session.id,
      session.userId,
      session.tokenHash,
      session.createdAt,
      session.expiresAt,
    ],
  );
  return session;
}

export async function getSessionDb(token: string) {
  const result = await pool!.query(
    "SELECT * FROM babili_sessions WHERE token_hash = $1",
    [hashToken(token)],
  );
  return result.rows[0] ? mapSession(result.rows[0]) : undefined;
}

export async function deleteSessionDb(token: string) {
  await pool!.query(
    "DELETE FROM babili_sessions WHERE token_hash = $1 OR id = $2",
    [hashToken(token), token],
  );
}

export async function deleteSessionsForUserDb(userId: string) {
  await pool!.query("DELETE FROM babili_sessions WHERE user_id = $1", [userId]);
}

export async function deleteUserDb(userId: string) {
  await pool!.query("DELETE FROM babili_users WHERE id = $1", [userId]);
}

export async function deleteRestaurantUsersDb(
  restaurantId: string,
  ownerId: string,
) {
  await pool!.query(
    "DELETE FROM babili_users WHERE restaurant_id = $1 AND id <> $2",
    [restaurantId, ownerId],
  );
}

function mapUser(row: Record<string, unknown>): AuthUserRecord {
  const linkedPermissions = row.linked_permissions ?? row.permissions;
  const linkedStaffRole = row.linked_staff_role ?? row.staff_role;

  return {
    id: String(row.id),
    name: String(row.name),
    username: String(row.username),
    email: String(row.email),
    phone: row.phone ? String(row.phone) : undefined,
    passwordHash: row.password_hash ? String(row.password_hash) : undefined,
    role: String(row.role) as UserRole,
    preferredLanguage: String(row.preferred_language),
    emailVerified: Boolean(row.email_verified),
    emailVerifiedAt: row.email_verified_at
      ? new Date(String(row.email_verified_at)).toISOString()
      : undefined,
    emailVerificationTokenHash: row.email_verification_token_hash
      ? String(row.email_verification_token_hash)
      : undefined,
    emailVerificationExpiresAt: row.email_verification_expires_at
      ? new Date(String(row.email_verification_expires_at)).toISOString()
      : undefined,
    passwordResetTokenHash: row.password_reset_token_hash
      ? String(row.password_reset_token_hash)
      : undefined,
    passwordResetExpiresAt: row.password_reset_expires_at
      ? new Date(String(row.password_reset_expires_at)).toISOString()
      : undefined,
    acceptedTerms: Boolean(row.accepted_terms),
    acceptedTermsAt: row.accepted_terms_at
      ? new Date(String(row.accepted_terms_at)).toISOString()
      : undefined,
    termsVersion: row.terms_version ? String(row.terms_version) : undefined,
    acceptedPrivacy: Boolean(row.accepted_privacy),
    acceptedPrivacyAt: row.accepted_privacy_at
      ? new Date(String(row.accepted_privacy_at)).toISOString()
      : undefined,
    privacyVersion: row.privacy_version
      ? String(row.privacy_version)
      : undefined,
    restaurantId: row.restaurant_id ? String(row.restaurant_id) : undefined,
    restaurantName: row.restaurant_name
      ? String(row.restaurant_name)
      : undefined,
    staffRole: linkedStaffRole
      ? (String(linkedStaffRole) as StaffRole)
      : undefined,
    permissions: Array.isArray(linkedPermissions)
      ? linkedPermissions.map(String)
      : [],
    createdAt: row.created_at
      ? new Date(String(row.created_at)).toISOString()
      : undefined,
    updatedAt: row.updated_at
      ? new Date(String(row.updated_at)).toISOString()
      : undefined,
  };
}

function mapStaff(row: Record<string, unknown>): RestaurantStaffRecord {
  return {
    id: String(row.id),
    restaurantId: String(row.restaurant_id),
    userId: String(row.user_id),
    staffRole: String(row.staff_role) as StaffRole,
    permissions: Array.isArray(row.permissions)
      ? row.permissions.map(String)
      : [],
    createdAt: row.created_at
      ? new Date(String(row.created_at)).toISOString()
      : undefined,
    updatedAt: row.updated_at
      ? new Date(String(row.updated_at)).toISOString()
      : undefined,
  };
}

function mapSession(row: Record<string, unknown>): AuthSessionRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    tokenHash: String(row.token_hash),
    createdAt: new Date(String(row.created_at)).toISOString(),
    expiresAt: new Date(String(row.expires_at)).toISOString(),
  };
}
