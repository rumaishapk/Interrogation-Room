// Daily limits for player-created cases. Pure functions, so they're easy to test.
// "Per day" means the last 24 hours, which avoids time-zone questions.

export type Limits = { perPlayer: number; perSite: number };
export type Usage = { playerUsed: number; siteUsed: number };

const DEFAULTS: Limits = { perPlayer: 3, perSite: 30 };

// Reads PLAYER_DAILY_CASE_LIMIT and SITE_DAILY_CASE_LIMIT, falling back to the defaults
// when they're missing or not a sensible whole number.
export function readLimits(env: Record<string, string | undefined>): Limits {
  const read = (value: string | undefined, fallback: number) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 0 ? n : fallback;
  };
  return {
    perPlayer: read(env.PLAYER_DAILY_CASE_LIMIT, DEFAULTS.perPlayer),
    perSite: read(env.SITE_DAILY_CASE_LIMIT, DEFAULTS.perSite),
  };
}

// null = allowed. Otherwise a message for the player.
export function limitMessage(usage: Usage, limits: Limits): string | null {
  if (usage.playerUsed >= limits.perPlayer) {
    return `You've created ${limits.perPlayer} cases in the last 24 hours, the daily limit. Please come back tomorrow.`;
  }
  if (usage.siteUsed >= limits.perSite) {
    return "The case generator has reached today's limit for everyone. Please try again tomorrow.";
  }
  return null;
}

export function remainingForPlayer(usage: Usage, limits: Limits): number {
  return Math.max(0, Math.min(limits.perPlayer - usage.playerUsed, limits.perSite - usage.siteUsed));
}
