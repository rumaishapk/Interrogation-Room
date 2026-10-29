"use client";

import { useActionState, useEffect, useState } from "react";
import { createCase, type CreateCaseState } from "@/app/create/actions";
import { brassButton } from "@/components/ui/buttons";

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
    <form action={formAction} onSubmit={() => setStartedAt(Date.now())} className="mt-6 space-y-4">
      <label className="block">
        <span className="font-type text-xs uppercase tracking-widest text-ink-500">Your story idea</span>
        {/* A ruled notepad page: blue lines and a red margin, all CSS */}
        <textarea
          name="idea"
          required
          minLength={10}
          maxLength={500}
          rows={6}
          defaultValue={state.idea}
          disabled={isPending}
          onChange={(event) => setLength(event.target.value.length)}
          placeholder="e.g. A famous magician vanishes during his final show on a cruise ship, and is found dead in the props room."
          className="mt-2 w-full resize-y rounded-sm border border-ink-500/40 bg-paper-50 py-[6px] pl-14 pr-4 font-type text-[15px] leading-8 text-ink-900 shadow-inner outline-none placeholder:text-ink-500/60 focus:border-evidence-600 disabled:opacity-60 bg-[linear-gradient(90deg,transparent_42px,rgb(184_56_58/0.45)_42px,rgb(184_56_58/0.45)_44px,transparent_44px),repeating-linear-gradient(transparent_0,transparent_31px,rgb(70_110_160/0.25)_31px,rgb(70_110_160/0.25)_32px)] bg-[length:100%_100%,100%_32px] [background-attachment:local]"
        />
        <span className="font-type text-xs text-ink-500">{length}/500</span>
      </label>

      {state.error && (
        <p role="alert" className="border-l-4 border-evidence-600 bg-evidence-600/10 px-3 py-2 font-type text-sm text-evidence-800">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={isPending || remaining === 0} className={brassButton}>
        {isPending ? `Typing up your case… ${seconds}s` : "Create Case"}
      </button>
      {isPending && (
        <p className="font-type text-sm text-ink-500">
          This usually takes about a minute. Please keep this page open.
        </p>
      )}
      {remaining === 0 && !isPending && (
        <p className="font-type text-sm text-evidence-600">You&apos;ve used today&apos;s case files. Come back tomorrow.</p>
      )}
    </form>
  );
}
