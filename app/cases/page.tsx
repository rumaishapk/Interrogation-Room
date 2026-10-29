import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { listPublishedCases } from "@/lib/game/case-store";
import DifficultyBadge from "@/components/DifficultyBadge";
import PlayerNav from "@/components/account/PlayerNav";
import CaseFolder from "@/components/ui/CaseFolder";

// Small, repeating tilts so the folders look dropped on the desk by hand.
const TILTS = [-1.2, 0.8, -0.5, 1.1, -0.9, 0.4];

export default function CasesPage() {
  return (
    <main className="desk min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="font-type text-sm uppercase tracking-wider text-brass-300 hover:text-lamp-300">
            ← Interrogation Room
          </Link>
          <PlayerNav />
        </div>

        <header className="mt-10 flex flex-wrap items-end justify-between gap-6 border-b border-brass-500/30 pb-6">
          <div>
            <p className="font-type text-xs uppercase tracking-[0.4em] text-brass-300">Open investigations</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-paper-100 sm:text-5xl">Case Files</h1>
            <p className="mt-2 font-body italic text-paper-300">Pick up a file and start asking questions.</p>
          </div>
          <Link
            href="/create"
            className="paper rounded-sm border-2 border-dashed border-ink-500/50 px-5 py-3 font-type text-sm uppercase tracking-wider text-ink-700 transition hover:-translate-y-0.5"
          >
            + Open a new case file
          </Link>
        </header>

        {/* The heading above is static; only the list waits for the database. */}
        <Suspense fallback={<p className="mt-10 font-type text-paper-300">Pulling the case files…</p>}>
          <CaseList />
        </Suspense>
      </div>
    </main>
  );
}

async function CaseList() {
  await connection();
  const cases = await listPublishedCases();

  if (cases.length === 0) {
    return <p className="mt-10 font-type text-paper-300">The cabinet is empty. No cases have been published yet.</p>;
  }

  return (
    <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {cases.map((c, i) => (
        <CaseFolder key={c.id} href={`/game/${c.id}`} label={`Case No. ${String(i + 1).padStart(3, "0")}`} tilt={TILTS[i % TILTS.length]}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-xl font-bold leading-snug text-ink-900">{c.title}</h2>
            <DifficultyBadge difficulty={c.difficulty} onPaper />
          </div>
          <p className="mt-3 line-clamp-4 font-body text-sm leading-6 text-ink-700">{c.briefing}</p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-ink-500/25 pt-3 font-type text-xs text-ink-500">
            <span>{c.suspectCount} suspects</span>
            {c.createdBy && <span>Filed by {c.createdBy}</span>}
          </div>
        </CaseFolder>
      ))}
    </div>
  );
}
