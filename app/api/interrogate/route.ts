import { getCase } from "@/lib/game/case-store";
import { askSuspect } from "@/lib/game/ai-interrogation";
import {
  getRecentMessages,
  questionLimit,
  questionsAskedToday,
  saveExchange,
} from "@/lib/game/interrogation-store";
import { getCurrentPlayer } from "@/lib/auth/player-session";
import { pool } from "@/lib/db/pool";

const MAX_MESSAGE_LENGTH = 500;

export async function POST(request: Request) {
  // The page already requires login, but an API can be called directly.
  const player = await getCurrentPlayer();
  if (!player) {
    return Response.json({ error: "Please log in to play." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  // Everything from the browser is untrusted, so check each field's type ourselves.
  const { caseId, suspectId, message } = (body ?? {}) as {
    caseId?: unknown;
    suspectId?: unknown;
    message?: unknown;
  };
  if (typeof caseId !== "string" || typeof suspectId !== "string" || typeof message !== "string") {
    return Response.json({ error: "caseId, suspectId and message are required." }, { status: 400 });
  }

  const question = message.trim();
  if (question.length === 0 || question.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `Message must be 1–${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  try {
    const caseDef = await getCase(caseId);
    if (!caseDef) {
      return Response.json({ error: "Case not found." }, { status: 404 });
    }

    // Each question costs a Gemini call, so cap them per player.
    if ((await questionsAskedToday(player.id)) >= questionLimit()) {
      return Response.json(
        { error: "You've asked the most questions allowed today. Please continue tomorrow." },
        { status: 429 }
      );
    }

    // The real conversation comes from the database, never from the browser.
    const history = await getRecentMessages(player.id, caseId, suspectId);
    const answer = await askSuspect(caseDef, suspectId, history, question);
    if (!answer) {
      return Response.json({ error: "Suspect not found." }, { status: 404 });
    }

    await saveExchange(player.id, caseId, suspectId, question, answer.reply, answer.source);
    return Response.json({ reply: answer.reply, source: answer.source });
  } catch (err) {
    console.error("Interrogation failed:", err);
    return Response.json({ error: "The interrogation room is unavailable right now." }, { status: 503 });
  }
}

// DELETE /api/interrogate  { "caseId": "..." }
// "Start Over": forget this player's conversations in one case.
export async function DELETE(request: Request) {
  const player = await getCurrentPlayer();
  if (!player) {
    return Response.json({ error: "Please log in to play." }, { status: 401 });
  }
  const { caseId } = ((await request.json().catch(() => ({}))) ?? {}) as { caseId?: unknown };
  if (typeof caseId !== "string") {
    return Response.json({ error: "caseId is required." }, { status: 400 });
  }
  try {
    // user_id in the WHERE clause: a player can only ever delete their OWN conversations.
    await pool.query("DELETE FROM interrogation_messages WHERE user_id = $1 AND case_id = $2", [player.id, caseId]);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Clearing conversations failed:", err);
    return Response.json({ error: "Could not reset the conversations." }, { status: 503 });
  }
}
