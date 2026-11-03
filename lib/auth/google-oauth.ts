// The pure parts of "Continue with Google": building the link to Google and
// checking the ID token Google sends back. No server-only imports, so it can be
// unit-tested. The network and database parts live in lib/auth/google.ts.
//
// Flow ("authorization code flow with PKCE"):
//   1. /auth/google makes three random values (state, nonce, PKCE verifier),
//      keeps them in a short-lived cookie, and sends the player to Google.
//   2. Google sends the player back to /auth/google/callback with a one-time code.
//   3. We check `state`, swap the code (plus the PKCE verifier and our client
//      secret) for an ID token, and check that token's claims below.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const CALLBACK_PATH = "/auth/google/callback";

// Google uses both spellings: https://developers.google.com/identity/openid-connect/openid-connect#validatinganidtoken
const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

// Allow a little clock difference between our server and Google's.
const CLOCK_SKEW_SECONDS = 60;

// What we remember (in a cookie) between sending the player to Google and their return.
export type OAuthFlow = {
  state: string; // stops other sites starting a login on the player's behalf (CSRF)
  nonce: string; // ties the ID token to THIS login attempt (stops token replay)
  verifier: string; // PKCE: proves the code is redeemed by whoever started the flow
  next: string; // where to go afterwards (already checked by safeNextPath)
};

export const oauthFlowSchema = z.object({
  state: z.string().min(1),
  nonce: z.string().min(1),
  verifier: z.string().min(43).max(128), // PKCE spec limits (RFC 7636)
  next: z.string(),
});

function randomValue(): string {
  return randomBytes(32).toString("base64url"); // 43 characters
}

export function newOAuthFlow(next: string): OAuthFlow {
  return { state: randomValue(), nonce: randomValue(), verifier: randomValue(), next };
}

// PKCE "S256": Google receives only the hash of the verifier now, and the
// verifier itself later, so an intercepted code is useless on its own.
export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildGoogleAuthUrl(flow: OAuthFlow, clientId: string, redirectUri: string): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: pkceChallenge(flow.verifier),
    code_challenge_method: "S256",
    prompt: "select_account", // let players pick which Google account to use
  }).toString();
  return url.toString();
}

// Compares in constant time, so response timing doesn't leak how much matched.
export function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

const idTokenClaimsSchema = z.object({
  iss: z.string(),
  aud: z.string(),
  sub: z.string().min(1).max(255),
  exp: z.number(),
  nonce: z.string().optional(),
  email: z.string().optional(),
  email_verified: z.boolean().optional(),
});

export type GoogleIdentity = { sub: string; email: string | null };

type CheckOptions = { clientId: string; nonce: string; nowSeconds?: number };

// Reads and checks the ID token from Google's token endpoint.
//
// We don't verify the token's signature here. That's allowed because we got the
// token straight from Google over HTTPS, authenticated with our client secret
// (OpenID Connect Core 1.0, section 3.1.3.7). A token from anywhere else, e.g. sent
// by a browser, would need its signature checked against Google's public keys.
export function checkGoogleIdToken(idToken: string, options: CheckOptions): GoogleIdentity | null {
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }

  const parsed = idTokenClaimsSchema.safeParse(payload);
  if (!parsed.success) return null;
  const claims = parsed.data;

  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!GOOGLE_ISSUERS.has(claims.iss)) return null; // made by Google
  if (claims.aud !== options.clientId) return null; // made for OUR app, not another one
  if (claims.exp + CLOCK_SKEW_SECONDS < now) return null; // not expired
  if (!claims.nonce || !sameSecret(claims.nonce, options.nonce)) return null; // from this login attempt

  // Only keep an email Google has confirmed belongs to the player.
  const email = claims.email && claims.email_verified === true ? claims.email : null;
  return { sub: claims.sub, email };
}
