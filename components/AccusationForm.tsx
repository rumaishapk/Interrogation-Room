"use client";

import { useState } from "react";
import type { AccusationResult, Choice, PublicCase, Suspect } from "@/lib/game/types";
import Stamp from "@/components/ui/Stamp";
import { brassButton, inkButton } from "@/components/ui/buttons";

type Props = {
  gameCase: PublicCase;
  suspect: Suspect;
  onResult: (result: AccusationResult) => void;
  onCancel: () => void;
};

export default function AccusationForm({ gameCase, suspect, onResult, onCancel }: Props) {
  const [motiveId, setMotiveId] = useState<string | null>(null);
  const [weaponId, setWeaponId] = useState<string | null>(null);
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    motiveId !== null && weaponId !== null && evidenceIds.length > 0 && !isSubmitting;

  function toggleEvidence(clueId: string) {
    setEvidenceIds((prev) =>
      prev.includes(clueId) ? prev.filter((id) => id !== clueId) : [...prev, clueId]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/accusation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: gameCase.id,
          suspectId: suspect.id,
          motiveId,
          weaponId,
          evidenceIds,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The accusation could not be submitted.");

      onResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  // One numbered section of the report: a typed heading, then its choices.
  const section = (n: number, title: string) => (
    <legend className="flex items-baseline gap-2 font-type text-sm uppercase tracking-widest text-ink-900">
      <span className="text-evidence-600">{n}.</span> {title}
    </legend>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-ink-900/70 pb-3">
        <div>
          <p className="font-type text-xs uppercase tracking-[0.3em] text-evidence-600">Final accusation</p>
          <h3 className="mt-1 font-display text-2xl font-bold text-ink-900">Case Report: {suspect.name}</h3>
        </div>
        <Stamp tone="red" rotate={4}>Charge</Stamp>
      </div>
      <p className="font-type text-sm text-ink-700">
        Filing this report closes the case. You cannot question anyone afterwards.
      </p>

      <ChoiceGroup
        legend={section(1, "Motive")}
        name="motive"
        options={gameCase.motives}
        selectedId={motiveId}
        onSelect={setMotiveId}
      />

      <ChoiceGroup
        legend={section(2, "Weapon")}
        name="weapon"
        options={gameCase.weapons}
        selectedId={weaponId}
        onSelect={setWeaponId}
      />

      <fieldset>
        {section(3, "Evidence: tick everything that proves your case")}
        <div className="mt-2 divide-y divide-dashed divide-ink-500/40 border-y border-dashed border-ink-500/40">
          {gameCase.clues.map((clue, i) => (
            <label
              key={clue.id}
              className={`flex cursor-pointer gap-3 px-2 py-3 transition ${
                evidenceIds.includes(clue.id) ? "bg-evidence-600/10" : "hover:bg-ink-900/5"
              }`}
            >
              <input
                type="checkbox"
                checked={evidenceIds.includes(clue.id)}
                onChange={() => toggleEvidence(clue.id)}
                className="mt-1 h-4 w-4 shrink-0 accent-evidence-600"
              />
              <span>
                <span className="font-display font-bold text-ink-900">
                  Exhibit {String.fromCharCode(65 + i)}: {clue.title}
                </span>
                <span className="mt-1 block font-type text-xs leading-5 text-ink-700">{clue.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="border-l-4 border-evidence-600 bg-evidence-600/10 px-3 py-2 font-type text-sm text-evidence-800">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={!canSubmit} className={brassButton}>
          {isSubmitting ? "Filing…" : "Submit Accusation"}
        </button>
        <button type="button" onClick={onCancel} className={inkButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}

type ChoiceGroupProps = {
  legend: React.ReactNode;
  name: string;
  options: Choice[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// A list of radio buttons. Used for both motive and weapon, which work the same way.
function ChoiceGroup({ legend, name, options, selectedId, onSelect }: ChoiceGroupProps) {
  return (
    <fieldset>
      {legend}
      <div className="mt-2 divide-y divide-dashed divide-ink-500/40 border-y border-dashed border-ink-500/40">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-center gap-3 px-2 py-2.5 font-body text-ink-900 transition ${
              selectedId === option.id ? "bg-evidence-600/10 font-semibold" : "hover:bg-ink-900/5"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={selectedId === option.id}
              onChange={() => onSelect(option.id)}
              className="h-4 w-4 shrink-0 accent-evidence-600"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
