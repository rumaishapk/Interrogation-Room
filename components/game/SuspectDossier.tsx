import type { Suspect } from "@/lib/game/types";
import PaperCard from "@/components/ui/PaperCard";
import Stamp from "@/components/ui/Stamp";
import SuspectPortrait from "@/components/ui/SuspectPortrait";

type Props = {
  suspect: Suspect;
  questioned: boolean;
  // The buttons (Interrogate / Accuse) or the open chat/accusation panel.
  children: React.ReactNode;
};

// A suspect's profile, styled as a police dossier. Shows PUBLIC details only:
// name, occupation, appearance and description. Personality, alibi and secrets
// stay on the server.
export default function SuspectDossier({ suspect, questioned, children }: Props) {
  return (
    <PaperCard as="section" fastener="tape" className="mt-10 p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink-900/70 pb-3">
        <h2 className="font-display text-lg font-black uppercase tracking-[0.2em] text-ink-900">Suspect Dossier</h2>
        <span className="font-type text-xs uppercase tracking-widest text-ink-500">File: {suspect.id}</span>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr]">
        <div className="mx-auto w-44 sm:mx-0 sm:w-full">
          <div className="relative border-[6px] border-paper-50 shadow-md">
            <SuspectPortrait suspect={suspect} className="aspect-square w-full" />
            {questioned && (
              <Stamp tone="red" rotate={-12} className="absolute -bottom-3 -right-3 bg-paper-100/70">
                Questioned
              </Stamp>
            )}
          </div>
        </div>

        <dl className="grid content-start gap-x-6 gap-y-3 sm:grid-cols-[120px_1fr]">
          <dt className="font-type text-xs uppercase tracking-widest text-ink-500 sm:pt-1">Name</dt>
          <dd className="font-display text-2xl font-bold text-ink-900">{suspect.name}</dd>
          <dt className="font-type text-xs uppercase tracking-widest text-ink-500 sm:pt-0.5">Occupation</dt>
          <dd className="font-body text-ink-900">{suspect.occupation}</dd>
          {suspect.appearance && (
            <>
              <dt className="font-type text-xs uppercase tracking-widest text-ink-500 sm:pt-0.5">Appearance</dt>
              <dd className="font-body italic text-ink-700">{suspect.appearance}</dd>
            </>
          )}
          <dt className="font-type text-xs uppercase tracking-widest text-ink-500 sm:pt-0.5">Notes</dt>
          <dd className="font-type text-sm leading-6 text-ink-900">{suspect.description}</dd>
        </dl>
      </div>

      <div className="mt-6 border-t border-dashed border-ink-500/40 pt-5">{children}</div>
    </PaperCard>
  );
}
