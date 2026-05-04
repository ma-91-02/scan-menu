import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { promisify } from "node:util";

const tokenBytes = 32;
const bcryptRounds = 12;
const scryptAsync = promisify(crypto.scrypt);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, bcryptRounds);
}

export async function verifyPassword(password: string, storedHash?: string) {
  if (!storedHash) return false;

  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(password, storedHash);
  }

  if (storedHash.startsWith("scrypt:")) {
    return verifyLegacyScryptPassword(password, storedHash);
  }

  return false;
}

export function createEmailVerificationToken() {
  return createSecureToken();
}

export function createPasswordResetToken() {
  return createSecureToken();
}

export function createSessionToken() {
  return createSecureToken();
}

export function hashEmailToken(token: string) {
  return hashToken(token);
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function createSecureToken() {
  return crypto.randomBytes(tokenBytes).toString("base64url");
}

async function verifyLegacyScryptPassword(password: string, storedHash: string) {
  const [scheme, salt, expected] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const actual = (await scryptAsync(password, salt, 64)) as Buffer;
  const expectedBuffer = Buffer.from(expected, "base64url");
  return expectedBuffer.length === actual.length && crypto.timingSafeEqual(actual, expectedBuffer);
}
