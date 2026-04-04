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
  initialSubjectTag?: string | null;
  initialDraft?: string | null;
};

export function NewHomeworkEntry({
  snapshot,
  languageCode,
  initialSubjectTag = null,
  initialDraft = null,
}: NewHomeworkEntryProps) {
  const copy = getNewHomeworkEntryCopy(languageCode);

  return (
    <section className="grid gap-6">
      <article className="grid gap-5 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="flex flex-wrap gap-2">
          <StudentStatusPill
            label={getStartStateLabel(snapshot.startState, languageCode)}
            tone={snapshot.canStartHomework ? "accent" : "warning"}
          />
          <StudentStatusPill
            label={copy.recentSubjects(snapshot.subjectRollup.length)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              {copy.eyebrow}
            </p>
            <h1 className="max-w-4xl font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
              {copy.title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-[color:var(--ink-soft)]">
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
      </article>

      <NewHomeworkIntakeForm
        initialDraft={initialDraft}
        initialSubjectTag={initialSubjectTag}
        languageCode={languageCode}
        snapshot={snapshot}
      />
    </section>
  );
}
