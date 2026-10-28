// The admin login token: "<expiry time>.<signature>".
// The signature is an HMAC: a fingerprint of the expiry time made with a secret key
// that only the server knows. Changing the expiry (or guessing a token) breaks the
// signature, so a token can't be faked without ADMIN_SESSION_SECRET.
// No Next.js imports, so proxy.ts, the app and unit tests can all use it.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "admin_session";
export const SESSION_HOURS = 8;

function sessionSecret(): string | undefined {
  const secret = process.env.ADMIN_SESSION_SECRET;
  // A short secret is easy to guess, so treat it as "not configured".
  return secret && secret.length >= 32 ? secret : undefined;
}

function sign(expiresAt: number, secret: string): string {
  return createHmac("sha256", secret).update(`admin:${expiresAt}`).digest("hex");
}

// Compares two strings in constant time. A normal `===` stops at the first
// different character, and an attacker can measure that to guess a secret.
function safeEqual(a: string, b: string): boolean {
  // Hashing first makes both sides the same length, which timingSafeEqual requires.
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export function isAdminLoginConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD) && sessionSecret() !== undefined;
}

export function passwordMatches(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false; // no password set = nobody can log in
  return safeEqual(input, password);
}

export function createAdminToken(now = Date.now()): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET must be set and at least 32 characters.");
  const expiresAt = now + SESSION_HOURS * 60 * 60 * 1000;
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function verifyAdminToken(token: string | undefined, now = Date.now()): boolean {
  const secret = sessionSecret();
  if (!secret || !token) return false;

  const [expiresText, signature] = token.split(".");
  const expiresAt = Number(expiresText);
  if (!Number.isInteger(expiresAt) || !signature) return false;
  if (expiresAt < now) return false; // expired

  return safeEqual(signature, sign(expiresAt, secret));
}
