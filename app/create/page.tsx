import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentPlayer } from "@/lib/auth/player-session";
import { remainingForPlayer } from "@/lib/game/generation-limits";
import { getLimits, getUsage } from "@/lib/game/player-cases";
import PlayerNav from "@/components/account/PlayerNav";
import CreateCaseForm from "@/components/create/CreateCaseForm";

export const metadata: Metadata = { title: "Create a case · Interrogation Room" };

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/cases" className="text-sm text-red-400">← All cases</Link>
          <PlayerNav />
        </div>
        <h1 className="mt-6 text-3xl font-bold">Create your own case</h1>
        <p className="mt-2 text-slate-400">
          Describe a murder mystery in your own words. The AI writes the suspects, clues and
          solution, and your case is published for everyone to play.
        </p>
        <Suspense fallback={<p className="mt-8 text-slate-500">Loading…</p>}>
          <CreateArea />
        </Suspense>
      </div>
    </main>
  );
}

async function CreateArea() {
  const player = await getCurrentPlayer();
  if (!player) {
    return (
      <p className="mt-8 rounded-xl border border-slate-800 p-6 text-slate-300">
        <Link href="/login" className="text-red-400">Log in</Link> or{" "}
        <Link href="/signup" className="text-red-400">create an account</Link> to make your own case.
      </p>
    );
  }

  const remaining = remainingForPlayer(await getUsage(player.id), getLimits());
  return (
    <>
      <ul className="mt-6 list-disc space-y-1 pl-5 text-sm text-slate-400">
        <li>Fictional people only: ideas about real people are refused.</li>
        <li>No children as victims or killers, no sexual content, no graphic gore.</li>
        <li>
          You can create <span className="font-semibold text-white">{remaining}</span> more{" "}
          {remaining === 1 ? "case" : "cases"} today.
        </li>
      </ul>
      <CreateCaseForm remaining={remaining} />
    </>
  );
}
