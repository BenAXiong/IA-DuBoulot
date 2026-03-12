import { MemoryPanel } from "@/components/dashboard/memory/memory-panel";
import Link from "next/link";
import { TutorInviteForm } from "@/components/links/tutor-invite-form";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import {
  getDashboardAccountStatusLabel,
  getDashboardAgeBandLabel,
} from "@/lib/i18n/dashboard-copy";
import { getParentStudentDetailCopy, getQuotaAccessStateLabel } from "@/lib/i18n/oversight-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ParentStudentDetail } from "@/lib/server/oversight/types";

type ParentStudentDetailProps = {
  detail: ParentStudentDetail;
  languageCode: UiLanguageCode;
};

export function ParentStudentDetailView({
  detail,
  languageCode,
}: ParentStudentDetailProps) {
  const copy = getParentStudentDetailCopy(languageCode);

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
            {detail.relationshipLabel ? (
              <StudentStatusPill label={detail.relationshipLabel} tone="accent" />
            ) : null}
            <StudentStatusPill
              label={getDashboardAccountStatusLabel(
                detail.student.accountStatus,
                languageCode,
              )}
            />
            {detail.student.ageBand ? (
              <StudentStatusPill
                label={
                  getDashboardAgeBandLabel(detail.student.ageBand, languageCode) ??
                  detail.student.ageBand
                }
              />
            ) : null}
            {detail.student.isUnder13 ? (
              <StudentStatusPill label={copy.under13} tone="warning" />
            ) : null}
          </div>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm">
          <p className="font-medium">{copy.weeklySummaryTitle}</p>
          <p className="text-[color:var(--ink-soft)]">
            {copy.weeklySummarySessions(detail.weeklySummary.completedSessionCount)}
          </p>
          <p className="text-[color:var(--ink-soft)]">
            {copy.weeklyWindow(
              formatDateLabel(detail.weeklySummary.windowStart, languageCode),
              formatDateLabel(detail.weeklySummary.windowEnd, languageCode),
            )}
          </p>
          <Link
              className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
              href="/app"
            >
            {copy.backToDashboard}
          </Link>
          <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 px-4 py-3">
            <p className="font-medium">
              {detail.student.usage.quota.planKind === "paid"
                ? copy.paidPlan
                : copy.trialPlan}
            </p>
            <p className="mt-2 text-[color:var(--ink-soft)]">
              {copy.sessionsLabel} {detail.student.usage.sessionsCount}/
              {detail.student.usage.quota.sessions.limit} | {copy.uploadsLabel}{" "}
              {detail.student.usage.uploadsCount}/
              {detail.student.usage.quota.uploads.limit}
            </p>
            <p className="mt-2 text-[color:var(--ink-soft)]">
              {copy.quotaLabel}:{" "}
              {getQuotaAccessStateLabel(
                detail.student.usage.quota.accessState,
                languageCode,
              )}
            </p>
          </div>
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
                        {session.summaryLanguage ? (
                          <StudentStatusPill
                            label={copy.summaryBadge(session.summaryLanguage)}
                          />
                        ) : null}
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
          <MemoryPanel
            intro={copy.memoryIntro}
            languageCode={languageCode}
            snapshot={detail.memory}
            studentUserId={detail.student.id}
            title={copy.memoryTitle}
          />

          <section className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                {copy.weeklyRhythmEyebrow}
              </p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.weeklyRhythmBody}
              </p>
            </div>

            {detail.weeklySummary.studentSnapshots.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.noWeeklySessions}
              </div>
            ) : (
              detail.weeklySummary.studentSnapshots.map((snapshot) => (
                <article
                  className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
                  key={snapshot.studentUserId}
                >
                  <div className="flex flex-wrap gap-2">
                    <StudentStatusPill
                      label={copy.completedSessions(snapshot.completedSessionCount)}
                      tone="accent"
                    />
                  </div>
                  <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                    {snapshot.latestSummaryText ?? copy.noRecentSummary}
                  </p>
                  {snapshot.nextStepRecommendation ? (
                    <p className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                      {copy.nextStep(snapshot.nextStepRecommendation)}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </section>

          <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <TutorInviteForm
              languageCode={languageCode}
              studentUserId={detail.student.id}
            />
          </section>
        </div>
      </section>
    </div>
  );
}
