import "server-only";
import { pool } from "@/lib/db/pool";
import type {
  CaseDefinition,
  CaseStatus,
  CaseSummary,
  CaseTruth,
  Choice,
  Clue,
  PublicCase,
  Suspect,
  SuspectKnowledge,
} from "./types";

type CaseRow = Omit<PublicCase, "suspects" | "clues" | "motives" | "weapons">;

// Every published case, easiest first. Reads no secret tables.
export async function listPublishedCases(): Promise<CaseSummary[]> {
  // COUNT(*) comes back from Postgres as a string (it can exceed JS number range),
  // so ::int converts it to a regular integer.
  const { rows } = await pool.query<CaseSummary>(
    `SELECT c.id, c.title, c.difficulty, c.briefing,
            (SELECT COUNT(*)::int FROM suspects s WHERE s.case_id = c.id) AS "suspectCount"
     FROM cases c
     WHERE c.status = 'published'
     ORDER BY CASE c.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, c.title`
  );
  return rows;
}

export type AdminCaseSummary = CaseSummary & {
  status: CaseStatus;
  createdAt: Date;
};

// Every case in every status, newest first. Admin only.
export async function listAllCases(): Promise<AdminCaseSummary[]> {
  const { rows } = await pool.query<AdminCaseSummary>(
    `SELECT c.id, c.title, c.difficulty, c.briefing, c.status, c.created_at AS "createdAt",
            (SELECT COUNT(*)::int FROM suspects s WHERE s.case_id = c.id) AS "suspectCount"
     FROM cases c
     ORDER BY c.created_at DESC`
  );
  return rows;
}

// Changes a case's status. published_at is set when publishing and cleared otherwise.
// Returns false if no case has that id.
export async function setCaseStatus(caseId: string, status: CaseStatus): Promise<boolean> {
  const result = await pool.query(
    `UPDATE cases
     SET status = $2, published_at = CASE WHEN $2 = 'published' THEN now() END
     WHERE id = $1`,
    [caseId, status]
  );
  return result.rowCount === 1;
}

// Loads one published case and everything that belongs to it.
// Returns undefined if the case doesn't exist, isn't published, or is incomplete.
export async function getCase(caseId: string): Promise<CaseDefinition | undefined> {
  return loadCase(caseId, true);
}

// Same, but in any status: drafts and rejected cases too. Admin only.
export async function getCaseAnyStatus(
  caseId: string
): Promise<{ caseDef: CaseDefinition; status: CaseStatus } | undefined> {
  const caseDef = await loadCase(caseId, false);
  if (!caseDef) return undefined;
  const { rows } = await pool.query<{ status: CaseStatus }>(
    "SELECT status FROM cases WHERE id = $1",
    [caseId]
  );
  return { caseDef, status: rows[0].status };
}

async function loadCase(
  caseId: string,
  publishedOnly: boolean
): Promise<CaseDefinition | undefined> {
  // `AS "timeOfDeath"` renames snake_case columns to the camelCase names our types use.
  // The status filter is a fixed SQL string chosen by our code, never by the request.
  const caseResult = await pool.query<CaseRow>(
    `SELECT id, title, difficulty, briefing, victim, location, time_of_death AS "timeOfDeath"
     FROM cases
     WHERE id = $1 ${publishedOnly ? "AND status = 'published'" : ""}`,
    [caseId]
  );
  const caseRow = caseResult.rows[0];
  if (!caseRow) return undefined;

  // These queries don't depend on each other, so run them at the same time.
  const [suspects, clues, motives, weapons, truth, knowledge] = await Promise.all([
    pool.query<Suspect>(
      "SELECT id, name, occupation, description FROM suspects WHERE case_id = $1 ORDER BY position",
      [caseId]
    ),
    pool.query<Clue>(
      "SELECT id, title, description FROM clues WHERE case_id = $1 ORDER BY position",
      [caseId]
    ),
    pool.query<Choice>(
      "SELECT id, label FROM motives WHERE case_id = $1 ORDER BY position",
      [caseId]
    ),
    pool.query<Choice>(
      "SELECT id, label FROM weapons WHERE case_id = $1 ORDER BY position",
      [caseId]
    ),
    // pg turns JSONB columns back into JavaScript arrays and objects automatically.
    pool.query<CaseTruth>(
      `SELECT murderer_id AS "murdererId", motive_id AS "motiveId", weapon_id AS "weaponId",
              cause_of_death AS "causeOfDeath", key_evidence_ids AS "keyEvidenceIds",
              explanation, timeline
       FROM case_truths WHERE case_id = $1`,
      [caseId]
    ),
    pool.query<SuspectKnowledge>(
      `SELECT k.suspect_id AS "suspectId", k.personality, k.initial_alibi AS "initialAlibi",
              k.knows, k.secrets, k.topics, k.fallback_reply AS "fallbackReply"
       FROM suspect_knowledge k
       JOIN suspects s ON s.case_id = k.case_id AND s.id = k.suspect_id
       WHERE k.case_id = $1
       ORDER BY s.position`,
      [caseId]
    ),
  ]);

  // A case without a solution can't be played or judged.
  if (truth.rows.length === 0) return undefined;

  return {
    ...caseRow,
    suspects: suspects.rows,
    clues: clues.rows,
    motives: motives.rows,
    weapons: weapons.rows,
    truth: truth.rows[0],
    knowledge: knowledge.rows,
  };
}

// Copies only the public fields. Listing what to keep (instead of deleting
// truth/knowledge) means a new secret field can't leak by accident.
export function toPublicCase(caseDef: CaseDefinition): PublicCase {
  return {
    id: caseDef.id,
    title: caseDef.title,
    difficulty: caseDef.difficulty,
    briefing: caseDef.briefing,
    victim: caseDef.victim,
    location: caseDef.location,
    timeOfDeath: caseDef.timeOfDeath,
    suspects: caseDef.suspects,
    clues: caseDef.clues,
    motives: caseDef.motives,
    weapons: caseDef.weapons,
  };
}
