import { notFound } from "next/navigation";
import { getCase, toPublicCase } from "@/lib/game/case-store";
import GameBoard from "@/components/GameBoard";

// A Server Component: it runs on the server, so it may read the full case.
// Only the public part crosses over to the browser as a prop.
export default function GamePage() {
  const caseDef = getCase("blackwood-001");
  if (!caseDef) notFound();

  return <GameBoard gameCase={toPublicCase(caseDef)} />;
}
