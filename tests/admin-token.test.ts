import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createAdminToken,
  isAdminLoginConfigured,
  passwordMatches,
  verifyAdminToken,
} from "../lib/auth/admin-token.ts";

const HOUR = 60 * 60 * 1000;

// Fake settings for the tests only. Never the real values.
beforeEach(() => {
  process.env.ADMIN_PASSWORD = "correct horse battery staple";
  process.env.ADMIN_SESSION_SECRET = "a".repeat(40);
});

test("accepts the right password and rejects others", () => {
  assert.equal(passwordMatches("correct horse battery staple"), true);
  assert.equal(passwordMatches("wrong"), false);
  assert.equal(passwordMatches(""), false);
});

test("nobody can log in when no password is set", () => {
  delete process.env.ADMIN_PASSWORD;
  assert.equal(passwordMatches(""), false);
  assert.equal(isAdminLoginConfigured(), false);
});

test("a fresh token is valid", () => {
  assert.equal(verifyAdminToken(createAdminToken()), true);
});

test("a token expires after 8 hours", () => {
  const now = Date.now();
  const token = createAdminToken(now);
  assert.equal(verifyAdminToken(token, now + 7 * HOUR), true);
  assert.equal(verifyAdminToken(token, now + 9 * HOUR), false);
});

test("changing the expiry time breaks the signature", () => {
  const [, signature] = createAdminToken().split(".");
  const forged = `${Date.now() + 1000 * HOUR}.${signature}`;
  assert.equal(verifyAdminToken(forged), false);
});

test("a token signed with a different secret is rejected", () => {
  const token = createAdminToken();
  process.env.ADMIN_SESSION_SECRET = "b".repeat(40);
  assert.equal(verifyAdminToken(token), false);
});

test("missing or garbage tokens are rejected", () => {
  for (const token of [undefined, "", "abc", "123.", ".abc", "not-a-number.abc"]) {
    assert.equal(verifyAdminToken(token), false, `should reject ${JSON.stringify(token)}`);
  }
});

test("a secret shorter than 32 characters counts as not configured", () => {
  process.env.ADMIN_SESSION_SECRET = "short";
  assert.equal(isAdminLoginConfigured(), false);
  assert.throws(() => createAdminToken());
});
