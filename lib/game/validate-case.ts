import { z } from "zod";
import type { CaseDefinition } from "./types";

// Checks whether a case is safe to publish. Used by the seed script now,
// and by the AI case generator later. Not secret, so no "server-only".

export type ValidationResult =
  | { ok: true; caseDef: CaseDefinition }
  | { ok: false; errors: string[] };

// ---------- Layer 1: shape (Zod) ----------
// "Does every field exist, with the right type?"

const id = z.string().regex(/^[a-z0-9-]+$/, "must be lowercase letters, numbers and dashes");
const text = z.string().trim().min(1, "must not be empty");
const time = z
  .string()
  .regex(/^(1[0-2]|[1-9]):[0-5]\d (AM|PM)$/, 'must look like "10:42 PM"');
const choice = z.object({ id, label: text });

// The type annotation makes TypeScript fail if this schema and CaseDefinition drift apart.
// Exported so the AI generator can tell Gemini what shape to produce.
export const caseSchema: z.ZodType<CaseDefinition> = z.object({
  id,
  title: text,
  difficulty: z.enum(["easy", "medium", "hard"]),
  briefing: text,
  victim: text,
  location: text,
  timeOfDeath: text,
  suspects: z
    .array(z.object({ id, name: text, occupation: text, description: text }))
    .min(3, "a mystery needs at least 3 suspects"),
  clues: z.array(z.object({ id, title: text, description: text })).min(2),
  motives: z.array(choice).min(2, "need at least one wrong motive to choose from"),
  weapons: z.array(choice).min(2, "need at least one wrong weapon to choose from"),
  truth: z.object({
    murdererId: id,
    motiveId: id,
    weaponId: id,
    causeOfDeath: text,
    keyEvidenceIds: z.array(id).min(1, "the player must be able to prove the case"),
    explanation: text,
    timeline: z.array(z.object({ time, event: text })).min(1),
  }),
  knowledge: z.array(
    z.object({
      suspectId: id,
      personality: text,
      knows: z.array(text),
      secrets: z.array(text),
      initialAlibi: text,
      topics: z
        .array(
          z.object({
            // Questions are lowercased before matching, so an uppercase keyword could never match.
            keywords: z
              .array(text.regex(/^[^A-Z]+$/, "keywords must be lowercase"))
              .min(1),
            reply: text,
          })
        )
        .min(1, "each suspect needs at least one topic"),
      fallbackReply: text,
    })
  ),
});

// ---------- Layer 2: mystery logic ----------
// "Do the pieces fit together, and is the case fair?"

function findDuplicates(values: string[]): string[] {
  return [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];
}

// "10:42 PM" -> minutes after midnight, so times can be compared.
function toMinutes(t: string): number {
  const [, h, m, period] = t.match(/^(\d+):(\d+) (AM|PM)$/)!;
  return (Number(h) % 12) * 60 + Number(m) + (period === "PM" ? 12 * 60 : 0);
}

function checkLogic(c: CaseDefinition): string[] {
  const errors: string[] = [];
  const suspectIds = c.suspects.map((s) => s.id);
  const clueIds = c.clues.map((cl) => cl.id);

  // Ids must be unique, or the engine can't tell items apart.
  const lists = { suspects: suspectIds, clues: clueIds, motives: c.motives.map((m) => m.id), weapons: c.weapons.map((w) => w.id) };
  for (const [listName, ids] of Object.entries(lists)) {
    for (const dup of findDuplicates(ids)) errors.push(`${listName}: id '${dup}' is used more than once`);
  }
  for (const dup of findDuplicates(c.suspects.map((s) => s.name.toLowerCase()))) {
    errors.push(`suspects: two suspects are named '${dup}'`);
  }

  // The solution must point at things that exist in this case.
  const { truth } = c;
  if (!suspectIds.includes(truth.murdererId)) {
    errors.push(`truth.murdererId '${truth.murdererId}' is not a suspect in this case`);
  }
  if (!c.motives.some((m) => m.id === truth.motiveId)) {
    errors.push(`truth.motiveId '${truth.motiveId}' is not one of the motive options`);
  }
  if (!c.weapons.some((w) => w.id === truth.weaponId)) {
    errors.push(`truth.weaponId '${truth.weaponId}' is not one of the weapon options`);
  }
  for (const clueId of truth.keyEvidenceIds) {
    if (!clueIds.includes(clueId)) errors.push(`truth.keyEvidenceIds: '${clueId}' is not a clue in this case`);
  }
  for (const dup of findDuplicates(truth.keyEvidenceIds)) {
    errors.push(`truth.keyEvidenceIds: '${dup}' is listed more than once`);
  }

  // Fairness: at least one key clue must name the murderer, or the player can't prove who did it.
  const murderer = c.suspects.find((s) => s.id === truth.murdererId);
  if (murderer) {
    const names = [murderer.name, ...murderer.name.split(" ")].map((n) => n.toLowerCase());
    const keyClues = c.clues.filter((cl) => truth.keyEvidenceIds.includes(cl.id));
    const pointsAtMurderer = keyClues.some((cl) =>
      names.some((n) => `${cl.title} ${cl.description}`.toLowerCase().includes(n))
    );
    if (keyClues.length > 0 && !pointsAtMurderer) {
      errors.push(`unfair: no key evidence mentions the murderer (${murderer.name})`);
    }
  }

  // Every suspect needs exactly one knowledge entry, or they can't be interrogated.
  const knowledgeIds = c.knowledge.map((k) => k.suspectId);
  for (const sid of suspectIds) {
    if (!knowledgeIds.includes(sid)) errors.push(`knowledge: suspect '${sid}' has no knowledge entry`);
  }
  for (const kid of knowledgeIds) {
    if (!suspectIds.includes(kid)) errors.push(`knowledge: '${kid}' is not a suspect in this case`);
  }
  for (const dup of findDuplicates(knowledgeIds)) {
    errors.push(`knowledge: suspect '${dup}' has more than one entry`);
  }

  // The true timeline must be in order. (Cases that cross midnight aren't supported yet.)
  truth.timeline.forEach((event, i) => {
    const previous = truth.timeline[i - 1];
    if (previous && toMinutes(event.time) < toMinutes(previous.time)) {
      errors.push(`truth.timeline: '${event.time}' comes after '${previous.time}' but is earlier`);
    }
  });

  return errors;
}

export function validateCase(input: unknown): ValidationResult {
  const parsed = caseSchema.safeParse(input);
  if (!parsed.success) {
    // e.g. "suspects.2.name: must not be empty"
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "(case)"}: ${issue.message}`),
    };
  }

  // Only check the logic once the shape is right, so we never read a missing field.
  const errors = checkLogic(parsed.data);
  return errors.length === 0 ? { ok: true, caseDef: parsed.data } : { ok: false, errors };
}
