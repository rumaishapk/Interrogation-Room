// Shared by player and admin sessions.
// The cookie holds a random token. The database stores only its SHA-256 hash,
// so someone who reads the sessions tables still can't log in as anyone.
import { createHash, randomBytes } from "node:crypto";

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url"); // 32 random bytes: impossible to guess
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
