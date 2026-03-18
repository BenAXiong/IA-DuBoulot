import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import { ProfileAvatar } from "@/components/dashboard/parent/profile-avatar";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getParentDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ParentDashboardViewModel } from "@/components/dashboard/parent/parent-dashboard-presenters";

type ParentActivityHubProps = {
  model: ParentDashboardViewModel;
  languageCode: UiLanguageCode;
};

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <SurfaceCard className="grid gap-2 bg-[color:var(--surface)] p-4 shadow-none">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
        {label}
      </p>
      <p className="font-[family-name:var(--font-heading)] text-3xl leading-none">
        {value}
      </p>
    </SurfaceCard>
  );
}

export function ParentActivityHub({
  model,
  languageCode,
}: ParentActivityHubProps) {
  const copy = getParentDashboardCopy(languageCode);
  const spotlight = model.focusLearner;

  return (
    <div className="grid gap-6">
      <section className="shell-panel page-glow rounded-[2rem] p-6 sm:p-7">
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.overview.eyebrow}
          </p>
          <h1 className="max-w-3xl font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
            {copy.overview.title}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-[color:var(--ink-soft)]">
            {copy.overview.body}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={copy.overview.stats.learners}
            value={`${model.learnerCount}`}
          />
          <StatCard
            label={copy.overview.stats.activeAssignments}
            value={`${model.activeAssignmentsCount}`}
          />
          <StatCard
            label={copy.overview.stats.completedThisWeek}
            value={`${model.weeklyCompletedCount}`}
          />
          <StatCard
            label={copy.overview.stats.attention}
            value={`${model.attentionCount}`}
          />
        </div>

        <div className="mt-6">
          {spotlight ? (
            <SurfaceCard className="grid gap-5 bg-[color:var(--surface)] p-5 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <ProfileAvatar name={spotlight.displayName} size="lg" />
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                      {copy.overview.spotlightEyebrow}
                    </p>
                    <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
                      {copy.overview.spotlightTitle(spotlight.displayName)}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <StudentStatusPill
                        label={spotlight.attentionLabel}
                        tone={spotlight.attentionTone}
                      />
                      <StudentStatusPill label={spotlight.assignmentsLabel} />
                      <StudentStatusPill label={spotlight.weeklyCompletedLabel} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 md:min-w-44">
                  <Link
                    className="button-base button-primary justify-center"
                    href={spotlight.detailHref}
                  >
                    {copy.overview.openLearner}
                  </Link>
                  {spotlight.latestReviewHref ? (
                    <Link
                      className="button-base button-secondary justify-center"
                      href={spotlight.latestReviewHref}
                    >
                      {copy.overview.reviewLatest}
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
                  <p>{copy.overview.lastActivity(spotlight.lastActivityLabel)}</p>
                  <p>
                    {spotlight.latestSessionTitle
                      ? copy.learners.latestSession(spotlight.latestSessionTitle)
                      : copy.learners.noLatestSession}
                  </p>
                  {spotlight.latestNextStepRecommendation ? (
                    <p>{copy.learners.nextStep(spotlight.latestNextStepRecommendation)}</p>
                  ) : (
                    <p>{copy.overview.noNextStep}</p>
                  )}
                </div>

                <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                    {copy.learners.difficulties}
                  </p>
                  {spotlight.weaknessTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {spotlight.weaknessTags.map((tag) => (
                        <StudentStatusPill key={tag} label={tag} tone="warning" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                      {copy.learners.noDifficulty}
                    </p>
                  )}
                </div>
              </div>
            </SurfaceCard>
          ) : (
            <SurfaceCard className="bg-[color:var(--surface)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.overview.spotlightEmpty}
            </SurfaceCard>
          )}
        </div>
      </section>

      <section className="shell-panel rounded-[2rem] p-6 sm:p-7">
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.activity.eyebrow}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            {copy.activity.title}
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-[color:var(--ink-soft)]">
            {copy.activity.body}
          </p>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          <SurfaceCard className="grid gap-4 bg-[color:var(--surface)] p-5 sm:p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                {copy.activity.weeklyTitle}
              </p>
            </div>

            {model.weeklyEntries.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.activity.weeklyEmpty}
              </div>
            ) : (
              <div className="grid gap-3">
                {model.weeklyEntries.map((entry) => (
                  <article
                    className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4"
                    key={entry.studentUserId}
                  >
                    <div className="flex flex-wrap gap-2">
                      <StudentStatusPill label={entry.studentDisplayName} tone="accent" />
                      <StudentStatusPill label={entry.completedSessionsLabel} />
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                      {entry.latestSummaryText ?? copy.activity.weeklyNoSummary}
                    </p>
                    {entry.nextStepRecommendation ? (
                      <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                        {copy.activity.weeklyNextStep(entry.nextStepRecommendation)}
                      </p>
                    ) : null}
                    <Link
                      className="button-base button-secondary justify-center sm:w-fit"
                      href={entry.studentHref}
                    >
                      {copy.activity.viewLearner}
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="grid gap-4 bg-[color:var(--surface)] p-5 sm:p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                {copy.activity.recentTitle}
              </p>
            </div>

            {model.recentSessions.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.activity.recentEmpty}
              </div>
            ) : (
              <div className="grid gap-3">
                {model.recentSessions.map((session) => (
                  <article
                    className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4"
                    key={session.id}
                  >
                    <div className="flex flex-wrap gap-2">
                      <StudentStatusPill
                        label={session.studentDisplayName}
                        tone="accent"
                      />
                      <StudentStatusPill label={session.subjectTag} />
                      <StudentStatusPill label={session.statusLabel} />
                      {session.weaknessTags.map((tag) => (
                        <StudentStatusPill key={tag} label={tag} tone="warning" />
                      ))}
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                        {session.title}
                      </h3>
                      <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                        {session.summaryText ?? copy.activity.recentNoSummary}
                      </p>
                      <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                        {session.nextStepRecommendation ?? copy.activity.recentNoRecommendation}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 text-sm text-[color:var(--ink-soft)] md:flex-row md:items-center md:justify-between">
                      <p>
                        {session.lastActivityLabel
                          ? copy.activity.lastActivity(session.lastActivityLabel)
                          : copy.activity.noDate}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="button-base button-secondary justify-center"
                          href={session.studentHref}
                        >
                          {copy.activity.viewLearner}
                        </Link>
                        <Link
                          className="button-base button-primary justify-center"
                          href={session.reviewHref}
                        >
                          {copy.activity.openReview}
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
