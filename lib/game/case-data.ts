
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

export const murderCase = {
  id: "blackwood-001",
  title: "The Murder at Blackwood Hotel",
  victim: "Richard Hayes",
  location: "Room 407",
  timeOfDeath: "10:30 PM – 11:00 PM",
  briefing:
    "Businessman Richard Hayes was found dead in Room 407. Four people had reasons to meet him that night. Investigate their stories, examine the evidence, and identify the murderer.",
};

export const suspects: Suspect[] = [
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
];

export const clues: Clue[] = [
  {
    id: "security-log",
    title: "Security Log",
    description:
      "A preliminary log shows that someone accessed the fourth floor during the estimated time of death.",
  },
  {
    id: "phone-record",
    title: "Phone Record",
    description:
      "Richard received an unexplained phone call shortly before the estimated time of death.",
  },
  {
    id: "torn-note",
    title: "Torn Note",
    description:
      "A torn note recovered from the room mentions a meeting that night.",
  },
];
