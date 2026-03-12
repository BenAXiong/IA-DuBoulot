import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import {
  getDashboardAccountStatusLabel,
  getTutorDashboardCopy,
} from "@/lib/i18n/dashboard-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { TutorDashboardSnapshot } from "@/lib/server/oversight/types";

type TutorDashboardProps = {
  snapshot: TutorDashboardSnapshot;
  languageCode: UiLanguageCode;
};

export function TutorDashboard({
  snapshot,
  languageCode,
}: TutorDashboardProps) {
  const copy = getTutorDashboardCopy(languageCode);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="overview">
        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.overview.links}
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {copy.overview.linkedStudents(snapshot.linkedStudents.length)}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.overview.linksBody}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.overview.sessions}
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {copy.overview.recentSessions(snapshot.recentSessions.length)}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.overview.sessionsBody}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.overview.notes}
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {copy.overview.notesTitle}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.overview.notesBody}
          </p>
        </article>
      </section>

      <section
        className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] xl:grid-cols-[1.08fr_0.92fr]"
        id="students"
      >
        <div className="grid gap-4">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              {copy.linkedStudents.eyebrow}
            </p>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.linkedStudents.body}
            </p>
          </div>

          {snapshot.linkedStudents.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.linkedStudents.empty}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {snapshot.linkedStudents.map((student) => (
                <article
                  className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
                  key={student.id}
                >
                  <div className="flex flex-wrap gap-2">
                    <StudentStatusPill
                      label={getDashboardAccountStatusLabel(
                        student.accountStatus,
                        languageCode,
                      )}
                      tone="accent"
                    />
                    <StudentStatusPill
                      label={copy.linkedStudents.sessions(
                        student.recentSessionCount,
                      )}
                    />
                    <StudentStatusPill
                      label={copy.linkedStudents.notes(student.pinnedNoteCount)}
                      tone="warning"
                    />
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                      {student.displayName}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {student.topWeaknessTags.length > 0 ? (
                        student.topWeaknessTags.map((tag) => (
                          <StudentStatusPill key={tag} label={tag} tone="warning" />
                        ))
                      ) : (
                        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                          {copy.linkedStudents.noWeakness}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
                    href={`/app/students/${student.id}`}
                  >
                    {copy.linkedStudents.open}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              {copy.review.eyebrow}
            </p>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.review.body}
            </p>
          </div>

          {snapshot.recentSessions.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.review.empty}
            </div>
          ) : (
            snapshot.recentSessions.slice(0, 4).map((session) => (
              <article
                className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
                key={session.id}
              >
                <div className="flex flex-wrap gap-2">
                  <StudentStatusPill label={session.studentDisplayName} tone="accent" />
                  <StudentStatusPill label={session.subjectTag} />
                </div>
                <p className="font-medium">{session.title}</p>
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  {session.nextStepRecommendation ?? copy.review.noRecommendation}
                </p>
                <p className="text-sm text-[color:var(--ink-soft)]">
                  {formatDateLabel(
                    session.lastMessageAt ?? session.createdAt,
                    languageCode,
                  ) ?? copy.review.noDate}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.recent.eyebrow}
          </p>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.recent.body}
          </p>
        </div>

        {snapshot.recentSessions.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.recent.empty}
          </div>
        ) : (
          <div className="grid gap-3">
            {snapshot.recentSessions.map((session) => (
              <article
                className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 md:grid-cols-[1fr_auto]"
                key={session.id}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <StudentStatusPill label={session.studentDisplayName} tone="accent" />
                    <StudentStatusPill label={session.subjectTag} />
                    <StudentStatusPill
                      label={getConversationStatusLabel(
                        session.status,
                        languageCode,
                      )}
                    />
                    {session.weaknessTags.map((tag) => (
                      <StudentStatusPill key={tag} label={tag} tone="warning" />
                    ))}
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                      {session.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                      {session.summaryText ?? copy.recent.noSummary}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-[color:var(--ink-soft)] md:justify-items-end">
                  <p>
                    {formatDateLabel(
                      session.lastMessageAt ?? session.createdAt,
                      languageCode,
                    ) ?? copy.recent.noDate}
                  </p>
                  <Link
                    className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                    href={`/app/review/${session.id}`}
                  >
                    {copy.recent.open}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
