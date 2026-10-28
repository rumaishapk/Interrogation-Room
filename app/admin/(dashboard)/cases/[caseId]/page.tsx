import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCaseAnyStatus } from "@/lib/game/case-store";
import { validateCase } from "@/lib/game/validate-case";
import { requireAdminPage } from "@/lib/auth/admin-session";
import DifficultyBadge from "@/components/DifficultyBadge";
import CaseStatusBadge from "@/components/admin/CaseStatusBadge";
import CaseStatusButtons from "@/components/admin/CaseStatusButtons";

export default function AdminCasePage({ params }: PageProps<"/admin/cases/[caseId]">) {
  return (
    <Suspense fallback={<p className="mt-6 text-slate-500">Opening the case file…</p>}>
      <CasePreview params={params} />
    </Suspense>
  );
}

// Shows EVERYTHING, including the solution, so a person can judge the case.
async function CasePreview({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  await connection();
  await requireAdminPage(); // check right before reading the solution

  const found = await getCaseAnyStatus(caseId);
  if (!found) notFound();
  const { caseDef: c, status } = found;
  const { truth } = c;
  const validation = validateCase(c);
  const nameOf = (suspectId: string) => c.suspects.find((s) => s.id === suspectId)?.name ?? suspectId;

  return (
    <>
      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{c.title}</h1>
          <DifficultyBadge difficulty={c.difficulty} />
          <CaseStatusBadge status={status} />
        </div>
        <p className="mt-2 text-sm text-slate-400">
          {c.id} · Victim: {c.victim} · {c.location} · Time of death: {c.timeOfDeath}
        </p>
        <div className="mt-5">
          <CaseStatusButtons caseId={c.id} currentStatus={status} />
        </div>
        {status === "published" && (
          <Link href={`/game/${c.id}`} className="mt-4 inline-block text-sm text-red-400">
            Play this case →
          </Link>
        )}
        <p className={`mt-4 text-sm ${validation.ok ? "text-emerald-400" : "text-red-400"}`}>
          {validation.ok ? "✓ Passes validation" : `✗ ${validation.errors.length} validation errors`}
        </p>
      </header>

      <Section title="Briefing (what the player reads first)">
        <p className="leading-7 text-slate-300">{c.briefing}</p>
      </Section>

      <Section title="Solution">
        <dl className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
          <dt className="text-slate-400">Murderer</dt>
          <dd className="font-semibold">{nameOf(truth.murdererId)}</dd>
          <dt className="text-slate-400">Motive</dt>
          <dd>{c.motives.find((m) => m.id === truth.motiveId)?.label}</dd>
          <dt className="text-slate-400">Weapon</dt>
          <dd>{c.weapons.find((w) => w.id === truth.weaponId)?.label}</dd>
          <dt className="text-slate-400">Cause of death</dt>
          <dd>{truth.causeOfDeath}</dd>
        </dl>
        <p className="mt-4 leading-7 text-slate-300">{truth.explanation}</p>
        <ol className="mt-4 border-l-2 border-red-600 pl-5 text-sm">
          {truth.timeline.map((e) => (
            <li key={`${e.time}-${e.event}`} className="mb-2">
              <span className="font-semibold">{e.time}</span>{" "}
              <span className="text-slate-400">{e.event}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Clues (★ = key evidence the player must cite)">
        <ul className="space-y-3">
          {c.clues.map((clue) => (
            <li key={clue.id} className="rounded-lg border border-slate-800 p-4 text-sm">
              <p className="font-semibold">
                {truth.keyEvidenceIds.includes(clue.id) && <span className="text-amber-400">★ </span>}
                {clue.title}
              </p>
              <p className="mt-1 text-slate-400">{clue.description}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Accusation choices (✓ = correct)">
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            { heading: "Motives", options: c.motives, correct: truth.motiveId },
            { heading: "Weapons", options: c.weapons, correct: truth.weaponId },
          ].map((group) => (
            <div key={group.heading}>
              <h3 className="text-sm font-semibold text-slate-400">{group.heading}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {group.options.map((o) => (
                  <li key={o.id} className={o.id === group.correct ? "text-emerald-400" : "text-slate-300"}>
                    {o.id === group.correct ? "✓ " : "· "}
                    {o.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Suspects and what they know">
        <div className="space-y-4">
          {c.suspects.map((s) => {
            const k = c.knowledge.find((entry) => entry.suspectId === s.id);
            return (
              <article key={s.id} className="rounded-lg border border-slate-800 p-4 text-sm">
                <h3 className="font-semibold">
                  {s.name} <span className="font-normal text-slate-400">· {s.occupation}</span>
                  {s.id === truth.murdererId && <span className="ml-2 text-red-400">MURDERER</span>}
                </h3>
                <p className="mt-1 text-slate-400">{s.description}</p>
                {k && (
                  <div className="mt-3 space-y-2">
                    <p><span className="text-slate-400">Personality:</span> {k.personality}</p>
                    <p><span className="text-slate-400">Alibi:</span> “{k.initialAlibi}”</p>
                    <p className="text-slate-400">Knows:</p>
                    <ul className="list-disc pl-5">{k.knows.map((f) => <li key={f}>{f}</li>)}</ul>
                    <p className="text-slate-400">Secrets:</p>
                    <ul className="list-disc pl-5">{k.secrets.map((f) => <li key={f}>{f}</li>)}</ul>
                    <p className="text-slate-400">Replies (keywords → answer):</p>
                    <ul className="space-y-1 pl-2">
                      {k.topics.map((t) => (
                        <li key={t.keywords.join()}>
                          <span className="text-amber-300">[{t.keywords.join(", ")}]</span> {t.reply}
                        </li>
                      ))}
                      <li>
                        <span className="text-amber-300">[anything else]</span> {k.fallbackReply}
                      </li>
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </Section>

      {!validation.ok && (
        <Section title="Validation errors">
          <ul className="list-disc pl-5 text-sm text-red-300">
            {validation.errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </Section>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}
