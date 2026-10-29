"use client";

import { useActionState, useEffect, useState } from "react";
import { createCase, type CreateCaseState } from "@/app/create/actions";

export default function CreateCaseForm({ remaining }: { remaining: number }) {
  const [state, formAction, isPending] = useActionState<CreateCaseState, FormData>(createCase, {});
  const [length, setLength] = useState(state.idea?.length ?? 0);
  // A visible timer, because generation takes about a minute.
  // The start time is saved on submit; the effect only "ticks" the clock.
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const seconds = isPending ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;

  useEffect(() => {
    if (!isPending) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer); // stop ticking when generation ends
  }, [isPending]);

  return (
    <form action={formAction} onSubmit={() => setStartedAt(Date.now())} className="mt-8 space-y-4">
      <label className="block">
        <span className="text-sm text-slate-400">Your story idea</span>
        <textarea
          name="idea"
          required
          minLength={10}
          maxLength={500}
          rows={5}
          defaultValue={state.idea}
          disabled={isPending}
          onChange={(event) => setLength(event.target.value.length)}
          placeholder="e.g. A famous magician vanishes during his final show on a cruise ship, and is found dead in the props room."
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 leading-7 outline-none focus:border-red-500"
        />
        <span className="text-xs text-slate-500">{length}/500</span>
      </label>

      {state.error && (
        <p className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || remaining === 0}
        className="rounded-lg bg-red-600 px-6 py-3 font-semibold hover:bg-red-500 disabled:opacity-40"
      >
        {isPending ? `Writing your mystery… ${seconds}s` : "Create Case"}
      </button>
      {isPending && (
        <p className="text-sm text-slate-500">
          This usually takes about a minute. Please keep this page open.
        </p>
      )}
    </form>
  );
}
