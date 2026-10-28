import "server-only";
import type { CaseDefinition, PublicCase } from "./types";
import { blackwoodCase } from "./cases/blackwood";

// For now cases live in code. In the database step, these functions will
// query PostgreSQL instead, and nothing that calls them will need to change.
const allCases: CaseDefinition[] = [blackwoodCase];

export function getCase(caseId: string): CaseDefinition | undefined {
  return allCases.find((c) => c.id === caseId);
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
