import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Content } from "@google/genai";
import { getGemini, GEMINI_MODEL, isTemporaryGeminiError } from "@/lib/ai/gemini";
import { withRetry } from "@/lib/ai/retry";
import { caseSchema, validateCase } from "./validate-case";
import type { CaseDefinition, Difficulty } from "./types";

export type GenerateResult =
  | { ok: true; caseDef: CaseDefinition; attempts: number; totalTokens: number }
  | { ok: false; errors: string[]; attempts: number; totalTokens: number };

// One first try plus one repair. Each attempt is a paid API call, so keep this small.
const MAX_ATTEMPTS = 2;

// If Gemini is busy, wait 3s and retry, then 8s and retry once more.
const BUSY_RETRY_DELAYS_MS = [3_000, 8_000];

// Gemini accepts only part of JSON Schema. Remove the keywords it doesn't support.
// validateCase() still enforces those rules on whatever comes back.
const UNSUPPORTED_KEYWORDS = new Set(["$schema", "pattern", "minLength"]);

function forGemini(node: unknown, isPropertyMap = false): unknown {
  if (Array.isArray(node)) return node.map((item) => forGemini(item));
  if (node === null || typeof node !== "object") return node;
  return Object.fromEntries(
    Object.entries(node)
      // Inside "properties" the keys are our field names, not keywords, so keep them all.
      .filter(([key]) => isPropertyMap || !UNSUPPORTED_KEYWORDS.has(key))
      .map(([key, value]) => [key, forGemini(value, !isPropertyMap && key === "properties")])
  );
}

const GEMINI_SCHEMA = forGemini(z.toJSONSchema(caseSchema));

const DIFFICULTY_GUIDE: Record<Difficulty, string> = {
  easy: "3–4 suspects. Clear key evidence that names the murderer directly. At most one red herring.",
  medium: "4–5 suspects. Two red herrings. The murderer's alibi sounds solid until key evidence is compared.",
  hard: "5–6 suspects. Several red herrings, at least two suspects with strong motives, subtle key evidence.",
};

// The rules a fair, playable case must follow. They mirror what validateCase() checks,
// plus the storytelling rules that code can't check.
const SYSTEM_INSTRUCTION = `You write original murder mysteries for a detective game. Reply only with JSON matching the given schema.

Story rules:
- One victim, one murderer. The murderer is one of the suspects.
- Every suspect has a believable reason to be there and something they hide, so the answer isn't obvious.
- truth.explanation tells the whole story of what happened and why.

Evidence and fairness:
- truth.keyEvidenceIds must list the clues a player needs to prove the case: at least one clue for opportunity and one for motive.
- At least one key clue must mention the murderer by name.
- Include a crime-scene clue that lets the player work out the weapon and rule out the wrong weapons.
- Clues must only state what they could really show. Being nearby is not proof of murder.

Choices:
- motives and weapons each contain the true answer plus 2–3 wrong options. Each wrong motive should fit a different suspect.

Times:
- All times are on one evening, before midnight, written like "9:05 PM" (no leading zero).
- truth.timeline is in time order, and the murder falls inside timeOfDeath.

Suspect knowledge (used to answer the detective's questions):
- knowledge has exactly one entry per suspect.
- knows: only facts that suspect could really know. Innocent suspects do not know who the murderer is.
- secrets: what they are hiding. The murderer's alibi is a lie.
- topics: 4–6 per suspect. keywords are lowercase words a detective might type. Put the "kill", "murder" topic first. Replies are short, in character, and never confess or reveal a secret directly.

Ids are lowercase words joined by dashes, e.g. "security-log".`;

function buildRequest(difficulty: Difficulty): string {
  return `Write a new ${difficulty} case. ${DIFFICULTY_GUIDE[difficulty]} Choose a fresh setting and cast; avoid hotels and business partners.`;
}

export async function generateCase(difficulty: Difficulty): Promise<GenerateResult> {
  const ai = getGemini();
  // The conversation so far. A repair attempt adds the model's answer and our error list.
  const contents: Content[] = [{ role: "user", parts: [{ text: buildRequest(difficulty) }] }];
  let errors: string[] = [];
  let totalTokens = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await withRetry(
      () =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseJsonSchema: GEMINI_SCHEMA,
            httpOptions: { timeout: 120_000 },
          },
        }),
      {
        isTemporary: isTemporaryGeminiError,
        delaysMs: BUSY_RETRY_DELAYS_MS,
        onRetry: (err, delayMs) =>
          console.warn(`Gemini is busy (${(err as { status?: number }).status}). Retrying in ${delayMs / 1000}s…`),
      }
    );
    totalTokens += response.usageMetadata?.totalTokenCount ?? 0;
    const text = response.text ?? "";

    let draft: unknown;
    try {
      draft = JSON.parse(text);
    } catch {
      errors = ["the response was not valid JSON"];
    }

    if (draft !== null && typeof draft === "object" && !Array.isArray(draft)) {
      // We choose the id and difficulty ourselves rather than trusting the model:
      // the id must be unique, and the difficulty must be what was asked for.
      const result = validateCase({
        ...draft,
        id: `case-${randomUUID().slice(0, 8)}`,
        difficulty,
      });
      if (result.ok) return { ok: true, caseDef: result.caseDef, attempts: attempt, totalTokens };
      errors = result.errors;
    } else if (draft !== undefined) {
      errors = ["the response was JSON but not an object"];
    }

    // Show the model its own answer and what was wrong with it.
    contents.push(
      { role: "model", parts: [{ text }] },
      {
        role: "user",
        parts: [
          {
            text: `That case failed validation:\n- ${errors.join("\n- ")}\nFix every problem and return the complete corrected case as JSON.`,
          },
        ],
      }
    );
  }

  return { ok: false, errors, attempts: MAX_ATTEMPTS, totalTokens };
}
