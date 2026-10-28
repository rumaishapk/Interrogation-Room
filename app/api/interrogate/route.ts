import { getCase } from "@/lib/game/case-store";
import { getSuspectReply } from "@/lib/game/interrogation";

const MAX_MESSAGE_LENGTH = 500;

export async function POST(request: Request) {
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

  const caseDef = getCase(caseId);
  if (!caseDef) {
    return Response.json({ error: "Case not found." }, { status: 404 });
  }

  const reply = getSuspectReply(caseDef, suspectId, question);
  if (reply === null) {
    return Response.json({ error: "Suspect not found." }, { status: 404 });
  }

  return Response.json({ reply });
}
