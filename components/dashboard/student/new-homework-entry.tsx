import Link from "next/link";
import { NewHomeworkIntakeForm } from "@/components/dashboard/student/new-homework-intake-form";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  getStartStateBody,
  getStartStateLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { getNewHomeworkEntryCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { StudentDashboardSnapshot } from "@/lib/server/student-dashboard/types";

type NewHomeworkEntryProps = {
  snapshot: StudentDashboardSnapshot;
  languageCode: UiLanguageCode;
};

export function NewHomeworkEntry({
  snapshot,
  languageCode,
}: NewHomeworkEntryProps) {
  const copy = getNewHomeworkEntryCopy(languageCode);

  return (
    <section className="grid gap-6">
      <article className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StudentStatusPill
              label={getStartStateLabel(snapshot.startState, languageCode)}
              tone={snapshot.canStartHomework ? "accent" : "warning"}
            />
            <StudentStatusPill
              label={copy.recentSubjects(snapshot.subjectRollup.length)}
            />
          </div>

          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              {copy.eyebrow}
            </p>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
              {copy.title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
              {getStartStateBody(snapshot.startState, languageCode)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-5 py-3 text-sm font-medium transition hover:-translate-y-0.5"
              href="/app"
            >
              {copy.backToDashboard}
            </Link>
            <span className="inline-flex items-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm text-[color:var(--ink-soft)]">
              {copy.liveFormBadge}
            </span>
          </div>
        </div>

        <div className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
          <div>
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              {copy.sequenceEyebrow}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl leading-tight">
              {copy.sequenceTitle}
            </h2>
          </div>

          <ol className="grid gap-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.steps.map((step) => (
              <li
                className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3"
                key={step}
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      </article>

      <NewHomeworkIntakeForm languageCode={languageCode} snapshot={snapshot} />
    </section>
  );
}
