import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { listPublishedCases } from "@/lib/game/case-store";
import DifficultyBadge from "@/components/DifficultyBadge";
import PlayerNav from "@/components/account/PlayerNav";

export default function CasesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-sm text-red-400">
            ← Interrogation Room
          </Link>
          <PlayerNav />
        </div>
        <h1 className="mt-4 text-3xl font-bold">Case Files</h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="text-slate-400">Choose a case to investigate.</p>
          <Link href="/create" className="rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-950/40">
            + Create your own case
          </Link>
        </div>

        {/* The heading above is static; only the list waits for the database. */}
        <Suspense fallback={<p className="mt-8 text-slate-500">Pulling the case files…</p>}>
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
    return (
      <p className="mt-8 rounded-xl border border-slate-800 p-6 text-slate-400">
        No cases have been published yet.
      </p>
    );
  }

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {cases.map((c) => (
        <Link
          key={c.id}
          href={`/game/${c.id}`}
          className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-red-500"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold">{c.title}</h2>
            <DifficultyBadge difficulty={c.difficulty} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{c.briefing}</p>
          <p className="mt-4 text-xs text-slate-500">
            {c.suspectCount} suspects
            {c.createdBy && <> · Created by {c.createdBy}</>}
          </p>
        </Link>
      ))}
    </div>
  );
}
