import { test } from "node:test";
import assert from "node:assert/strict";
import { hashSessionToken, newSessionToken } from "../lib/auth/session-token.ts";

test("tokens are long, URL-safe and never repeat", () => {
  const tokens = new Set(Array.from({ length: 1000 }, newSessionToken));
  assert.equal(tokens.size, 1000);
  for (const t of tokens) assert.match(t, /^[A-Za-z0-9_-]{43}$/); // 32 bytes in base64url
});

test("the stored hash is a 64-character hex string, not the token", () => {
  const token = newSessionToken();
  const hash = hashSessionToken(token);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.ok(!hash.includes(token));
});

test("the same token always gives the same hash (so it can be looked up)", () => {
  const token = newSessionToken();
  assert.equal(hashSessionToken(token), hashSessionToken(token));
  assert.notEqual(hashSessionToken(token), hashSessionToken(newSessionToken()));
});
