// Shared button looks, as class strings so they work on <button> AND <Link>.

// Main action: a polished brass plate.
export const brassButton =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-brass-700 bg-gradient-to-b from-brass-300 to-brass-500 px-6 py-3 font-display text-lg font-semibold text-walnut-950 shadow-[0_2px_0_#7d5a22,0_8px_18px_rgb(0_0_0/0.45)] transition hover:from-lamp-300 hover:to-brass-300 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

// Secondary action on the dark desk: outlined in brass.
export const ghostButton =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-brass-500/70 px-4 py-2 font-type text-sm uppercase tracking-wider text-brass-300 transition hover:bg-brass-500/10 hover:text-lamp-300 disabled:cursor-not-allowed disabled:opacity-50";

// Secondary action on paper: inked outline.
export const inkButton =
  "inline-flex items-center justify-center gap-2 rounded-sm border border-ink-700/60 px-4 py-2 font-type text-sm uppercase tracking-wider text-ink-700 transition hover:bg-ink-900/5 disabled:cursor-not-allowed disabled:opacity-50";

// Text fields on paper: a typed line.
export const paperInput =
  "w-full rounded-sm border border-ink-500/40 bg-paper-50/70 px-4 py-3 font-type text-ink-900 placeholder:text-ink-500/70 outline-none transition focus:border-evidence-600 focus:bg-paper-50";
