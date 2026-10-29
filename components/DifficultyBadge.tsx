import type { Difficulty } from "@/lib/game/types";
import Stamp from "@/components/ui/Stamp";

const tone = { easy: "green", medium: "brass", hard: "red" } as const;

// The case difficulty, as a rubber stamp.
export default function DifficultyBadge({ difficulty, onPaper = false }: { difficulty: Difficulty; onPaper?: boolean }) {
  // Brass ink is too faint on paper, so medium uses dark ink there.
  const stampTone = onPaper && difficulty === "medium" ? "ink" : tone[difficulty];
  return <Stamp tone={stampTone}>{difficulty}</Stamp>;
}
