import type { Difficulty } from "@/lib/game/types";

const styles: Record<Difficulty, string> = {
  easy: "border-emerald-700 bg-emerald-950/40 text-emerald-300",
  medium: "border-amber-700 bg-amber-950/40 text-amber-300",
  hard: "border-red-700 bg-red-950/40 text-red-300",
};

export default function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${styles[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}
