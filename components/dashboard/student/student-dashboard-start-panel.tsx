import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  getStartStateBody,
  getStartStateLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { getIntlLocale } from "@/lib/i18n/config";
import { getStudentDashboardStartPanelCopy } from "@/lib/i18n/dashboard-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  StudentDashboardSnapshot,
  StudentDashboardSubjectRollup,
} from "@/lib/server/student-dashboard/types";

type StudentDashboardStartPanelProps = {
  snapshot: StudentDashboardSnapshot;
};

function getButtonLabel(
  snapshot: StudentDashboardSnapshot,
  languageCode: UiLanguageCode,
) {
  const copy = getStudentDashboardStartPanelCopy(languageCode);

  if (snapshot.canStartHomework) {
    return copy.buttons.ready;
  }

  if (snapshot.startState === "pending_parent_approval") {
    return copy.buttons.waitParent;
  }

  if (snapshot.startState === "quota_blocked") {
    return copy.buttons.viewQuota;
  }

  return copy.buttons.blocked;
}

function getButtonHref(snapshot: StudentDashboardSnapshot) {
  if (snapshot.canStartHomework) {
    return "/app/new";
  }

  if (snapshot.startState === "quota_blocked") {
    return "/app#usage";
  }

  return "/app#links";
}

function getTone(snapshot: StudentDashboardSnapshot) {
  return snapshot.canStartHomework ? "accent" : "warning";
}

function renderSubjectHighlights(
  subjectRollup: StudentDashboardSubjectRollup[],
  languageCode: UiLanguageCode,
) {
  const copy = getStudentDashboardStartPanelCopy(languageCode);

  if (subjectRollup.length === 0) {
    return (
      <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
        {copy.noRecentSubjects}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {subjectRollup.slice(0, 5).map((subject) => (
        <span
          className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-2 text-sm"
          key={subject.subjectTag}
        >
          {subject.subjectTag}
          <span className="ml-2 text-[color:var(--ink-soft)]">
            {new Intl.NumberFormat(getIntlLocale(languageCode)).format(
              subject.count,
            )}
          </span>
        </span>
      ))}
    </div>
  );
}

export function StudentDashboardStartPanel({
  snapshot,
}: StudentDashboardStartPanelProps) {
  const languageCode = snapshot.appUser.preferred_ui_language;
  const copy = getStudentDashboardStartPanelCopy(languageCode);

  return (
    <section
      className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.2fr_0.8fr]"
      id="start"
    >
      <article className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StudentStatusPill
            label={getStartStateLabel(snapshot.startState, languageCode)}
            tone={getTone(snapshot)}
          />
          <StudentStatusPill
            label={
              snapshot.usage.quota.planKind === "paid"
                ? copy.paidPlan
                : copy.trialPlan
            }
          />
          <StudentStatusPill
            label={
              snapshot.support.parentalApprovalRequired
                ? copy.supervisionRequired
                : copy.autonomousStart
            }
          />
          <StudentStatusPill
            label={copy.recentSessions(snapshot.recentSessions.length)}
          />
        </div>

        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.eyebrow}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
            {snapshot.canStartHomework
              ? copy.titleReady
              : copy.titleBlocked}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
            {getStartStateBody(snapshot.startState, languageCode)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            aria-disabled={!snapshot.canStartHomework}
            className={`inline-flex rounded-full px-5 py-3 text-sm font-medium transition ${
              snapshot.canStartHomework
                ? "bg-[color:var(--accent)] text-white hover:-translate-y-0.5"
                : "cursor-not-allowed border border-[rgba(208,124,91,0.4)] bg-[#fff0ea] text-[#8d3b1f]"
            }`}
            href={getButtonHref(snapshot)}
          >
            {getButtonLabel(snapshot, languageCode)}
          </Link>
          <p className="text-sm text-[color:var(--ink-soft)]">
            {copy.actionHint}
          </p>
        </div>
      </article>

      <article className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
        <div className="space-y-2">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.recentSubjectsEyebrow}
          </p>
          <h3 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {copy.recentSubjectsTitle}
          </h3>
        </div>

        {renderSubjectHighlights(snapshot.subjectRollup, languageCode)}

        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.intakeBody}
        </p>
      </article>
    </section>
  );
}
