// What a suspect looks like, as a few fixed choices. Public information:
// it's shown on the profile and used to draw the portrait.
// Fixed lists (instead of free text) mean the portrait drawer always knows
// what to draw, and the AI generator can only pick valid options.
// Pure (no imports), so tests, the validator and the browser can all use it.

export const LOOK_OPTIONS = {
  presentation: ["feminine", "masculine", "neutral"],
  age: ["young", "adult", "older"],
  skin: ["porcelain", "fair", "tan", "olive", "brown", "deep"],
  hairColor: ["black", "brown", "auburn", "blonde", "red", "grey", "white"],
  hairStyle: ["short", "slicked", "curly", "bob", "long", "bun", "bald"],
  facialHair: ["none", "mustache", "beard"],
  glasses: ["none", "round", "square"],
  headwear: ["none", "fedora", "flat-cap", "beret", "cloche", "chef-hat"],
  outfit: ["suit", "trench-coat", "uniform", "chef", "lab-coat", "dress", "sweater", "apron"],
  outfitColor: ["brown", "navy", "green", "burgundy", "grey", "black", "cream"],
} as const;

type Options = typeof LOOK_OPTIONS;
export type SuspectLook = { [K in keyof Options]: Options[K][number] };

// A simple, stable number from a string, so the same suspect always gets the same look.
function hash(text: string): number {
  let h = 2166136261;
  for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Older cases were created before looks existed. Make a stable look from the suspect's id,
// and guess the presentation from pronouns in the description ("She says…", "He claims…").
export function fallbackLook(suspect: { id: string; description: string }): SuspectLook {
  const h = hash(suspect.id);
  const pick = <K extends keyof Options>(key: K, shift: number): Options[K][number] => {
    const list = LOOK_OPTIONS[key];
    return list[(h >>> shift) % list.length];
  };
  const text = ` ${suspect.description.toLowerCase()} `;
  const she = (text.match(/\b(she|her|hers)\b/g) ?? []).length;
  const he = (text.match(/\b(he|him|his)\b/g) ?? []).length;
  const presentation = she > he ? "feminine" : he > she ? "masculine" : "neutral";
  return {
    presentation,
    age: pick("age", 1),
    skin: pick("skin", 3),
    hairColor: pick("hairColor", 6),
    hairStyle: presentation === "feminine" ? (["bob", "long", "bun", "curly"] as const)[h % 4] : pick("hairStyle", 9),
    facialHair: presentation === "masculine" ? pick("facialHair", 12) : "none",
    glasses: pick("glasses", 15),
    headwear: "none",
    outfit: presentation === "feminine" ? (["dress", "suit", "sweater"] as const)[(h >>> 18) % 3] : (["suit", "trench-coat", "sweater"] as const)[(h >>> 18) % 3],
    outfitColor: pick("outfitColor", 21),
  };
}
