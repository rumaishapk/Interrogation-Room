import { test } from "node:test";
import assert from "node:assert/strict";
import { limitMessage, readLimits, remainingForPlayer } from "../lib/game/generation-limits.ts";

const limits = { perPlayer: 3, perSite: 30 };

test("defaults are 3 per player and 30 per site", () => {
  assert.deepEqual(readLimits({}), limits);
});

test("reads limits from the environment, ignoring nonsense values", () => {
  assert.deepEqual(readLimits({ PLAYER_DAILY_CASE_LIMIT: "5", SITE_DAILY_CASE_LIMIT: "100" }), { perPlayer: 5, perSite: 100 });
  assert.deepEqual(readLimits({ PLAYER_DAILY_CASE_LIMIT: "lots", SITE_DAILY_CASE_LIMIT: "-1" }), limits);
  assert.deepEqual(readLimits({ PLAYER_DAILY_CASE_LIMIT: "2.5" }), limits);
  // 0 is allowed: it switches the feature off.
  assert.equal(readLimits({ PLAYER_DAILY_CASE_LIMIT: "0" }).perPlayer, 0);
});

test("allowed while under both limits", () => {
  assert.equal(limitMessage({ playerUsed: 2, siteUsed: 29 }, limits), null);
});

test("blocked at the player limit", () => {
  assert.match(limitMessage({ playerUsed: 3, siteUsed: 3 }, limits) ?? "", /daily limit/);
});

test("blocked at the site limit even if the player has none used", () => {
  assert.match(limitMessage({ playerUsed: 0, siteUsed: 30 }, limits) ?? "", /limit for everyone/);
});

test("remaining is the smaller of the two, never negative", () => {
  assert.equal(remainingForPlayer({ playerUsed: 1, siteUsed: 0 }, limits), 2);
  assert.equal(remainingForPlayer({ playerUsed: 0, siteUsed: 29 }, limits), 1);
  assert.equal(remainingForPlayer({ playerUsed: 5, siteUsed: 0 }, limits), 0);
});
