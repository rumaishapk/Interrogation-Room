import { test } from "node:test";
import assert from "node:assert/strict";
import { validateCase } from "../lib/game/validate-case.ts";
import { blackwoodCase } from "../db/seeds/blackwood.ts";
import type { CaseDefinition } from "../lib/game/types.ts";

// Each test gets a fresh deep copy, so breaking one copy can't affect another test.
function blackwood(): CaseDefinition {
  return structuredClone(blackwoodCase);
}

// Asserts the case is rejected with an error containing `expected`.
function assertRejected(input: unknown, expected: string) {
  const result = validateCase(input);
  assert.equal(result.ok, false, "expected the case to be rejected");
  if (!result.ok) {
    assert.ok(
      result.errors.some((e) => e.includes(expected)),
      `expected an error containing "${expected}", got:\n  ${result.errors.join("\n  ")}`
    );
  }
}

test("Blackwood passes validation", () => {
  const result = validateCase(blackwood());
  assert.deepEqual(result.ok ? [] : result.errors, []);
});

// ----- Layer 1: shape -----

test("rejects something that isn't a case at all", () => {
  assertRejected("hello", "(case)");
});

test("rejects an unknown difficulty", () => {
  assertRejected({ ...blackwood(), difficulty: "extreme" }, "difficulty");
});

test("rejects an empty suspect name and says where it is", () => {
  const c = blackwood();
  c.suspects[2].name = "   ";
  assertRejected(c, "suspects.2.name: must not be empty");
});

test("rejects a case with fewer than 3 suspects", () => {
  const c = blackwood();
  c.suspects = c.suspects.slice(0, 2);
  assertRejected(c, "at least 3 suspects");
});

test("rejects a badly formatted timeline time", () => {
  const c = blackwood();
  c.truth.timeline[0].time = "22:15";
  assertRejected(c, 'must look like "10:42 PM"');
});

test("rejects uppercase keywords, which could never match", () => {
  const c = blackwood();
  c.knowledge[0].topics[0].keywords = ["Kill"];
  assertRejected(c, "keywords must be lowercase");
});

// ----- Layer 2: mystery logic -----

test("rejects a murderer who isn't a suspect", () => {
  const c = blackwood();
  c.truth.murdererId = "bob";
  assertRejected(c, "truth.murdererId 'bob' is not a suspect");
});

test("rejects a weapon that isn't an option", () => {
  const c = blackwood();
  c.truth.weaponId = "candlestick";
  assertRejected(c, "truth.weaponId 'candlestick'");
});

test("rejects key evidence that doesn't exist", () => {
  const c = blackwood();
  c.truth.keyEvidenceIds.push("dna-report");
  assertRejected(c, "'dna-report' is not a clue");
});

test("rejects duplicate suspect ids", () => {
  const c = blackwood();
  c.suspects[1].id = "alice";
  assertRejected(c, "id 'alice' is used more than once");
});

test("rejects a suspect with no knowledge entry", () => {
  const c = blackwood();
  c.knowledge = c.knowledge.filter((k) => k.suspectId !== "sarah");
  assertRejected(c, "suspect 'sarah' has no knowledge entry");
});

test("rejects an unfair case where no key evidence names the murderer", () => {
  const c = blackwood();
  c.truth.keyEvidenceIds = ["torn-note"]; // the note's signature is torn away
  assertRejected(c, "no key evidence mentions the murderer");
});

test("rejects a timeline that goes back in time", () => {
  const c = blackwood();
  c.truth.timeline[3].time = "9:00 PM";
  assertRejected(c, "truth.timeline");
});

test("validation does not change the original seed data", () => {
  validateCase(blackwood());
  assert.equal(blackwoodCase.truth.murdererId, "david");
});
