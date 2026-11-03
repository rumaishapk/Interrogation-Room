import { test } from "node:test";
import assert from "node:assert/strict";
import { FADE_STEP, MUSIC_VOLUME, stepToward, trackForPath } from "../lib/sound/tracks.ts";

test("cases being interrogated get the interrogation track", () => {
  assert.equal(trackForPath("/game/blackwood-001"), "interrogation");
});

test("every other player page gets the home track", () => {
  for (const path of ["/", "/cases", "/create", "/login", "/signup", "/signup/google", "/game", "/anything-else"]) {
    assert.equal(trackForPath(path), "home", path);
  }
});

test("the admin area is silent", () => {
  for (const path of ["/admin", "/admin/login", "/admin/cases/abc"]) {
    assert.equal(trackForPath(path), null, path);
  }
  // Only the real /admin folder: a case or page that merely starts with "admin" is a normal page.
  assert.equal(trackForPath("/administrators"), "home");
});

test("fading lands exactly on the target and never overshoots", () => {
  // Decimals aren't exact in floating point (0.35 - 0.1 is 0.24999999999999997), so allow a tiny gap.
  const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} vs ${expected}`);
  near(stepToward(0, 0.35, 0.1), 0.1);
  near(stepToward(0.35, 0, 0.1), 0.25);
  // Landing exactly on the target matters, so these are exact.
  assert.equal(stepToward(0.3, 0.35, 0.1), 0.35);
  assert.equal(stepToward(0.05, 0, 0.1), 0);
  assert.equal(stepToward(0.2, 0.2, 0.1), 0.2);
});

test("a full fade reaches the target in a finite number of steps", () => {
  let volume = 0;
  let steps = 0;
  while (volume !== MUSIC_VOLUME) {
    volume = stepToward(volume, MUSIC_VOLUME, FADE_STEP);
    assert.ok(++steps < 100, "fade should finish");
  }
  assert.ok(volume <= 1);
});
