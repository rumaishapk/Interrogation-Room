"use client";

import Link from "next/link";
import { useState } from "react";
import type { AccusationResult, PublicCase } from "@/lib/game/types";
import InterrogationChat, { type ChatMessage } from "@/components/InterrogationChat";
import AccusationForm from "@/components/AccusationForm";
import VerdictPanel from "@/components/VerdictPanel";
import DifficultyBadge from "@/components/DifficultyBadge";

type Tab = "suspects" | "evidence" | "timeline";
type Panel = "none" | "interrogate" | "accuse";

type Props = {
  // Only the public part of the case. The server stripped the answers before sending it.
  gameCase: PublicCase;
};

export default function GameBoard({ gameCase }: Props) {
  const { suspects, clues } = gameCase;
  const [activeTab, setActiveTab] = useState<Tab>("suspects");
  const [selectedSuspectId, setSelectedSuspectId] = useState(
    suspects[0].id
  );
  const [panel, setPanel] = useState<Panel>("none");
  // One conversation per suspect, keyed by suspect id: { david: [...], alice: [...] }
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
  const [result, setResult] = useState<AccusationResult | null>(null);

  const selectedSuspect = suspects.find(
    (suspect) => suspect.id === selectedSuspectId
  );

  function addMessage(suspectId: string, message: ChatMessage) {
    // Use the functional form: a reply can arrive after other messages were added.
    setChatHistories((prev) => ({
      ...prev,
      [suspectId]: [...(prev[suspectId] ?? []), message],
    }));
  }

  function restart() {
    setActiveTab("suspects");
    setSelectedSuspectId(suspects[0].id);
    setPanel("none");
    setChatHistories({});
    setResult(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <Link href="/cases" className="text-sm text-red-400">
          ← All cases
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">
            {gameCase.title}
          </h1>
          <DifficultyBadge difficulty={gameCase.difficulty} />
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Victim: {gameCase.victim} · Location: {gameCase.location}
        </p>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 p-6 md:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border border-slate-800 p-4">
          <h2 className="mb-4 font-semibold">Investigation</h2>

          {result ? (
            <p className="rounded-lg bg-slate-900 px-4 py-3 text-sm text-slate-400">
              The case is closed.
            </p>
          ) : (
            (
              [
                ["suspects", "Suspects"],
                ["evidence", "Evidence"],
                ["timeline", "Timeline"],
              ] as [Tab, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`mb-2 w-full rounded-lg px-4 py-3 text-left ${
                  activeTab === tab
                    ? "bg-red-600"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {label}
              </button>
            ))
          )}

          <div className="mt-6 border-t border-slate-800 pt-4">
            <p className="text-sm text-slate-400">
              Estimated time of death
            </p>
            <p className="mt-1 text-sm">
              {gameCase.timeOfDeath}
            </p>
          </div>
        </aside>

        <section className="rounded-xl border border-slate-800 p-5 md:p-8">
          {result && <VerdictPanel result={result} onRestart={restart} />}

          {!result && activeTab === "suspects" && (
            <>
              <h2 className="text-xl font-bold">Suspects</h2>
              <p className="mt-2 text-sm text-slate-400">
                Examine each person&apos;s background and statements.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {suspects.map((suspect) => (
                  <button
                    key={suspect.id}
                    onClick={() => {
                      setSelectedSuspectId(suspect.id);
                      setPanel("none");
                    }}
                    className={`rounded-xl border p-4 text-left ${
                      selectedSuspectId === suspect.id
                        ? "border-red-500 bg-red-950/30"
                        : "border-slate-800 bg-slate-900 hover:border-slate-600"
                    }`}
                  >
                    <h3 className="font-semibold">
                      {suspect.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {suspect.occupation}
                    </p>
                    {(chatHistories[suspect.id]?.length ?? 0) > 0 && (
                      <p className="mt-2 text-xs text-red-400">Questioned</p>
                    )}
                  </button>
                ))}
              </div>

              {selectedSuspect && (
                <div className="mt-6 rounded-xl bg-slate-900 p-5">
                  <p className="text-sm text-red-400">
                    SUSPECT PROFILE
                  </p>
                  <h3 className="mt-2 text-xl font-bold">
                    {selectedSuspect.name}
                  </h3>
                  <p className="mt-2 text-slate-300">
                    {selectedSuspect.description}
                  </p>

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
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => setPanel("interrogate")}
                        className="rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-500"
                      >
                        {(chatHistories[selectedSuspect.id]?.length ?? 0) > 0
                          ? "Resume Interrogation"
                          : "Interrogate Suspect"}
                      </button>
                      <button
                        onClick={() => setPanel("accuse")}
                        className="rounded-lg border border-red-600 px-5 py-3 font-semibold text-red-300 hover:bg-red-950/40"
                      >
                        Accuse {selectedSuspect.name.split(" ")[0]}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!result && activeTab === "evidence" && (
            <>
              <h2 className="text-xl font-bold">Evidence Board</h2>
              <p className="mt-2 text-sm text-slate-400">
                Review the evidence available in this case.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {clues.map((clue) => (
                  <article
                    key={clue.id}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                  >
                    <h3 className="font-semibold">{clue.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {clue.description}
                    </p>
                  </article>
                ))}
              </div>
            </>
          )}

          {!result && activeTab === "timeline" && (
            <>
              <h2 className="text-xl font-bold">Case Timeline</h2>
              <p className="mt-2 text-slate-400">
                Events will appear here as you discover facts.
              </p>

              <div className="mt-6 border-l-2 border-red-600 pl-5">
                <p className="font-semibold">
                  {gameCase.timeOfDeath}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Estimated time of death. The exact timeline
                  remains under investigation.
                </p>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
