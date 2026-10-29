import { test } from "node:test";
import assert from "node:assert/strict";
import { signupSchema } from "../lib/auth/credentials.ts";

const ok = (username: string, password = "goodpass1") =>
  signupSchema.safeParse({ username, password }).success;

test("accepts valid usernames", () => {
  for (const name of ["rishad", "Det_Holmes", "abc", "a".repeat(20), "player_007"]) {
    assert.equal(ok(name), true, name);
  }
});

test("rejects invalid usernames", () => {
  for (const name of ["ab", "a".repeat(21), "has space", "émile", "semi;colon", "", "rob'); DROP"]) {
    assert.equal(ok(name), false, JSON.stringify(name));
  }
});

test("trims spaces around the username", () => {
  const result = signupSchema.safeParse({ username: "  rishad  ", password: "goodpass1" });
  assert.equal(result.success && result.data.username, "rishad");
});

test("password must be 8 to 128 characters", () => {
  assert.equal(ok("rishad", "1234567"), false);
  assert.equal(ok("rishad", "12345678"), true);
  assert.equal(ok("rishad", "x".repeat(128)), true);
  assert.equal(ok("rishad", "x".repeat(129)), false);
});

test("gives a readable message for a short password", () => {
  const result = signupSchema.safeParse({ username: "rishad", password: "short" });
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.error.issues[0].message, "Password must be at least 8 characters.");
});
