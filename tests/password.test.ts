import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, MAX_PASSWORD_LENGTH } from "../lib/auth/password.ts";

test("the right password verifies, a wrong one doesn't", async () => {
  const stored = await hashPassword("detective123");
  assert.equal(await verifyPassword("detective123", stored), true);
  assert.equal(await verifyPassword("detective124", stored), false);
  assert.equal(await verifyPassword("", stored), false);
});

test("the stored value never contains the password", async () => {
  const stored = await hashPassword("detective123");
  assert.ok(!stored.includes("detective123"));
  assert.match(stored, /^scrypt\$32768\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
});

test("the same password gets a different hash each time (random salt)", async () => {
  const a = await hashPassword("detective123");
  const b = await hashPassword("detective123");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("detective123", a), true);
  assert.equal(await verifyPassword("detective123", b), true);
});

test("a tampered or malformed stored hash is rejected", async () => {
  const stored = await hashPassword("detective123");
  const parts = stored.split("$");
  parts[5] = Buffer.from("not the real hash").toString("base64");
  assert.equal(await verifyPassword("detective123", parts.join("$")), false);
  for (const bad of ["", "plaintext", "md5$abc$def", "scrypt$32768$8$1$$"]) {
    assert.equal(await verifyPassword("detective123", bad), false, `should reject ${JSON.stringify(bad)}`);
  }
});

test("passwords are case-sensitive", async () => {
  const stored = await hashPassword("Detective123");
  assert.equal(await verifyPassword("detective123", stored), false);
});

test("an over-long password is rejected without hashing it", async () => {
  const stored = await hashPassword("detective123");
  assert.equal(await verifyPassword("x".repeat(MAX_PASSWORD_LENGTH + 1), stored), false);
});
