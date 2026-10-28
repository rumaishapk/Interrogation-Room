// Writes one CaseDefinition into the case tables.
// Shared by the seed script and the AI generator. The caller must wrap it in a
// transaction (BEGIN/COMMIT) so a case is never saved half-way.
// Only type imports here, so Node can run it directly from scripts/seed.ts.
import type { ClientBase } from "pg";
import type { CaseDefinition, CaseStatus } from "../game/types";

export async function insertCase(client: ClientBase, c: CaseDefinition, status: CaseStatus) {
  // Remove any older copy first. ON DELETE CASCADE clears its suspects, clues, truth, etc.
  await client.query("DELETE FROM cases WHERE id = $1", [c.id]);

  // $1, $2 ... are placeholders. pg sends the values separately from the SQL,
  // so text like "Richard's" can never break (or inject into) the query.
  await client.query(
    `INSERT INTO cases (id, title, difficulty, briefing, victim, location, time_of_death, status, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $8 = 'published' THEN now() END)`,
    [c.id, c.title, c.difficulty, c.briefing, c.victim, c.location, c.timeOfDeath, status]
  );

  // The array index becomes `position`, so the display order is kept.
  for (const [i, s] of c.suspects.entries()) {
    await client.query(
      "INSERT INTO suspects (case_id, id, position, name, occupation, description) VALUES ($1, $2, $3, $4, $5, $6)",
      [c.id, s.id, i, s.name, s.occupation, s.description]
    );
  }
  for (const [i, clue] of c.clues.entries()) {
    await client.query(
      "INSERT INTO clues (case_id, id, position, title, description) VALUES ($1, $2, $3, $4, $5)",
      [c.id, clue.id, i, clue.title, clue.description]
    );
  }
  for (const [i, m] of c.motives.entries()) {
    await client.query(
      "INSERT INTO motives (case_id, id, position, label) VALUES ($1, $2, $3, $4)",
      [c.id, m.id, i, m.label]
    );
  }
  for (const [i, w] of c.weapons.entries()) {
    await client.query(
      "INSERT INTO weapons (case_id, id, position, label) VALUES ($1, $2, $3, $4)",
      [c.id, w.id, i, w.label]
    );
  }

  // The truth goes in after suspects, motives and weapons, because its foreign keys point at them.
  // JSONB values are passed through JSON.stringify: pg would otherwise send a JS array
  // as a Postgres array, which is a different type.
  const t = c.truth;
  await client.query(
    `INSERT INTO case_truths
       (case_id, murderer_id, motive_id, weapon_id, cause_of_death, key_evidence_ids, explanation, timeline)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      c.id,
      t.murdererId,
      t.motiveId,
      t.weaponId,
      t.causeOfDeath,
      JSON.stringify(t.keyEvidenceIds),
      t.explanation,
      JSON.stringify(t.timeline),
    ]
  );

  for (const k of c.knowledge) {
    await client.query(
      `INSERT INTO suspect_knowledge
         (case_id, suspect_id, personality, initial_alibi, knows, secrets, topics, fallback_reply)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        c.id,
        k.suspectId,
        k.personality,
        k.initialAlibi,
        JSON.stringify(k.knows),
        JSON.stringify(k.secrets),
        JSON.stringify(k.topics),
        k.fallbackReply,
      ]
    );
  }
}
