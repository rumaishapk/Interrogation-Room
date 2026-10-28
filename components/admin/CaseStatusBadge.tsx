import type { CaseStatus } from "@/lib/game/types";

const styles: Record<CaseStatus, string> = {
  draft: "border-amber-700 bg-amber-950/40 text-amber-300",
  published: "border-emerald-700 bg-emerald-950/40 text-emerald-300",
  rejected: "border-slate-700 bg-slate-800 text-slate-400",
};

export default function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}
