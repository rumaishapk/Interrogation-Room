import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentPlayer } from "@/lib/auth/player-session";
import { remainingForPlayer } from "@/lib/game/generation-limits";
import { getLimits, getUsage } from "@/lib/game/player-cases";
import PlayerNav from "@/components/account/PlayerNav";
import CreateCaseForm from "@/components/create/CreateCaseForm";
import PaperCard from "@/components/ui/PaperCard";
import Stamp from "@/components/ui/Stamp";
import { brassButton, inkButton } from "@/components/ui/buttons";

export const metadata: Metadata = { title: "Create a case · Interrogation Room" };

export default function CreatePage() {
  return (
    <main className="desk min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/cases" className="font-type text-sm uppercase tracking-wider text-brass-300 hover:text-lamp-300">
            ← All case files
          </Link>
          <PlayerNav />
        </div>

        <header className="mt-10">
          <p className="font-type text-xs uppercase tracking-[0.4em] text-brass-300">New investigation</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-paper-100 sm:text-5xl">Open a New Case File</h1>
          <p className="mt-3 max-w-2xl font-body italic leading-7 text-paper-300">
            Describe a murder mystery in your own words. The AI writes the suspects, clues and solution, and
            your case is published for every detective to play.
          </p>
        </header>

        <Suspense fallback={<p className="mt-10 font-type text-paper-300">Fetching a blank file…</p>}>
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
      <PaperCard fastener="pin" tilt={-0.6} className="mt-10 p-6 text-center sm:p-8">
        <p className="font-type text-ink-900">Only registered detectives can open new case files.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/login?next=%2Fcreate" className={brassButton}>Log in</Link>
          <Link href="/signup?next=%2Fcreate" className={inkButton}>Create an account</Link>
        </div>
      </PaperCard>
    );
  }

  const remaining = remainingForPlayer(await getUsage(player.id), getLimits());
  return (
    <PaperCard fastener="tape" className="mt-10 p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink-900/70 pb-3">
        <span className="font-display text-lg font-black uppercase tracking-[0.2em] text-ink-900">Case File: Unassigned</span>
        <Stamp tone={remaining > 0 ? "ink" : "red"} rotate={4}>
          {remaining} {remaining === 1 ? "file" : "files"} left today
        </Stamp>
      </div>

      <div className="mt-5 border-l-4 border-evidence-600/70 bg-ink-900/5 px-4 py-3">
        <p className="font-type text-xs uppercase tracking-widest text-evidence-600">House rules</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 font-type text-sm text-ink-900">
          <li>Fictional people only: ideas about real people are refused.</li>
          <li>No children as victims or killers, no sexual content, no graphic gore.</li>
        </ul>
      </div>

      <CreateCaseForm remaining={remaining} />
    </PaperCard>
  );
}
