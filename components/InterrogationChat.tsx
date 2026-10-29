"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Suspect } from "@/lib/game/types";

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
    <div className="mt-6 rounded-xl border border-red-900/60 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-red-400">Interrogation</p>
          <h3 className="font-semibold">{suspect.name}</h3>
        </div>
        <button
          onClick={onEnd}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
        >
          End Interrogation
        </button>
      </div>

      <div className="h-80 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-500">
            {suspect.name} is seated across the table. Ask your first question —
            for example, &quot;Where were you tonight?&quot;
          </p>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "detective" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 text-sm leading-6 ${
                msg.role === "detective" ? "bg-red-700" : "bg-slate-800 text-slate-200"
              }`}
            >
              <p className="mb-1 text-xs opacity-60">
                {msg.role === "detective" ? "You" : suspect.name}
              </p>
              {msg.content}
              {msg.source === "fallback" && (
                <p className="mt-2 border-t border-slate-700 pt-2 text-xs italic text-amber-300/80">
                  AI unavailable: basic answer. Try again in a little while.
                </p>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <p className="text-sm italic text-slate-500">{suspect.name} is thinking…</p>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-5 pb-2 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-800 p-4">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          maxLength={500}
          placeholder={`Ask ${suspect.name} a question…`}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none focus:border-red-500"
        />
        <button
          type="submit"
          disabled={isSending || input.trim() === ""}
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-500 disabled:opacity-40"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
