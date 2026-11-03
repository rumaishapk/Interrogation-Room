import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";
import { pool } from "@/lib/db/pool";
import { hashSessionToken as hashToken, newSessionToken } from "./session-token";
import { GOOGLE_TOKEN_URL } from "./google-oauth";

// The cookie that carries state / nonce / PKCE verifier while the player is at Google.
export const OAUTH_FLOW_COOKIE = "google_oauth";
export const OAUTH_FLOW_MAX_AGE = 10 * 60; // seconds; plenty of time to pick an account

// The cookie that says "Google said yes, now choose a detective name".
const PENDING_COOKIE = "google_signup";
const PENDING_MINUTES = 15;

// Postgres error code for "a UNIQUE constraint was violated", and the two we care about.
const UNIQUE_VIOLATION = "23505";
const GOOGLE_SUB_UNIQUE = "users_google_sub_unique"; // migration 008
const USERNAME_UNIQUE = "users_username_lower_idx"; // migration 002

export type GoogleConfig = { clientId: string; clientSecret: string };

// null when Google login isn't set up, so the button can be hidden instead of crashing.
export function getGoogleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

const tokenResponseSchema = z.object({ id_token: z.string() });

// Swaps the one-time code for an ID token. Throws on network errors or a refusal.
export async function exchangeCodeForIdToken(
  code: string,
  verifier: string,
  redirectUri: string,
  config: GoogleConfig
): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      code_verifier: verifier,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri, // must match the one sent to Google exactly
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10_000), // don't hang the player's request if Google is slow
    cache: "no-store",
  });
  if (!response.ok) {
    // Google's error body says why (e.g. "invalid_grant"); it holds no secrets.
    throw new Error(`Google token exchange failed (${response.status}): ${await response.text()}`);
  }
  return tokenResponseSchema.parse(await response.json()).id_token;
}

export async function findUserIdByGoogleSub(sub: string): Promise<string | undefined> {
  const { rows } = await pool.query<{ id: string }>("SELECT id FROM users WHERE google_sub = $1", [sub]);
  return rows[0]?.id;
}

// First visit with this Google account: remember it until the player picks a name.
export async function startPendingGoogleSignup(sub: string, email: string | null, next: string) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + PENDING_MINUTES * 60 * 1000);

  // Tidy up: expired rows from anyone, and this Google account's earlier attempts.
  await pool.query("DELETE FROM pending_google_signups WHERE expires_at < now() OR google_sub = $1", [sub]);
  await pool.query(
    `INSERT INTO pending_google_signups (id, google_sub, email, next_path, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [hashToken(token), sub, email, next, expiresAt]
  );

  const cookieStore = await cookies();
  cookieStore.set(PENDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

// Is there an unexpired pending Google signup for this browser? (For the choose-a-name page.)
export async function hasPendingGoogleSignup(): Promise<boolean> {
  const token = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!token) return false;
  const { rowCount } = await pool.query(
    "SELECT 1 FROM pending_google_signups WHERE id = $1 AND expires_at > now()",
    [hashToken(token)]
  );
  return rowCount === 1;
}

export type CompleteResult =
  | { status: "created" | "existing"; userId: string; next: string }
  | { status: "taken" } // username already used; the pending signup is kept so they can retry
  | { status: "expired" }; // no valid pending signup (too slow, or already finished in another tab)

// Creates the Google player with the chosen username. All-or-nothing:
// the pending row is used up only if the player is really created.
export async function completeGoogleSignup(username: string): Promise<CompleteResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_COOKIE)?.value;
  if (!token) return { status: "expired" };

  const client = await pool.connect();
  let result: CompleteResult;
  try {
    await client.query("BEGIN");
    // DELETE ... RETURNING claims the row. If two tabs submit at once, the second
    // waits for the first and then finds nothing, so one pending signup = one player.
    const pending = await client.query<{ google_sub: string; email: string | null; next_path: string }>(
      `DELETE FROM pending_google_signups WHERE id = $1 AND expires_at > now()
       RETURNING google_sub, email, next_path`,
      [hashToken(token)]
    );
    if (pending.rowCount !== 1) {
      await client.query("ROLLBACK");
      return { status: "expired" };
    }
    const { google_sub: sub, email, next_path: next } = pending.rows[0];

    try {
      const { rows } = await client.query<{ id: string }>(
        "INSERT INTO users (username, google_sub, email) VALUES ($1, $2, $3) RETURNING id",
        [username, sub, email]
      );
      await client.query("COMMIT");
      result = { status: "created", userId: rows[0].id, next };
    } catch (err) {
      // Undo everything, including the DELETE, so a "taken" player can try another name.
      await client.query("ROLLBACK");
      const { code, constraint } = err as { code?: string; constraint?: string };
      if (code !== UNIQUE_VIOLATION) throw err;
      if (constraint === USERNAME_UNIQUE) return { status: "taken" };
      if (constraint !== GOOGLE_SUB_UNIQUE) throw err;
      // This Google account got a player in the meantime (another tab, another
      // pending signup). Log in as that player instead of failing.
      const existingId = await findUserIdByGoogleSub(sub);
      if (!existingId) throw err;
      await pool.query("DELETE FROM pending_google_signups WHERE google_sub = $1", [sub]);
      result = { status: "existing", userId: existingId, next };
    }
  } catch (err) {
    // A failed BEGIN/DELETE leaves the transaction open; this is a no-op otherwise.
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  cookieStore.delete(PENDING_COOKIE);
  return result;
}
