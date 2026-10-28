// The shape every case must follow. The database tables and the AI case
// generator will both be built around these types.

export type Difficulty = "easy" | "medium" | "hard";

export type Suspect = {
  id: string;
  name: string;
  occupation: string;
  description: string;
};

export type Clue = {
  id: string;
  title: string;
  description: string;
};

// Motives and weapons are both multiple-choice options in the accusation.
export type Choice = {
  id: string;
  label: string;
};

export type TimelineEvent = {
  time: string;
  event: string;
};

// A topic links the words a detective might use to the suspect's in-character answer.
export type Topic = {
  keywords: string[];
  reply: string;
};

export type SuspectKnowledge = {
  suspectId: string;
  personality: string;
  knows: string[];
  secrets: string[];
  initialAlibi: string;
  // Checked in order: the first topic with a matching keyword wins.
  topics: Topic[];
  fallbackReply: string;
};

export type CaseTruth = {
  murdererId: string;
  motiveId: string;
  weaponId: string;
  causeOfDeath: string;
  // Clues the player must cite to prove the case.
  keyEvidenceIds: string[];
  explanation: string;
  timeline: TimelineEvent[];
};

// Everything the player is allowed to see.
export type PublicCase = {
  id: string;
  title: string;
  difficulty: Difficulty;
  briefing: string;
  victim: string;
  location: string;
  timeOfDeath: string;
  suspects: Suspect[];
  clues: Clue[];
  motives: Choice[];
  weapons: Choice[];
};

// The full case, including answers. Server-only.
export type CaseDefinition = PublicCase & {
  truth: CaseTruth;
  knowledge: SuspectKnowledge[];
};

// What the server sends back after an accusation. Only revealed once the case is closed.
export type AccusationResult = {
  outcome: "solved" | "partial" | "wrong-suspect";
  culpritCorrect: boolean;
  motiveCorrect: boolean;
  weaponCorrect: boolean;
  evidenceSupported: boolean;
  murdererName: string;
  explanation: string;
  timeline: TimelineEvent[];
};
