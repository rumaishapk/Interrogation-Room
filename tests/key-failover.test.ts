import { test } from "node:test";
import assert from "node:assert/strict";
import { createFailover } from "../lib/ai/key-failover.ts";

class QuotaError extends Error {}
class OtherError extends Error {}
const isQuotaError = (err: unknown) => err instanceof QuotaError;

// A fake "API key": records each call, and fails with a quota error while `empty` is true.
function fakeKey(name: string) {
  const key = { name, empty: false, calls: 0 };
  return key;
}
const callKey = async (key: ReturnType<typeof fakeKey>) => {
  key.calls++;
  if (key.empty) throw new QuotaError(`${key.name} quota exhausted`);
  return `answer from ${key.name}`;
};

function setup(cooldownMs = 1000) {
  let clock = 0;
  const main = fakeKey("main");
  const backup = fakeKey("backup");
  const switches: string[] = [];
  const run = createFailover([main, backup], {
    isQuotaError,
    cooldownMs,
    now: () => clock,
    onSwitch: (from, to) => switches.push(`${from}->${to}`),
  });
  return { main, backup, run, switches, advance: (ms: number) => (clock += ms) };
}

test("uses the main key while it has quota", async () => {
  const { main, backup, run } = setup();
  assert.equal(await run(callKey), "answer from main");
  assert.equal(main.calls, 1);
  assert.equal(backup.calls, 0);
});

test("switches to the backup key when the main key's quota runs out", async () => {
  const { main, run, switches } = setup();
  main.empty = true;
  assert.equal(await run(callKey), "answer from backup");
  assert.deepEqual(switches, ["0->1"]);
});

test("skips an exhausted key during its cooldown (no wasted request)", async () => {
  const { main, backup, run } = setup();
  main.empty = true;
  await run(callKey);
  await run(callKey);
  await run(callKey);
  assert.equal(main.calls, 1); // only the first request tried the main key
  assert.equal(backup.calls, 3);
});

test("goes back to the main key after the cooldown, once its quota has reset", async () => {
  const { main, run, advance } = setup(1000);
  main.empty = true;
  await run(callKey);
  main.empty = false; // the daily quota reset
  advance(1001);
  assert.equal(await run(callKey), "answer from main");
});

test("other errors do NOT switch keys (a new key wouldn't fix them)", async () => {
  const { backup, run } = setup();
  await assert.rejects(run(async () => { throw new OtherError("bad request"); }), OtherError);
  assert.equal(backup.calls, 0);
});

test("when every key is exhausted, the quota error reaches the caller", async () => {
  const { main, backup, run } = setup();
  main.empty = true;
  backup.empty = true;
  await assert.rejects(run(callKey), QuotaError);
});

test("works with a single key", async () => {
  const only = fakeKey("only");
  const run = createFailover([only], { isQuotaError, cooldownMs: 1000 });
  assert.equal(await run(callKey), "answer from only");
  only.empty = true;
  await assert.rejects(run(callKey), QuotaError);
});
