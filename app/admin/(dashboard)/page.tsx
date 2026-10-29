import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { listAllCases } from "@/lib/game/case-store";
import { requireAdminPage } from "@/lib/auth/admin-session";
import DifficultyBadge from "@/components/DifficultyBadge";
import CaseStatusBadge from "@/components/admin/CaseStatusBadge";
import GenerateCaseForm from "@/components/admin/GenerateCaseForm";

export default function AdminPage() {
  return (
    <>
      <h1 className="mt-6 text-3xl font-bold">Case Admin</h1>
      <div className="mt-6">
        <GenerateCaseForm />
      </div>

      <h2 className="mt-10 text-xl font-bold">All cases</h2>
      <Suspense fallback={<p className="mt-4 text-slate-500">Loading cases…</p>}>
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
    return <p className="mt-4 text-slate-400">No cases yet. Generate one above.</p>;
  }

  return (
    <ul className="mt-4 space-y-3">
      {cases.map((c) => (
        <li key={c.id}>
          <Link
            href={`/admin/cases/${c.id}`}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-red-500"
          >
            <span className="font-semibold">{c.title}</span>
            <DifficultyBadge difficulty={c.difficulty} />
            <CaseStatusBadge status={c.status} />
            <span className="ml-auto text-xs text-slate-500">
              {c.suspectCount} suspects · {c.createdBy ? `by ${c.createdBy}` : "admin"} ·{" "}
              {c.createdAt.toLocaleString()}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
