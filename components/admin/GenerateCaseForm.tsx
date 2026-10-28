"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Difficulty } from "@/lib/game/types";

export default function GenerateCaseForm() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
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
        body: JSON.stringify({ difficulty }),
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
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="font-semibold">Generate a new case</h2>
      <p className="mt-1 text-sm text-slate-400">
        Gemini writes a draft. It stays hidden from players until you publish it.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value as Difficulty)}
          disabled={isGenerating}
          className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button
          type="submit"
          disabled={isGenerating}
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500 disabled:opacity-40"
        >
          {isGenerating ? `Generating… ${seconds}s` : "Generate Case"}
        </button>
      </div>

      {isGenerating && (
        <p className="mt-3 text-sm text-slate-500">This usually takes 30–90 seconds. Please wait.</p>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm">
          <p className="text-red-300">{error}</p>
          {details.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-400">
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
