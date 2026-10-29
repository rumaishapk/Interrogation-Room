import "server-only";
import { pool } from "@/lib/db/pool";
import type { ChatMessage } from "./types";

// How much of the conversation the AI sees. Enough to stay consistent,
// small enough to keep each call quick and cheap.
const HISTORY_FOR_AI = 20;

// All of a player's conversations in one case, grouped by suspect: { alice: [...], david: [...] }.
export async function getConversations(userId: string, caseId: string): Promise<Record<string, ChatMessage[]>> {
  const { rows } = await pool.query<ChatMessage & { suspectId: string; source: ChatMessage["source"] | null }>(
    `SELECT suspect_id AS "suspectId", role, content, source
     FROM interrogation_messages
     WHERE user_id = $1 AND case_id = $2
     ORDER BY id`,
    [userId, caseId]
  );
  const grouped: Record<string, ChatMessage[]> = {};
  for (const { suspectId, role, content, source } of rows) {
    (grouped[suspectId] ??= []).push(source ? { role, content, source } : { role, content });
  }
  return grouped;
}

// The latest messages with one suspect, oldest first.
export async function getRecentMessages(userId: string, caseId: string, suspectId: string): Promise<ChatMessage[]> {
  const { rows } = await pool.query<ChatMessage>(
    `SELECT role, content FROM (
       SELECT id, role, content FROM interrogation_messages
       WHERE user_id = $1 AND case_id = $2 AND suspect_id = $3
       ORDER BY id DESC LIMIT $4
     ) latest
     ORDER BY id`,
    [userId, caseId, suspectId, HISTORY_FOR_AI]
  );
  return rows;
}

// Saves the question and the answer together: both or neither (a transaction).
export async function saveExchange(
  userId: string,
  caseId: string,
  suspectId: string,
  question: string,
  reply: string,
  source: "ai" | "fallback"
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO interrogation_messages (user_id, case_id, suspect_id, role, content)
       VALUES ($1, $2, $3, 'detective', $4)`,
      [userId, caseId, suspectId, question]
    );
    await client.query(
      `INSERT INTO interrogation_messages (user_id, case_id, suspect_id, role, content, source)
       VALUES ($1, $2, $3, 'suspect', $4, $5)`,
      [userId, caseId, suspectId, reply, source]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export function questionLimit(): number {
  const n = Number(process.env.PLAYER_DAILY_QUESTION_LIMIT);
  return Number.isInteger(n) && n >= 0 ? n : 200;
}

export async function questionsAskedToday(userId: string): Promise<number> {
  const { rows } = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM interrogation_messages
     WHERE user_id = $1 AND role = 'detective' AND created_at > now() - interval '24 hours'`,
    [userId]
  );
  return rows[0].count;
}
