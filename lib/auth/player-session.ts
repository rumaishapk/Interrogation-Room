import "server-only";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { pool } from "@/lib/db/pool";

const COOKIE_NAME = "player_session";
const SESSION_DAYS = 30;

export type Player = { id: string; username: string };

// The cookie holds a random token. The database stores only its SHA-256 hash,
// so a leaked sessions table can't be used to log in.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function startPlayerSession(userId: string) {
  // 32 random bytes: impossible to guess.
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  // Tidy up this player's old, expired sessions while we're here.
  await pool.query("DELETE FROM sessions WHERE user_id = $1 AND expires_at < now()", [userId]);
  await pool.query("INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)", [
    hashToken(token),
    userId,
    expiresAt,
  ]);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true, // browser JavaScript can't read it
    secure: process.env.NODE_ENV === "production", // HTTPS only once deployed
    sameSite: "lax", // sent when following a link to the site, not on other sites' form posts
    path: "/",
    expires: expiresAt,
  });
}

export async function endPlayerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    // Delete the row too, so the token stops working even if someone copied it.
    await pool.query("DELETE FROM sessions WHERE id = $1", [hashToken(token)]);
  }
  cookieStore.delete(COOKIE_NAME);
}

// The logged-in player, or null for a guest.
// cache() means several components asking during one request cause only one query.
export const getCurrentPlayer = cache(async (): Promise<Player | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const { rows } = await pool.query<Player>(
    `SELECT u.id, u.username
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > now()`,
    [hashToken(token)]
  );
  return rows[0] ?? null;
});
