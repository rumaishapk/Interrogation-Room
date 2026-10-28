import type { AccusationResult } from "@/lib/game/types";

const headlines: Record<AccusationResult["outcome"], string> = {
  solved: "Case solved",
  partial: "Right suspect, incomplete case",
  "wrong-suspect": "Wrong suspect",
};

type Props = {
  result: AccusationResult;
  onRestart: () => void;
};

export default function VerdictPanel({ result, onRestart }: Props) {
  const checks = [
    { label: "Culprit", passed: result.culpritCorrect },
    { label: "Motive", passed: result.motiveCorrect },
    { label: "Weapon", passed: result.weaponCorrect },
    { label: "Supporting evidence", passed: result.evidenceSupported },
  ];

  return (
    <>
      <p className="text-xs uppercase tracking-widest text-red-400">Case closed</p>
      <h2 className="mt-2 text-2xl font-bold">{headlines[result.outcome]}</h2>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {checks.map((check) => (
          <li
            key={check.label}
            className={`rounded-xl border p-4 text-sm ${
              check.passed ? "border-emerald-700 bg-emerald-950/40" : "border-red-800 bg-red-950/40"
            }`}
          >
            <p className="text-slate-400">{check.label}</p>
            <p className="mt-1 font-semibold">{check.passed ? "✓ Correct" : "✗ Incorrect"}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl bg-slate-900 p-5">
        <p className="text-sm text-red-400">WHAT REALLY HAPPENED</p>
        <p className="mt-2 font-semibold">The murderer was {result.murdererName}.</p>
        <p className="mt-2 leading-7 text-slate-300">{result.explanation}</p>
      </div>

      <div className="mt-6 border-l-2 border-red-600 pl-5">
        {result.timeline.map((item) => (
          <div key={item.time} className="mb-4">
            <p className="font-semibold">{item.time}</p>
            <p className="text-sm text-slate-400">{item.event}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="mt-4 rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-500"
      >
        Start Over
      </button>
    </>
  );
}
