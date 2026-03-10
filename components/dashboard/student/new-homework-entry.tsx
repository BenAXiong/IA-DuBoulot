import Link from "next/link";
import { NewHomeworkIntakeForm } from "@/components/dashboard/student/new-homework-intake-form";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  getStartStateBody,
  getStartStateLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import type { StudentDashboardSnapshot } from "@/lib/server/student-dashboard/types";

type NewHomeworkEntryProps = {
  snapshot: StudentDashboardSnapshot;
};

export function NewHomeworkEntry({ snapshot }: NewHomeworkEntryProps) {
  return (
    <section className="grid gap-6">
      <article className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StudentStatusPill
              label={getStartStateLabel(snapshot.startState)}
              tone={snapshot.canStartHomework ? "accent" : "warning"}
            />
            <StudentStatusPill
              label={`${snapshot.subjectRollup.length} matiere${snapshot.subjectRollup.length > 1 ? "s" : ""} recente${snapshot.subjectRollup.length > 1 ? "s" : ""}`}
            />
          </div>

          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              Nouveau devoir
            </p>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
              Route d&apos;entree canonique du workflow eleve
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
              {getStartStateBody(snapshot.startState)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-medium transition hover:-translate-y-0.5"
              href="/app"
            >
              Retour au dashboard
            </Link>
            <span className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm text-[color:var(--ink-soft)]">
              Cette route porte maintenant le vrai formulaire d&apos;intake
            </span>
          </div>
        </div>

        <div className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              Sequence cible
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl leading-tight">
              Le tableau de bord envoie maintenant vers un vrai point de depart.
            </h2>
          </div>

          <ol className="grid gap-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            <li className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
              1. Renseigner le titre du devoir et la matiere.
            </li>
            <li className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
              2. Ajouter un PDF, une capture, ou du texte colle.
            </li>
            <li className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
              3. Verifier l&apos;extraction, puis entrer dans la conversation guidee.
            </li>
          </ol>
        </div>
      </article>

      <NewHomeworkIntakeForm snapshot={snapshot} />
    </section>
  );
}
