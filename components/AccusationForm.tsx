"use client";

import { useState } from "react";
import type { AccusationResult, Choice, PublicCase, Suspect } from "@/lib/game/types";

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

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-red-900/60 bg-slate-900 p-5"
    >
      <p className="text-xs uppercase tracking-widest text-red-400">Final accusation</p>
      <h3 className="mt-1 font-semibold">You are accusing {suspect.name}</h3>
      <p className="mt-1 text-sm text-slate-400">
        This closes the case. You cannot question anyone afterward.
      </p>

      <ChoiceGroup
        legend="Motive"
        name="motive"
        options={gameCase.motives}
        selectedId={motiveId}
        onSelect={setMotiveId}
      />

      <ChoiceGroup
        legend="Weapon"
        name="weapon"
        options={gameCase.weapons}
        selectedId={weaponId}
        onSelect={setWeaponId}
      />

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">Proof — select the evidence that supports your case</legend>
        <div className="mt-2 space-y-2">
          {gameCase.clues.map((clue) => (
            <label
              key={clue.id}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${
                evidenceIds.includes(clue.id) ? "border-red-500 bg-red-950/30" : "border-slate-800"
              }`}
            >
              <input
                type="checkbox"
                checked={evidenceIds.includes(clue.id)}
                onChange={() => toggleEvidence(clue.id)}
                className="accent-red-600"
              />
              <span>
                <span className="font-semibold">{clue.title}</span>
                <span className="mt-1 block text-slate-400">{clue.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-500 disabled:opacity-40"
        >
          {isSubmitting ? "Submitting…" : "Submit Accusation"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-slate-800 px-5 py-3 hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

type ChoiceGroupProps = {
  legend: string;
  name: string;
  options: Choice[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// A list of radio buttons. Used for both motive and weapon, which work the same way.
function ChoiceGroup({ legend, name, options, selectedId, onSelect }: ChoiceGroupProps) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="mt-2 space-y-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${
              selectedId === option.id ? "border-red-500 bg-red-950/30" : "border-slate-800"
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={selectedId === option.id}
              onChange={() => onSelect(option.id)}
              className="accent-red-600"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
