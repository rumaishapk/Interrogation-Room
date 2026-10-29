import type { AccusationResult } from "@/lib/game/types";
import PaperCard from "@/components/ui/PaperCard";
import Stamp from "@/components/ui/Stamp";
import { brassButton } from "@/components/ui/buttons";

const verdicts: Record<AccusationResult["outcome"], { stamp: string; tone: "green" | "ink" | "red"; line: string }> = {
  solved: { stamp: "Case Solved", tone: "green", line: "Every piece fits. The killer is behind bars." },
  partial: { stamp: "Incomplete", tone: "ink", line: "You named the right suspect, but your case has holes." },
  "wrong-suspect": { stamp: "Wrong Suspect", tone: "red", line: "The killer walks free tonight." },
};

type Props = {
  result: AccusationResult;
  onRestart: () => void;
};

export default function VerdictPanel({ result, onRestart }: Props) {
  const verdict = verdicts[result.outcome];
  const checks = [
    { label: "Culprit", passed: result.culpritCorrect },
    { label: "Motive", passed: result.motiveCorrect },
    { label: "Weapon", passed: result.weaponCorrect },
    { label: "Supporting evidence", passed: result.evidenceSupported },
  ];

  return (
    <div className="space-y-10">
      <PaperCard fastener="tape" className="p-6 text-center sm:p-10">
        <p className="font-type text-xs uppercase tracking-[0.4em] text-ink-500">Verdict of the investigation</p>
        <div className="my-8">
          <Stamp tone={verdict.tone} size="lg" rotate={-6} animate>
            {verdict.stamp}
          </Stamp>
        </div>
        <p className="font-display text-xl italic text-ink-900">{verdict.line}</p>

        <ul className="mx-auto mt-8 max-w-md divide-y divide-dashed divide-ink-500/40 border-y border-dashed border-ink-500/40 text-left">
          {checks.map((check) => (
            <li key={check.label} className="flex items-center justify-between px-2 py-2.5 font-type text-sm text-ink-900">
              <span className="uppercase tracking-widest">{check.label}</span>
              <span className={check.passed ? "text-moss-600" : "text-evidence-600"}>
                {check.passed ? "✓ Correct" : "✗ Incorrect"}
              </span>
            </li>
          ))}
        </ul>
      </PaperCard>

      <PaperCard tilt={0.4} className="p-6 sm:p-8">
        <p className="font-type text-xs uppercase tracking-[0.3em] text-evidence-600">What really happened</p>
        <p className="mt-2 font-display text-2xl font-bold text-ink-900">The murderer was {result.murdererName}.</p>
        <p className="mt-4 font-type text-sm leading-7 text-ink-900">{result.explanation}</p>
      </PaperCard>

      <section>
        <h3 className="font-type text-xs uppercase tracking-[0.35em] text-brass-300">The true timeline</h3>
        <ol className="relative ml-3 mt-5 space-y-5 border-l-4 border-dotted border-brass-500/40 pl-8">
          {result.timeline.map((item, i) => (
            <li key={`${item.time}-${i}`} className="relative">
              <span aria-hidden="true" className="absolute -left-[42px] top-4 h-5 w-5 rounded-full border-4 border-walnut-950 bg-evidence-600" />
              <PaperCard className="max-w-xl p-4" tilt={i % 2 ? 0.5 : -0.5}>
                <p className="font-type text-sm uppercase tracking-widest text-evidence-600">{item.time}</p>
                <p className="mt-1 font-body text-ink-900">{item.event}</p>
              </PaperCard>
            </li>
          ))}
        </ol>
      </section>

      <div className="text-center">
        <button onClick={onRestart} className={brassButton}>
          Start Over
        </button>
      </div>
    </div>
  );
}
