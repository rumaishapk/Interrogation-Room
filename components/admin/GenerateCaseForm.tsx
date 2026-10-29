"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Difficulty } from "@/lib/game/types";
import { brassButton, paperInput } from "@/components/ui/buttons";

export default function GenerateCaseForm() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);

  // A visible timer, because generation takes about a minute.
  useEffect(() => {
    if (!isGenerating) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer); // stop the timer when generation ends
  }, [isGenerating]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isGenerating) return; // a second click would cost a second API call

    setError(null);
    setDetails([]);
    setSeconds(0);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty, idea }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Generation failed.");
        setDetails(data.errors ?? []); // validator messages, if Gemini's case was invalid
        return;
      }
      router.push(`/admin/cases/${data.id}`);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="paper rounded-sm p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold text-ink-900">Generate a new case</h2>
      <p className="mt-1 font-type text-sm text-ink-700">
        Gemini writes a draft. It stays hidden from players until you publish it.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
        <label className="block">
          <span className="font-type text-xs uppercase tracking-widest text-ink-500">Difficulty</span>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as Difficulty)}
            disabled={isGenerating}
            className={`mt-1 ${paperInput}`}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label className="block">
          <span className="font-type text-xs uppercase tracking-widest text-ink-500">Story idea (optional)</span>
          <textarea
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            disabled={isGenerating}
            maxLength={500}
            rows={3}
            placeholder="e.g. A famous chef is poisoned during a wedding feast in Kerala"
            className={`mt-1 ${paperInput}`}
          />
          <span className="font-type text-xs text-ink-500">{idea.length}/500</span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={isGenerating} className={brassButton}>
          {isGenerating ? `Generating… ${seconds}s` : "Generate Case"}
        </button>
        {isGenerating && <p className="font-type text-sm text-ink-500">This usually takes 30–90 seconds. Please wait.</p>}
      </div>

      {error && (
        <div role="alert" className="mt-4 border-l-4 border-evidence-600 bg-evidence-600/10 px-4 py-3 font-type text-sm">
          <p className="text-evidence-800">{error}</p>
          {details.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-700">
              {details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
