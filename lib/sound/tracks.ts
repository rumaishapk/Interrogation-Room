// Which background track plays on which page, and how loud. No React or browser
// imports, so it can be unit-tested.

export type TrackName = "home" | "interrogation";
export const TRACK_NAMES: TrackName[] = ["home", "interrogation"];

// Files live in public/audio/ (see the README there). A missing file just means silence.
export const TRACK_FILES: Record<TrackName, string> = {
  home: "/audio/home.wav",
  interrogation: "/audio/interrogation.wav",
};

export const MUSIC_VOLUME = 0.35; // 0 to 1: quiet enough to sit under the suspect chat
export const FADE_SECONDS = 1.5;
export const TICK_MS = 50;
export const FADE_STEP = MUSIC_VOLUME / ((FADE_SECONDS * 1000) / TICK_MS);

// null = this page is silent and shows no sound control (the admin area).
export function trackForPath(pathname: string): TrackName | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  // A case being interrogated, e.g. /game/blackwood-001.
  if (pathname.startsWith("/game/")) return "interrogation";
  return "home";
}

// Moves a volume one step toward its target, landing exactly on it (never past it).
export function stepToward(current: number, target: number, step: number): number {
  if (Math.abs(target - current) <= step) return target;
  return current < target ? current + step : current - step;
}
