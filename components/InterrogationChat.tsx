"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Suspect } from "@/lib/game/types";
import SuspectPortrait from "@/components/ui/SuspectPortrait";
import { brassButton, ghostButton, paperInput } from "@/components/ui/buttons";

export type { ChatMessage };

type Props = {
  caseId: string;
  suspect: Suspect;
  // The parent owns the history, so it survives when this panel closes.
  messages: ChatMessage[];
  onNewMessage: (message: ChatMessage) => void;
  onEnd: () => void;
};

export default function InterrogationChat({
  caseId,
  suspect,
  messages,
  onNewMessage,
  onEnd,
}: Props) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || isSending) return;

    onNewMessage({ role: "detective", content: question });
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/interrogate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, suspectId: suspect.id, message: question }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The suspect didn't respond.");

      onNewMessage({ role: "suspect", content: data.reply, source: data.source });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-sm border border-ink-700/40 bg-walnut-900 shadow-inner">
      {/* The interrogation room: the suspect under a hanging lamp */}
      <div className="relative flex items-center gap-4 bg-[radial-gradient(ellipse_at_30%_0%,rgb(242_196_109/0.35),transparent_70%)] px-5 py-4">
        <div className="w-16 shrink-0 border-4 border-paper-50 shadow-md sm:w-20">
          <SuspectPortrait suspect={suspect} className="aspect-square w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-type text-xs uppercase tracking-[0.3em] text-brass-300">Interrogation in progress</p>
          <h3 className="truncate font-display text-xl font-bold text-paper-100">{suspect.name}</h3>
        </div>
        <button onClick={onEnd} className={ghostButton}>
          End
        </button>
      </div>

      {/* The typed transcript */}
      <div className="paper mx-3 mb-3 h-96 space-y-4 overflow-y-auto rounded-sm px-5 py-5" aria-live="polite">
        <p className="font-type text-xs uppercase tracking-widest text-ink-500">
          Transcript · {suspect.name} · {suspect.occupation}
        </p>
        {messages.length === 0 && (
          <p className="font-type text-sm text-ink-700">
            {suspect.name} is seated across the table. Ask your first question, for example
            &quot;Where were you tonight?&quot;
          </p>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={msg.role === "detective" ? "pl-8 sm:pl-16" : "pr-8 sm:pr-16"}>
            <p className={`font-type text-xs uppercase tracking-widest ${msg.role === "detective" ? "text-evidence-600" : "text-ink-500"}`}>
              {msg.role === "detective" ? "Detective" : suspect.name}:
            </p>
            <p className={`mt-0.5 leading-7 text-ink-900 ${msg.role === "detective" ? "font-type text-sm" : "font-body"}`}>
              {msg.content}
            </p>
            {msg.source === "fallback" && (
              <p className="mt-1 inline-block -rotate-1 border border-dashed border-ink-500/60 px-2 py-0.5 font-type text-[11px] text-ink-500">
                AI unavailable: basic answer. Try again in a little while.
              </p>
            )}
          </div>
        ))}

        {isSending && <p className="font-type text-sm italic text-ink-500">{suspect.name} is thinking…</p>}
        <div ref={bottomRef} />
      </div>

      {error && <p role="alert" className="px-5 pb-2 font-type text-sm text-tape-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-3 pb-3 sm:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={500}
          aria-label={`Your question for ${suspect.name}`}
          placeholder={`Ask ${suspect.name} a question…`}
          className={`flex-1 ${paperInput} !bg-paper-50`}
        />
        <button type="submit" disabled={isSending || input.trim() === ""} className={brassButton}>
          Ask
        </button>
      </form>
    </div>
  );
}
