import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { listAllCases } from "@/lib/game/case-store";
import { requireAdminPage } from "@/lib/auth/admin-session";
import DifficultyBadge from "@/components/DifficultyBadge";
import CaseStatusBadge from "@/components/admin/CaseStatusBadge";
import GenerateCaseForm from "@/components/admin/GenerateCaseForm";
import PaperCard from "@/components/ui/PaperCard";

export default function AdminPage() {
  return (
    <>
      <header className="mt-8">
        <p className="font-type text-xs uppercase tracking-[0.4em] text-brass-300">Admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold text-paper-100">Records Office</h1>
      </header>
      <div className="mt-6">
        <GenerateCaseForm />
      </div>

      <h2 className="mt-12 font-type text-sm uppercase tracking-[0.3em] text-brass-300">All case files</h2>
      <Suspense fallback={<p className="mt-4 font-type text-paper-300">Loading the register…</p>}>
        <AllCases />
      </Suspense>
    </>
  );
}

async function AllCases() {
  await connection();
  await requireAdminPage(); // check right before reading admin data
  const cases = await listAllCases();

  if (cases.length === 0) {
    return <p className="mt-4 font-type text-paper-300">No cases yet. Generate one above.</p>;
  }

  return (
    <PaperCard className="mt-4 overflow-hidden">
      <ul className="divide-y divide-dashed divide-ink-500/40">
        {cases.map((c) => (
          <li key={c.id}>
            <Link
              href={`/admin/cases/${c.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition hover:bg-ink-900/5"
            >
              <span className="min-w-0 flex-1 font-display text-lg font-bold text-ink-900">{c.title}</span>
              <DifficultyBadge difficulty={c.difficulty} onPaper />
              <CaseStatusBadge status={c.status} />
              <span className="w-full font-type text-xs text-ink-500 sm:w-auto">
                {c.suspectCount} suspects · {c.createdBy ? `by ${c.createdBy}` : "admin"} · {c.createdAt.toLocaleString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </PaperCard>
  );
}
