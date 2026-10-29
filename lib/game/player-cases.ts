import "server-only";
import { pool } from "@/lib/db/pool";
import { insertCase } from "@/lib/db/insert-case";
import { readLimits, type Limits, type Usage } from "./generation-limits";
import type { CaseDefinition } from "./types";

type AttemptOutcome = "rejected_idea" | "succeeded" | "failed";

// Attempts that cost real generation quota. Ideas refused by the safety check don't.
const COUNTED = "outcome IN ('running', 'succeeded', 'failed') AND created_at > now() - interval '24 hours'";

export function getLimits(): Limits {
  return readLimits(process.env);
}

export async function getUsage(userId: string): Promise<Usage> {
  const { rows } = await pool.query<Usage>(
    `SELECT
       COUNT(*) FILTER (WHERE user_id = $1)::int AS "playerUsed",
       COUNT(*)::int AS "siteUsed"
     FROM case_generation_attempts
     WHERE ${COUNTED}`,
    [userId]
  );
  return rows[0];
}

// Starts an attempt and returns its id, or "busy" if this player already has one running.
export async function startAttempt(userId: string): Promise<number | "busy"> {
  // If the server crashed mid-generation, a "running" row would block the player forever.
  // Treat anything running for over 10 minutes as failed.
  await pool.query(
    `UPDATE case_generation_attempts SET outcome = 'failed', finished_at = now()
     WHERE outcome = 'running' AND created_at < now() - interval '10 minutes'`
  );
  try {
    const { rows } = await pool.query<{ id: number }>(
      "INSERT INTO case_generation_attempts (user_id) VALUES ($1) RETURNING id",
      [userId]
    );
    return rows[0].id;
  } catch (err) {
    // The one_running_attempt_per_user index refused a second running attempt.
    if ((err as { code?: string }).code === "23505") return "busy";
    throw err;
  }
}

export async function finishAttempt(attemptId: number, outcome: AttemptOutcome, caseId?: string) {
  await pool.query(
    "UPDATE case_generation_attempts SET outcome = $2, case_id = $3, finished_at = now() WHERE id = $1",
    [attemptId, outcome, caseId ?? null]
  );
}

// Saves a player's case as published, with their name and idea, in one transaction.
export async function savePlayerCase(caseDef: CaseDefinition, userId: string, idea: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await insertCase(client, caseDef, "published", { userId, prompt: idea });
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
