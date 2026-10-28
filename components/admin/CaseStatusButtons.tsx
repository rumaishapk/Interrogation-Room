"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseStatus } from "@/lib/game/types";

const actions: { status: CaseStatus; label: string; className: string }[] = [
  { status: "published", label: "Publish", className: "bg-emerald-700 hover:bg-emerald-600" },
  { status: "rejected", label: "Reject", className: "bg-red-800 hover:bg-red-700" },
  { status: "draft", label: "Move back to draft", className: "bg-slate-700 hover:bg-slate-600" },
];

type Props = {
  caseId: string;
  currentStatus: CaseStatus;
};

export default function CaseStatusButtons({ caseId, currentStatus }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<CaseStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);

  async function changeStatus(status: CaseStatus) {
    setPending(status);
    setError(null);
    setDetails([]);
    try {
      const response = await fetch(`/api/admin/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not change the status.");
        setDetails(data.errors ?? []);
        return;
      }
      // Re-run the Server Components on this page, so the new status shows.
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {actions
          .filter((action) => action.status !== currentStatus)
          .map((action) => (
            <button
              key={action.status}
              onClick={() => changeStatus(action.status)}
              disabled={pending !== null}
              className={`rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-40 ${action.className}`}
            >
              {pending === action.status ? "Saving…" : action.label}
            </button>
          ))}
      </div>
      {error && (
        <div className="mt-3 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm">
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
    </div>
  );
}
