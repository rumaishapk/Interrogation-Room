
export type SuspectKnowledge = {
  suspectId: string;
  personality: string;
  knows: string[];
  secrets: string[];
  initialAlibi: string;
};

export const suspectKnowledge: SuspectKnowledge[] = [
  {
    suspectId: "alice",
    personality: "Observant, cautious, and nervous.",
    knows: [
      "Alice met Richard near reception at 10:00 PM.",
      "Alice saw David heading toward the fourth floor at 10:20 PM.",
    ],
    secrets: [
      "Alice argued with Richard about a personal matter earlier that evening.",
    ],
    initialAlibi:
      "I was working near the reception desk.",
  },

  {
    suspectId: "david",
    personality: "Confident, calculating, and defensive.",
    knows: [
      "David left the restaurant at approximately 10:25 PM.",
      "David entered Room 407 at 10:38 PM.",
      "David killed Richard during an argument.",
      "Richard had discovered the stolen business money.",
    ],
    secrets: [
      "David is the murderer.",
      "David wants investigators to believe he stayed at the restaurant.",
    ],
    initialAlibi:
      "I was at the restaurant for most of the evening.",
  },

  {
    suspectId: "sarah",
    personality: "Curious, sharp, and persistent.",
    knows: [
      "Sarah came to interview Richard that evening.",
      "Richard seemed worried about an upcoming business meeting.",
    ],
    secrets: [
      "Sarah was investigating financial irregularities at Richard's company.",
    ],
    initialAlibi:
      "I came to interview Richard, but I did not kill him.",
  },

  {
    suspectId: "michael",
    personality: "Quiet, methodical, and observant.",
    knows: [
      "Michael was responsible for hotel security.",
      "The fourth-floor security records contain a gap that needs investigation.",
    ],
    secrets: [
      "Michael neglected to report a security system problem earlier that night.",
    ],
    initialAlibi:
      "I was on duty monitoring hotel security.",
  },
];
