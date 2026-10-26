
"use client";

import { useState } from "react";
import { clues, suspects, murderCase } from "@/lib/game/case-data";

type Tab = "suspects" | "evidence" | "timeline";

export default function GamePage() {
  const [activeTab, setActiveTab] = useState<Tab>("suspects");
  const [selectedSuspectId, setSelectedSuspectId] = useState(
    suspects[0].id
  );

  const selectedSuspect = suspects.find(
    (suspect) => suspect.id === selectedSuspectId
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <a href="/" className="text-sm text-red-400">
          ← Interrogation Room
        </a>

        <h1 className="mt-3 text-2xl font-bold">
          {murderCase.title}
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Victim: {murderCase.victim} · Location: {murderCase.location}
        </p>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 p-6 md:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border border-slate-800 p-4">
          <h2 className="mb-4 font-semibold">Investigation</h2>

          {(
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
          ))}

          <div className="mt-6 border-t border-slate-800 pt-4">
            <p className="text-sm text-slate-400">
              Estimated time of death
            </p>
            <p className="mt-1 text-sm">
              {murderCase.timeOfDeath}
            </p>
          </div>
        </aside>

        <section className="rounded-xl border border-slate-800 p-5 md:p-8">
          {activeTab === "suspects" && (
            <>
              <h2 className="text-xl font-bold">Suspects</h2>
              <p className="mt-2 text-sm text-slate-400">
                Examine each person's background and statements.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {suspects.map((suspect) => (
                  <button
                    key={suspect.id}
                    onClick={() =>
                      setSelectedSuspectId(suspect.id)
                    }
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

                  <button
                    onClick={() =>
                      alert("We will build AI interrogation next!")
                    }
                    className="mt-5 rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-500"
                  >
                    Interrogate Suspect
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === "evidence" && (
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

          {activeTab === "timeline" && (
            <>
              <h2 className="text-xl font-bold">Case Timeline</h2>
              <p className="mt-2 text-slate-400">
                Events will appear here as you discover facts.
              </p>

              <div className="mt-6 border-l-2 border-red-600 pl-5">
                <p className="font-semibold">
                  {murderCase.timeOfDeath}
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
