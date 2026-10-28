import { getCase } from "@/lib/game/case-store";
import { evaluateAccusation } from "@/lib/game/accusation";

const MAX_EVIDENCE = 10;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { caseId, suspectId, motiveId, weaponId, evidenceIds } = (body ?? {}) as {
    caseId?: unknown;
    suspectId?: unknown;
    motiveId?: unknown;
    weaponId?: unknown;
    evidenceIds?: unknown;
  };

  if (
    typeof caseId !== "string" ||
    typeof suspectId !== "string" ||
    typeof motiveId !== "string" ||
    typeof weaponId !== "string"
  ) {
    return Response.json(
      { error: "caseId, suspectId, motiveId and weaponId are required." },
      { status: 400 }
    );
  }
  if (
    !Array.isArray(evidenceIds) ||
    evidenceIds.length === 0 ||
    evidenceIds.length > MAX_EVIDENCE ||
    !evidenceIds.every((id) => typeof id === "string")
  ) {
    return Response.json({ error: "Select at least one piece of evidence." }, { status: 400 });
  }

  const caseDef = getCase(caseId);
  if (!caseDef) {
    return Response.json({ error: "Case not found." }, { status: 404 });
  }

  // new Set removes duplicates, so picking the same clue twice doesn't count double.
  const result = evaluateAccusation(caseDef, {
    suspectId,
    motiveId,
    weaponId,
    evidenceIds: [...new Set(evidenceIds as string[])],
  });
  if (result === null) {
    return Response.json(
      { error: "Unknown suspect, motive, weapon, or evidence." },
      { status: 400 }
    );
  }

  return Response.json(result);
}
