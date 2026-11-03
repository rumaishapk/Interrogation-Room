import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  buildGoogleAuthUrl,
  checkGoogleIdToken,
  newOAuthFlow,
  oauthFlowSchema,
  pkceChallenge,
  sameSecret,
} from "../lib/auth/google-oauth.ts";

const CLIENT_ID = "my-client.apps.googleusercontent.com";
const NOW = 1_800_000_000;

// Builds an unsigned token like the ones Google returns (we only read the middle part).
function makeToken(claims: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `header.${body}.signature`;
}

const goodClaims = {
  iss: "https://accounts.google.com",
  aud: CLIENT_ID,
  sub: "1234567890",
  exp: NOW + 3600,
  nonce: "the-nonce",
  email: "ada@example.com",
  email_verified: true,
};

// A copy of the claims without the named ones.
const without = (claims: Record<string, unknown>, ...keys: string[]) =>
  Object.fromEntries(Object.entries(claims).filter(([key]) => !keys.includes(key)));

const check = (claims: Record<string, unknown>, nonce = "the-nonce") =>
  checkGoogleIdToken(makeToken(claims), { clientId: CLIENT_ID, nonce, nowSeconds: NOW });

test("a correct token gives the Google id and verified email", () => {
  assert.deepEqual(check(goodClaims), { sub: "1234567890", email: "ada@example.com" });
});

test("the older issuer spelling is accepted", () => {
  assert.ok(check({ ...goodClaims, iss: "accounts.google.com" }));
});

test("a token from another issuer is rejected", () => {
  assert.equal(check({ ...goodClaims, iss: "https://evil.example" }), null);
});

test("a token made for a different app is rejected", () => {
  assert.equal(check({ ...goodClaims, aud: "someone-else.apps.googleusercontent.com" }), null);
});

test("an expired token is rejected, but a few seconds of clock difference is fine", () => {
  assert.equal(check({ ...goodClaims, exp: NOW - 120 }), null);
  assert.ok(check({ ...goodClaims, exp: NOW - 10 }));
});

test("a token from a different login attempt (wrong nonce) is rejected", () => {
  assert.equal(check(goodClaims, "another-nonce"), null);
});

test("a token with no nonce is rejected", () => {
  assert.equal(check(without(goodClaims, "nonce")), null);
});

test("an email Google hasn't verified is dropped, but login still works", () => {
  assert.deepEqual(check({ ...goodClaims, email_verified: false }), { sub: "1234567890", email: null });
  assert.deepEqual(check(without(goodClaims, "email", "email_verified")), { sub: "1234567890", email: null });
});

test("a missing or empty sub is rejected", () => {
  assert.equal(check(without(goodClaims, "sub")), null);
  assert.equal(check({ ...goodClaims, sub: "" }), null);
});

test("garbage is rejected instead of throwing", () => {
  const options = { clientId: CLIENT_ID, nonce: "the-nonce", nowSeconds: NOW };
  assert.equal(checkGoogleIdToken("", options), null);
  assert.equal(checkGoogleIdToken("not-a-token", options), null);
  assert.equal(checkGoogleIdToken("a.!!!not-base64-json!!!.c", options), null);
  assert.equal(checkGoogleIdToken(`a.${Buffer.from("[1,2]").toString("base64url")}.c`, options), null);
});

test("each login attempt gets its own random values", () => {
  const a = newOAuthFlow("/cases");
  const b = newOAuthFlow("/cases");
  assert.notEqual(a.state, b.state);
  assert.notEqual(a.nonce, b.nonce);
  assert.notEqual(a.verifier, b.verifier);
  assert.ok(oauthFlowSchema.safeParse(a).success);
});

test("the PKCE challenge is the SHA-256 of the verifier, not the verifier", () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"; // example from RFC 7636
  assert.equal(pkceChallenge(verifier), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  assert.equal(pkceChallenge(verifier), createHash("sha256").update(verifier).digest("base64url"));
});

test("the link to Google carries the safety values and never the verifier", () => {
  const flow = newOAuthFlow("/game/x");
  const url = new URL(buildGoogleAuthUrl(flow, CLIENT_ID, "http://localhost:3000/auth/google/callback"));
  const p = url.searchParams;
  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(p.get("client_id"), CLIENT_ID);
  assert.equal(p.get("redirect_uri"), "http://localhost:3000/auth/google/callback");
  assert.equal(p.get("response_type"), "code");
  assert.equal(p.get("scope"), "openid email");
  assert.equal(p.get("state"), flow.state);
  assert.equal(p.get("nonce"), flow.nonce);
  assert.equal(p.get("code_challenge_method"), "S256");
  assert.equal(p.get("code_challenge"), pkceChallenge(flow.verifier));
  assert.ok(!url.toString().includes(flow.verifier));
});

test("a tampered flow cookie is rejected", () => {
  assert.equal(oauthFlowSchema.safeParse({ state: "", nonce: "n", verifier: "v", next: "/" }).success, false);
  assert.equal(oauthFlowSchema.safeParse({ state: "s", nonce: "n", verifier: "short", next: "/" }).success, false);
  assert.equal(oauthFlowSchema.safeParse("nope").success, false);
});

test("secrets are compared exactly, including different lengths", () => {
  assert.ok(sameSecret("abc", "abc"));
  assert.ok(!sameSecret("abc", "abd"));
  assert.ok(!sameSecret("abc", "abcd"));
  assert.ok(!sameSecret("", "abc"));
});
