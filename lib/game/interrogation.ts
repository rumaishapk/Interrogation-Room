import "server-only";
import type { CaseDefinition } from "./types";

// Returns the suspect's in-character reply, or null if the suspect isn't in this case.
export function getSuspectReply(
  caseDef: CaseDefinition,
  suspectId: string,
  question: string
): string | null {
  const suspect = caseDef.knowledge.find((s) => s.suspectId === suspectId);
  if (!suspect) return null;

  const normalized = question.toLowerCase();
  const topic = suspect.topics.find((t) =>
    t.keywords.some((keyword) => normalized.includes(keyword))
  );

  return topic ? topic.reply : suspect.fallbackReply;
}
