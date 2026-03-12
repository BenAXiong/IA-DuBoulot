import Link from "next/link";
import { TutorNotesPanel } from "@/components/dashboard/oversight/tutor-notes-panel";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { getDashboardAccountStatusLabel } from "@/lib/i18n/dashboard-copy";
import { getTutorStudentDetailCopy } from "@/lib/i18n/oversight-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { TutorStudentDetail } from "@/lib/server/oversight/types";

type TutorStudentDetailProps = {
  detail: TutorStudentDetail;
  languageCode: UiLanguageCode;
};

export function TutorStudentDetailView({
  detail,
  languageCode,
}: TutorStudentDetailProps) {
  const copy = getTutorStudentDetailCopy(languageCode);

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.08fr_0.92fr]">
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.eyebrow}
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
            {detail.student.displayName}
          </h1>
          <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
            {copy.body}
          </p>
          <div className="flex flex-wrap gap-2">
            <StudentStatusPill
              label={getDashboardAccountStatusLabel(
                detail.student.accountStatus,
                languageCode,
              )}
              tone="accent"
            />
            <StudentStatusPill
              label={copy.recentSessionCount(detail.student.recentSessionCount)}
            />
            <StudentStatusPill
              label={copy.pinnedNotes(detail.student.pinnedNoteCount)}
              tone="warning"
            />
          </div>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm">
          <p className="font-medium">{copy.weaknessesTitle}</p>
          {detail.insight.topWeaknessTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {detail.insight.topWeaknessTags.map((tag) => (
                <StudentStatusPill key={tag} label={tag} tone="warning" />
              ))}
            </div>
          ) : (
            <p className="text-[color:var(--ink-soft)]">
              {copy.noWeaknesses}
            </p>
          )}
          <Link
              className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
              href="/app"
            >
              {copy.backToDashboard}
          </Link>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-6">
          <section className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                {copy.recentSessionsEyebrow}
              </p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.recentSessionsBody}
              </p>
            </div>

            {detail.recentSessions.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.noSessions}
              </div>
            ) : (
              <div className="grid gap-3">
                {detail.recentSessions.map((session) => (
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
                        {session.weaknessTags.map((tag) => (
                          <StudentStatusPill key={tag} label={tag} tone="warning" />
                        ))}
                      </div>
                      <div>
                        <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                          {session.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                          {session.nextStepRecommendation ??
                            copy.noRecommendation}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-[color:var(--ink-soft)] md:justify-items-end">
                      <p>
                        {formatDateLabel(
                          session.lastMessageAt ?? session.createdAt,
                          languageCode,
                        ) ?? copy.noDate}
                      </p>
                      <Link
                        className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                        href={`/app/review/${session.id}`}
                      >
                        {copy.open}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-6">
          <section className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                {copy.nextTopicsEyebrow}
              </p>
              {detail.insight.recommendedNextTopics.length > 0 ? (
                <div className="grid gap-3">
                  {detail.insight.recommendedNextTopics.map((topic) => (
                    <div
                      className="rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]"
                      key={topic}
                    >
                      {topic}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                  {copy.nextTopicsEmpty}
                </div>
              )}
            </div>
          </section>

          <TutorNotesPanel
            body={copy.notesBody}
            initialNotes={detail.notes}
            languageCode={languageCode}
            studentUserId={detail.student.id}
            title={copy.notesTitle}
          />
        </div>
      </section>
    </div>
  );
}
