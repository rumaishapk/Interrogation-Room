// Seed data: read only by scripts/seed.ts, never imported by the app.
// The app loads cases from PostgreSQL. Run `npm run db:seed` after editing this file.
import type { CaseDefinition } from "../../lib/game/types.ts";

export const blackwoodCase: CaseDefinition = {
  id: "blackwood-001",
  title: "The Murder at Blackwood Hotel",
  difficulty: "easy",
  victim: "Richard Hayes",
  location: "Room 407",
  timeOfDeath: "10:30 PM – 11:00 PM",
  briefing:
    "Businessman Richard Hayes was found dead in Room 407. Four people had reasons to meet him that night. Investigate their stories, examine the evidence, and identify the murderer.",

  suspects: [
    {
      id: "alice",
      name: "Alice Morgan",
      occupation: "Hotel Manager",
      description: "She says she was working at the front desk.",
    },
    {
      id: "david",
      name: "David Carter",
      occupation: "Business Partner",
      description: "He claims he spent the evening at the restaurant.",
    },
    {
      id: "sarah",
      name: "Sarah Wilson",
      occupation: "Journalist",
      description: "She says she came to interview Richard.",
    },
    {
      id: "michael",
      name: "Michael Brown",
      occupation: "Security Guard",
      description: "He was responsible for monitoring hotel security.",
    },
  ],

  clues: [
    {
      id: "scene-report",
      title: "Room 407 Scene Report",
      description:
        "Richard died from a single blow to the head with a heavy, blunt object. The brass desk ornament normally kept on the writing desk was found under the bed, wiped clean. The glass decanter on the minibar is intact.",
    },
    {
      id: "security-log",
      title: "Fourth-Floor Access Log",
      description:
        "The keycard system recorded David Carter's card opening the fourth-floor corridor door at 10:36 PM. The corridor cameras were offline at the time.",
    },
    {
      id: "phone-record",
      title: "Business Phone Record",
      description:
        "At 9:50 PM Richard texted David: \"I've seen the accounts. Come to my room tonight and explain the missing money.\"",
    },
    {
      id: "torn-note",
      title: "Torn Meeting Note",
      description:
        "Found in Room 407: \"Room 407. We settle the missing money tonight.\" The signature has been torn away.",
    },
  ],

  // Every motive is plausible for at least one suspect, so the list itself gives nothing away.
  motives: [
    { id: "stolen-money", label: "Richard discovered money had been stolen from the business" },
    { id: "personal-dispute", label: "A personal dispute with Richard turned violent" },
    { id: "silence-story", label: "Richard threatened to ruin a news story" },
    { id: "cover-security", label: "Covering up a failure in hotel security" },
  ],

  // Only the scene report lets the player rule out the wrong weapons.
  weapons: [
    { id: "desk-ornament", label: "Brass desk ornament" },
    { id: "glass-decanter", label: "Glass whiskey decanter" },
    { id: "letter-opener", label: "Letter opener" },
    { id: "bathrobe-cord", label: "Bathrobe cord" },
  ],

  truth: {
    murdererId: "david",
    motiveId: "stolen-money",
    weaponId: "desk-ornament",
    causeOfDeath: "A fatal blow to the head",
    // One clue for opportunity, one for motive.
    keyEvidenceIds: ["security-log", "phone-record"],
    explanation:
      "David Carter had been secretly taking money from the business he shared with Richard. When Richard found out, he texted David to come to his room and explain. David slipped out of the restaurant, used his keycard to reach the fourth floor, and argued with Richard in Room 407. During the argument he struck Richard with the brass desk ornament, hid it under the bed after wiping it clean, then returned downstairs and claimed he had never left the restaurant.",
    timeline: [
      { time: "9:50 PM", event: "Richard texts David demanding an explanation for the missing money." },
      { time: "10:00 PM", event: "Richard speaks briefly with Alice near reception." },
      { time: "10:25 PM", event: "David leaves the restaurant." },
      { time: "10:30 PM", event: "Alice sees David heading toward the fourth-floor lifts." },
      { time: "10:36 PM", event: "David's keycard opens the fourth-floor corridor door." },
      { time: "10:38 PM", event: "David enters Room 407." },
      { time: "10:42 PM", event: "During an argument, David strikes Richard with the desk ornament." },
      { time: "10:47 PM", event: "David leaves Room 407." },
    ],
  },

  knowledge: [
    {
      suspectId: "alice",
      personality: "Observant, cautious, and nervous.",
      knows: [
        "Alice met Richard near reception at 10:00 PM.",
        "Alice saw David heading toward the fourth-floor lifts at about 10:30 PM.",
      ],
      secrets: [
        "Alice argued with Richard about a personal matter earlier that evening.",
      ],
      initialAlibi: "I was working near the reception desk.",
      topics: [
        {
          keywords: ["kill", "murder", "did you do"],
          reply:
            "Me? No! I— I run this hotel. I would never hurt a guest. Please, you have to believe me.",
        },
        {
          keywords: ["argue", "argument", "personal", "hiding", "secret"],
          reply:
            "I don't know what you've heard. Whatever was between Mr. Hayes and me has nothing to do with this.",
        },
        {
          keywords: ["david", "carter", "partner"],
          reply:
            "Mr. Carter? I— I think I saw him heading toward the fourth-floor lifts. Around half past ten, maybe. I didn't think anything of it at the time.",
        },
        {
          keywords: ["richard", "hayes", "victim"],
          reply:
            "Mr. Hayes stopped by reception around ten o'clock. He seemed... tense. We spoke briefly. That's all.",
        },
        {
          keywords: ["where", "alibi", "doing", "reception", "front desk"],
          reply:
            "I was at the reception desk most of the evening. It was a busy night. I barely left the counter.",
        },
      ],
      fallbackReply:
        "I... I'm not sure what you mean. Could you ask me something more specific?",
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
      initialAlibi: "I was at the restaurant for most of the evening.",
      topics: [
        {
          keywords: ["kill", "murder", "did you do"],
          reply:
            "That's absurd. Richard was my business partner. If you're going to accuse me, Detective, you'd better have more than a hunch.",
        },
        {
          keywords: ["money", "funds", "stolen", "missing", "accounts", "finances"],
          reply:
            "Our finances are perfectly in order. If someone told you otherwise, they don't understand how a business works.",
        },
        {
          keywords: ["fourth floor", "4th floor", "407", "upstairs", "his room"],
          reply:
            "I had no reason to go up to his room. I told you, I was at the restaurant.",
        },
        {
          keywords: ["richard", "hayes", "victim"],
          reply:
            "Richard and I built that company together. What happened to him is a tragedy. Truly.",
        },
        {
          keywords: ["where", "alibi", "doing", "restaurant", "dinner"],
          reply:
            "I was in the restaurant downstairs for most of the evening. Dinner, some paperwork. Ask the staff if you like.",
        },
      ],
      fallbackReply:
        "I've answered your questions, Detective. Is there anything else, or are we done here?",
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
      initialAlibi: "I came to interview Richard, but I did not kill him.",
      topics: [
        {
          keywords: ["kill", "murder", "did you do"],
          reply:
            "I came here for a story, not a crime. Killing my own interview subject would be a terrible career move, don't you think?",
        },
        {
          keywords: ["story", "article", "investigating", "money", "finances", "irregular"],
          reply:
            "I protect my research, Detective. What I'm writing about stays with me until it's published.",
        },
        {
          keywords: ["meeting", "worried", "nervous", "upset"],
          reply:
            "He mentioned a business meeting he clearly wasn't looking forward to. He didn't say who with, but it was weighing on him.",
        },
        {
          keywords: ["richard", "hayes", "victim", "interview"],
          reply:
            "He was distracted the whole time. Kept checking his phone instead of answering my questions.",
        },
        {
          keywords: ["where", "alibi", "doing", "why were you"],
          reply:
            "I came to the hotel to interview Richard. It was arranged in advance. Check if you like.",
        },
      ],
      fallbackReply:
        "Interesting question. I'm not sure I can help with that, but I'd love to know why you're asking.",
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
      initialAlibi: "I was on duty monitoring hotel security.",
      topics: [
        {
          keywords: ["kill", "murder", "did you do"],
          reply: "No. I was on duty. That's all there is to say.",
        },
        {
          keywords: ["report", "fault", "malfunction", "broken", "problem"],
          reply: "Every system has faults now and then. I do my job.",
        },
        {
          keywords: ["camera", "security", "log", "record", "footage", "access", "gap"],
          reply: "The fourth-floor records have a gap. I'm still working out why.",
        },
        {
          keywords: ["richard", "hayes", "victim"],
          reply: "I didn't know him personally.",
        },
        {
          keywords: ["where", "alibi", "doing", "duty", "shift"],
          reply: "On duty. Monitoring the cameras and the access system, as usual.",
        },
      ],
      fallbackReply: "I can't help you with that.",
    },
  ],
};
