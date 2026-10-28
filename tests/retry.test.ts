import { test } from "node:test";
import assert from "node:assert/strict";
import { withRetry } from "../lib/ai/retry.ts";

class BusyError extends Error {}
class PermanentError extends Error {}

const isTemporary = (err: unknown) => err instanceof BusyError;
const delaysMs = [0, 0]; // up to 2 retries, without real waiting in tests

// A fake API call that fails `failures` times with the given error, then succeeds.
function fakeCall(failures: number, makeError: () => Error) {
  let calls = 0;
  const fn = async () => {
    calls++;
    if (calls <= failures) throw makeError();
    return "case";
  };
  return { fn, calls: () => calls };
}

test("returns at once when the first call works", async () => {
  const call = fakeCall(0, () => new BusyError());
  assert.equal(await withRetry(call.fn, { isTemporary, delaysMs }), "case");
  assert.equal(call.calls(), 1);
});

test("retries temporary errors and then succeeds", async () => {
  const call = fakeCall(2, () => new BusyError());
  assert.equal(await withRetry(call.fn, { isTemporary, delaysMs }), "case");
  assert.equal(call.calls(), 3); // 1 try + 2 retries
});

test("gives up after the last retry and throws the error", async () => {
  const call = fakeCall(5, () => new BusyError());
  await assert.rejects(withRetry(call.fn, { isTemporary, delaysMs }), BusyError);
  assert.equal(call.calls(), 3);
});

test("does not retry a permanent error", async () => {
  const call = fakeCall(1, () => new PermanentError());
  await assert.rejects(withRetry(call.fn, { isTemporary, delaysMs }), PermanentError);
  assert.equal(call.calls(), 1);
});

test("reports each retry and its delay", async () => {
  const seen: number[] = [];
  const call = fakeCall(2, () => new BusyError());
  await withRetry(call.fn, { isTemporary, delaysMs: [5, 10], onRetry: (_err, ms) => seen.push(ms) });
  assert.deepEqual(seen, [5, 10]);
});
