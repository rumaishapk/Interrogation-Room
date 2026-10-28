import "server-only";
import type { AccusationResult, CaseDefinition } from "./types";

type Accusation = {
  suspectId: string;
  motiveId: string;
  weaponId: string;
  evidenceIds: string[];
};

// Returns null if the accusation refers to a suspect, motive, weapon, or clue that isn't in this case.
export function evaluateAccusation(
  caseDef: CaseDefinition,
  accusation: Accusation
): AccusationResult | null {
  const suspectExists = caseDef.suspects.some((s) => s.id === accusation.suspectId);
  const motiveExists = caseDef.motives.some((m) => m.id === accusation.motiveId);
  const weaponExists = caseDef.weapons.some((w) => w.id === accusation.weaponId);
  const evidenceExists = accusation.evidenceIds.every((id) =>
    caseDef.clues.some((c) => c.id === id)
  );
  if (!suspectExists || !motiveExists || !weaponExists || !evidenceExists) return null;

  const { truth } = caseDef;
  const culpritCorrect = accusation.suspectId === truth.murdererId;
  const motiveCorrect = accusation.motiveId === truth.motiveId;
  const weaponCorrect = accusation.weaponId === truth.weaponId;
  const evidenceSupported = truth.keyEvidenceIds.every((id) =>
    accusation.evidenceIds.includes(id)
  );

  let outcome: AccusationResult["outcome"] = "wrong-suspect";
  if (culpritCorrect) {
    outcome = motiveCorrect && weaponCorrect && evidenceSupported ? "solved" : "partial";
  }

  const murderer = caseDef.suspects.find((s) => s.id === truth.murdererId);

  return {
    outcome,
    culpritCorrect,
    motiveCorrect,
    weaponCorrect,
    evidenceSupported,
    murdererName: murderer?.name ?? "Unknown",
    explanation: truth.explanation,
    timeline: truth.timeline,
  };
}
