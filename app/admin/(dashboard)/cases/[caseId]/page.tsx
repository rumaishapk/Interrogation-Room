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
import PaperCard from "@/components/ui/PaperCard";
import SuspectPortrait from "@/components/ui/SuspectPortrait";

export default function AdminCasePage({ params }: PageProps<"/admin/cases/[caseId]">) {
  return (
    <Suspense fallback={<p className="mt-8 font-type text-paper-300">Opening the case file…</p>}>
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
  const label = "font-type text-xs uppercase tracking-widest text-ink-500";

  return (
    <>
      <PaperCard className="mt-8 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 flex-1 font-display text-3xl font-black text-ink-900">{c.title}</h1>
          <DifficultyBadge difficulty={c.difficulty} onPaper />
          <CaseStatusBadge status={status} />
        </div>
        <p className="mt-2 font-type text-xs text-ink-500">
          {c.id} · Victim: {c.victim} · {c.location} · Time of death: {c.timeOfDeath}
        </p>
        <p className={`mt-4 font-type text-sm ${validation.ok ? "text-moss-600" : "text-evidence-600"}`}>
          {validation.ok ? "✓ Passes validation" : `✗ ${validation.errors.length} validation errors`}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-dashed border-ink-500/40 pt-5">
          <CaseStatusButtons caseId={c.id} currentStatus={status} />
          {status === "published" && (
            <Link href={`/game/${c.id}`} className="font-type text-sm uppercase tracking-wider text-evidence-600 hover:underline">
              Play this case →
            </Link>
          )}
        </div>
      </PaperCard>

      <Section title="Briefing (what the player reads first)">
        <p className="font-body leading-7 text-ink-900">{c.briefing}</p>
      </Section>

      <Section title="Solution">
        <dl className="grid gap-2 sm:grid-cols-[150px_1fr]">
          <dt className={label}>Murderer</dt>
          <dd className="font-display font-bold text-ink-900">{nameOf(truth.murdererId)}</dd>
          <dt className={label}>Motive</dt>
          <dd className="font-body text-ink-900">{c.motives.find((m) => m.id === truth.motiveId)?.label}</dd>
          <dt className={label}>Weapon</dt>
          <dd className="font-body text-ink-900">{c.weapons.find((w) => w.id === truth.weaponId)?.label}</dd>
          <dt className={label}>Cause of death</dt>
          <dd className="font-body text-ink-900">{truth.causeOfDeath}</dd>
        </dl>
        <p className="mt-4 font-type text-sm leading-7 text-ink-900">{truth.explanation}</p>
        <ol className="mt-4 border-l-4 border-dotted border-ink-700/50 pl-5 text-sm">
          {truth.timeline.map((e) => (
            <li key={`${e.time}-${e.event}`} className="mb-2">
              <span className="font-type text-evidence-600">{e.time}</span>{" "}
              <span className="font-body text-ink-900">{e.event}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Clues (★ = key evidence the player must cite)">
        <ul className="divide-y divide-dashed divide-ink-500/40">
          {c.clues.map((clue) => (
            <li key={clue.id} className="py-3">
              <p className="font-display font-bold text-ink-900">
                {truth.keyEvidenceIds.includes(clue.id) && <span className="text-evidence-600">★ </span>}
                {clue.title}
              </p>
              <p className="mt-1 font-type text-sm text-ink-700">{clue.description}</p>
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
              <h3 className={label}>{group.heading}</h3>
              <ul className="mt-2 space-y-1 font-body text-sm">
                {group.options.map((o) => (
                  <li key={o.id} className={o.id === group.correct ? "font-semibold text-moss-600" : "text-ink-900"}>
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
        <div className="space-y-6">
          {c.suspects.map((s) => {
            const k = c.knowledge.find((entry) => entry.suspectId === s.id);
            return (
              <article key={s.id} className="grid gap-4 border-b border-dashed border-ink-500/40 pb-6 last:border-0 sm:grid-cols-[110px_1fr]">
                <div className="w-24 self-start border-4 border-paper-50 shadow sm:w-full">
                  <SuspectPortrait suspect={s} className="aspect-square w-full" />
                </div>
                <div className="space-y-2 text-sm">
                  <h3 className="font-display text-lg font-bold text-ink-900">
                    {s.name} <span className="font-body text-sm font-normal text-ink-500">· {s.occupation}</span>
                    {s.id === truth.murdererId && <span className="ml-2 font-type text-xs text-evidence-600">MURDERER</span>}
                  </h3>
                  <p className="font-body text-ink-700">{s.description}</p>
                  {s.appearance ? (
                    <p className="font-body italic text-ink-700">{s.appearance}</p>
                  ) : (
                    <p className="font-type text-xs text-ink-500">(No appearance: an older case, the portrait is a stand-in.)</p>
                  )}
                  {k && (
                    <div className="space-y-2 pt-1 font-type text-ink-900">
                      <p><span className="text-ink-500">Personality:</span> {k.personality}</p>
                      <p><span className="text-ink-500">Alibi:</span> “{k.initialAlibi}”</p>
                      <p className="text-ink-500">Knows:</p>
                      <ul className="list-disc pl-5">{k.knows.map((f) => <li key={f}>{f}</li>)}</ul>
                      <p className="text-ink-500">Secrets:</p>
                      <ul className="list-disc pl-5">{k.secrets.map((f) => <li key={f}>{f}</li>)}</ul>
                      <p className="text-ink-500">Replies (keywords → answer):</p>
                      <ul className="space-y-1 pl-2">
                        {k.topics.map((t) => (
                          <li key={t.keywords.join()}>
                            <span className="text-evidence-600">[{t.keywords.join(", ")}]</span> {t.reply}
                          </li>
                        ))}
                        <li>
                          <span className="text-evidence-600">[anything else]</span> {k.fallbackReply}
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      {!validation.ok && (
        <Section title="Validation errors">
          <ul className="list-disc pl-5 font-type text-sm text-evidence-800">
            {validation.errors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </Section>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <PaperCard as="section" className="mt-8 p-5 sm:p-6">
      <h2 className="mb-4 border-b-2 border-ink-900/70 pb-2 font-display text-lg font-black uppercase tracking-[0.15em] text-ink-900">
        {title}
      </h2>
      {children}
    </PaperCard>
  );
}
