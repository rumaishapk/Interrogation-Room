"use client";

import Link from "next/link";
import { useState } from "react";
import type { AccusationResult, PublicCase } from "@/lib/game/types";
import InterrogationChat, { type ChatMessage } from "@/components/InterrogationChat";
import AccusationForm from "@/components/AccusationForm";
import VerdictPanel from "@/components/VerdictPanel";
import DifficultyBadge from "@/components/DifficultyBadge";
import SuspectDossier from "@/components/game/SuspectDossier";
import PaperCard from "@/components/ui/PaperCard";
import PushPin from "@/components/ui/PushPin";
import Stamp from "@/components/ui/Stamp";
import SuspectPortrait from "@/components/ui/SuspectPortrait";
import { brassButton, inkButton } from "@/components/ui/buttons";

type Tab = "suspects" | "evidence" | "timeline";
type Panel = "none" | "interrogate" | "accuse";

type Props = {
  // Only the public part of the case. The server stripped the answers before sending it.
  gameCase: PublicCase;
  // Questions and answers saved on the server from earlier visits.
  initialConversations: Record<string, ChatMessage[]>;
};

const TABS: [Tab, string][] = [
  ["suspects", "Suspects"],
  ["evidence", "Evidence"],
  ["timeline", "Timeline"],
];

// Small repeating tilts so pinned items look placed by hand.
const TILTS = [-2, 1.5, -1, 2, -1.5, 1];
const tiltOf = (i: number) => TILTS[i % TILTS.length];

export default function GameBoard({ gameCase, initialConversations }: Props) {
  const { suspects, clues } = gameCase;
  const [activeTab, setActiveTab] = useState<Tab>("suspects");
  const [selectedSuspectId, setSelectedSuspectId] = useState(suspects[0].id);
  const [panel, setPanel] = useState<Panel>("none");
  // One conversation per suspect, keyed by suspect id: { david: [...], alice: [...] }
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>(initialConversations);
  const [result, setResult] = useState<AccusationResult | null>(null);

  const selectedSuspect = suspects.find((suspect) => suspect.id === selectedSuspectId);
  const questioned = (id: string) => (chatHistories[id]?.length ?? 0) > 0;

  function addMessage(suspectId: string, message: ChatMessage) {
    // Use the functional form: a reply can arrive after other messages were added.
    setChatHistories((prev) => ({
      ...prev,
      [suspectId]: [...(prev[suspectId] ?? []), message],
    }));
  }

  async function restart() {
    // Forget the saved conversations too, so suspects start fresh.
    await fetch("/api/interrogate", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: gameCase.id }),
    }).catch(() => {});
    setActiveTab("suspects");
    setSelectedSuspectId(suspects[0].id);
    setPanel("none");
    setChatHistories({});
    setResult(null);
  }

  return (
    <main className="desk min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/cases" className="font-type text-sm uppercase tracking-wider text-brass-300 hover:text-lamp-300">
          ← All case files
        </Link>

        {/* The case-file cover */}
        <PaperCard className="mt-5 p-5 sm:p-7" tilt={-0.4}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-type text-xs uppercase tracking-[0.35em] text-ink-500">Homicide · Case file</p>
              <h1 className="mt-2 font-display text-3xl font-black leading-tight text-ink-900 sm:text-4xl">{gameCase.title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <DifficultyBadge difficulty={gameCase.difficulty} onPaper />
              <Stamp tone={result ? "green" : "red"} rotate={6} size="sm">
                {result ? "Closed" : "Open"}
              </Stamp>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 border-t border-ink-500/30 pt-4 sm:grid-cols-3">
            {[
              ["Victim", gameCase.victim],
              ["Location", gameCase.location],
              ["Time of death", gameCase.timeOfDeath],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-type text-[11px] uppercase tracking-widest text-ink-500">{label}</dt>
                <dd className="mt-0.5 font-body font-semibold text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>
          {!result && <p className="mt-4 font-body text-sm italic leading-6 text-ink-700">{gameCase.briefing}</p>}
        </PaperCard>

        {result ? (
          <div className="mt-10">
            <VerdictPanel result={result} onRestart={restart} />
          </div>
        ) : (
          <>
            {/* Folder tabs */}
            <div role="tablist" aria-label="Case sections" className="mt-10 flex gap-1 overflow-x-auto pl-2">
              {TABS.map(([tab, label]) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 rounded-t-md px-5 pb-2 pt-2.5 font-type text-sm uppercase tracking-widest transition ${
                    activeTab === tab
                      ? "bg-paper-300 text-ink-900 shadow-[0_-3px_8px_rgb(0_0_0/0.35)]"
                      : "bg-walnut-800 text-paper-300 hover:bg-walnut-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="rounded-sm rounded-tl-none bg-paper-300 p-3 sm:p-5">
              {activeTab === "suspects" && (
                <div className="cork rounded-sm px-4 pb-10 pt-8 sm:px-8">
                  <p className="mb-6 font-type text-sm text-paper-50 [text-shadow:0_1px_2px_rgb(0_0_0/0.7)]">
                    Click a suspect to open their dossier.
                  </p>
                  <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                    {suspects.map((suspect, i) => {
                      const selected = suspect.id === selectedSuspectId;
                      return (
                        <li key={suspect.id} style={{ transform: `rotate(${tiltOf(i)}deg)` }}>
                          <button
                            onClick={() => {
                              setSelectedSuspectId(suspect.id);
                              setPanel("none");
                            }}
                            aria-pressed={selected}
                            className={`relative block w-full bg-paper-50 p-2 pb-3 text-left shadow-[0_8px_16px_rgb(0_0_0/0.45)] transition hover:-translate-y-1 ${
                              selected ? "ring-4 ring-lamp-300" : ""
                            }`}
                          >
                            <PushPin className="absolute -top-3 left-1/2 -translate-x-1/2" />
                            <SuspectPortrait suspect={suspect} className="aspect-square w-full" />
                            <span className="mt-2 block truncate text-center font-type text-sm text-ink-900">{suspect.name}</span>
                            <span className="block truncate text-center font-body text-xs italic text-ink-500">{suspect.occupation}</span>
                            {questioned(suspect.id) && (
                              <Stamp tone="red" rotate={-14} className="absolute right-1 top-[45%] bg-paper-50/70">
                                Questioned
                              </Stamp>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {activeTab === "evidence" && (
                <div className="cork rounded-sm px-4 pb-10 pt-8 sm:px-8">
                  <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
                    {clues.map((clue, i) => (
                      <PaperCard as="li" key={clue.id} fastener="pin" tilt={tiltOf(i) / 2} className="p-5 pt-6">
                        <p className="font-type text-xs uppercase tracking-[0.3em] text-evidence-600">
                          Exhibit {String.fromCharCode(65 + i)}
                        </p>
                        <h3 className="mt-1 font-display text-lg font-bold text-ink-900">{clue.title}</h3>
                        <p className="mt-2 font-type text-sm leading-6 text-ink-900">{clue.description}</p>
                      </PaperCard>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="px-2 py-6 sm:px-6">
                  <ol className="relative ml-3 border-l-4 border-dotted border-ink-700/50 pl-8">
                    <li className="relative">
                      <span aria-hidden="true" className="absolute -left-[42px] top-4 h-5 w-5 rounded-full border-4 border-paper-300 bg-evidence-600" />
                      <PaperCard className="max-w-md p-4" tilt={-0.6}>
                        <p className="font-type text-sm uppercase tracking-widest text-evidence-600">{gameCase.timeOfDeath}</p>
                        <p className="mt-1 font-body text-ink-900">Estimated time of death.</p>
                        <p className="mt-2 font-type text-xs text-ink-500">
                          The exact timeline remains under investigation. Question the suspects to piece it together.
                        </p>
                      </PaperCard>
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {activeTab === "suspects" && selectedSuspect && (
              <SuspectDossier suspect={selectedSuspect} questioned={questioned(selectedSuspect.id)}>
                {panel === "interrogate" && (
                  <InterrogationChat
                    key={selectedSuspect.id}
                    caseId={gameCase.id}
                    suspect={selectedSuspect}
                    messages={chatHistories[selectedSuspect.id] ?? []}
                    onNewMessage={(message) => addMessage(selectedSuspect.id, message)}
                    onEnd={() => setPanel("none")}
                  />
                )}

                {panel === "accuse" && (
                  <AccusationForm
                    key={selectedSuspect.id}
                    gameCase={gameCase}
                    suspect={selectedSuspect}
                    onResult={setResult}
                    onCancel={() => setPanel("none")}
                  />
                )}

                {panel === "none" && (
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => setPanel("interrogate")} className={brassButton}>
                      {questioned(selectedSuspect.id) ? "Resume Interrogation" : "Interrogate Suspect"}
                    </button>
                    <button onClick={() => setPanel("accuse")} className={`${inkButton} border-evidence-600 text-evidence-600`}>
                      Accuse {selectedSuspect.name.split(" ")[0]}
                    </button>
                  </div>
                )}
              </SuspectDossier>
            )}
          </>
        )}
      </div>
    </main>
  );
}
