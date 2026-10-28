import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCase, toPublicCase } from "@/lib/game/case-store";
import GameBoard from "@/components/GameBoard";

// A Server Component: it runs on the server, so it may read the full case.
// Only the public part crosses over to the browser as a prop.
// The [caseId] folder name means /game/blackwood-001 gives params = { caseId: "blackwood-001" }.
export default function GamePage({ params }: PageProps<"/game/[caseId]">) {
  return (
    // The case comes from the database, so show a fallback while it loads.
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
          Opening the case file…
        </main>
      }
    >
      <CaseLoader params={params} />
    </Suspense>
  );
}

// params is a Promise in this Next.js version, so we await it inside the Suspense boundary.
async function CaseLoader({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  // Load at request time, never during `next build`.
  await connection();

  const caseDef = await getCase(caseId);
  if (!caseDef) notFound();

  return <GameBoard gameCase={toPublicCase(caseDef)} />;
}
