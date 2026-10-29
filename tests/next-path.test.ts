import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "../lib/auth/next-path.ts";

test("allows paths on this site", () => {
  for (const path of ["/game/blackwood-001", "/cases", "/create", "/game/case-1?x=1"]) {
    assert.equal(safeNextPath(path), path);
  }
});

test("blocks links to other sites (open redirect)", () => {
  for (const bad of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "evil.example",
    "",
  ]) {
    assert.equal(safeNextPath(bad), "/cases", JSON.stringify(bad));
  }
});

test("blocks hidden control characters", () => {
  assert.equal(safeNextPath("/game\n/x"), "/cases");
});

test("falls back when there is no value", () => {
  assert.equal(safeNextPath(undefined), "/cases");
  assert.equal(safeNextPath(null), "/cases");
  assert.equal(safeNextPath(42), "/cases");
});
