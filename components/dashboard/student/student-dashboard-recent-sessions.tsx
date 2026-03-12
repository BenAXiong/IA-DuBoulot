import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { getStudentDashboardRecentSessionsCopy } from "@/lib/i18n/dashboard-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  StudentDashboardConversation,
  StudentDashboardSubjectRollup,
} from "@/lib/server/student-dashboard/types";

type StudentDashboardRecentSessionsProps = {
  languageCode: UiLanguageCode;
  recentSessions: StudentDashboardConversation[];
  subjectRollup: StudentDashboardSubjectRollup[];
};

function getSessionDate(
  session: StudentDashboardConversation,
  languageCode: UiLanguageCode,
) {
  const copy = getStudentDashboardRecentSessionsCopy(languageCode);

  return (
    formatDateLabel(session.lastMessageAt, languageCode) ??
    formatDateLabel(session.completedAt, languageCode) ??
    formatDateLabel(session.createdAt, languageCode) ??
    copy.noDate
  );
}

export function StudentDashboardRecentSessions({
  languageCode,
  recentSessions,
  subjectRollup,
}: StudentDashboardRecentSessionsProps) {
  const copy = getStudentDashboardRecentSessionsCopy(languageCode);

  return (
    <section
      className="grid gap-5 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
      id="sessions"
    >
      <div className="space-y-3">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
          {copy.eyebrow}
        </p>
        <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
          {copy.title}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {subjectRollup.length > 0 ? (
            subjectRollup.slice(0, 6).map((subject) => (
              <StudentStatusPill
                key={subject.subjectTag}
                label={`${subject.subjectTag} x${subject.count}`}
              />
            ))
          ) : (
            <StudentStatusPill label={copy.noRecentTag} tone="warning" />
          )}
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-3 py-1 text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
            href="/app/history"
          >
            {copy.viewAll}
          </Link>
        </div>
      </div>

      {recentSessions.length === 0 ? (
        <article className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
          <p className="font-medium">{copy.emptyTitle}</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.emptyBody}
          </p>
        </article>
      ) : (
        <div className="grid gap-3">
          {recentSessions.map((session) => (
            <article
              className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 md:grid-cols-[1fr_auto]"
              key={session.id}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StudentStatusPill label={session.subjectTag} tone="accent" />
                  <StudentStatusPill
                    label={getConversationStatusLabel(
                      session.status,
                      languageCode,
                    )}
                  />
                  {session.gradedHomework ? (
                    <StudentStatusPill label={copy.graded} />
                  ) : (
                    <StudentStatusPill label={copy.practice} />
                  )}
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                    {session.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                    {copy.body}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 text-sm text-[color:var(--ink-soft)] md:justify-items-end">
                <p>{copy.lastActivity}</p>
                <p className="mt-1 font-medium text-[color:var(--foreground)]">
                  {getSessionDate(session, languageCode)}
                </p>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                  href={`/app/conversations/${session.id}`}
                >
                  {copy.resume}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
