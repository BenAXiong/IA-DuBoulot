import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import { ProfileAvatar } from "@/components/dashboard/parent/profile-avatar";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getParentDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ParentDashboardLearnerCardModel } from "@/components/dashboard/parent/parent-dashboard-presenters";

type ParentLearnersRailProps = {
  learners: ParentDashboardLearnerCardModel[];
  languageCode: UiLanguageCode;
};

export function ParentLearnersRail({
  learners,
  languageCode,
}: ParentLearnersRailProps) {
  const copy = getParentDashboardCopy(languageCode);

  return (
    <SurfaceCard className="grid gap-4 p-4 sm:p-5" id="students">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
          {copy.learners.eyebrow}
        </p>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.learners.body}
        </p>
      </div>

      {learners.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.learners.empty}
        </div>
      ) : (
        <div className="grid gap-3">
          {learners.map((learner, index) => (
            <article
              className={`grid gap-4 rounded-[1.5rem] border p-4 ${
                index === 0
                  ? "border-[color:var(--line-strong)] bg-[color:var(--surface)] shadow-[var(--shadow-soft)]"
                  : "border-[color:var(--line)] bg-[color:var(--surface-strong)]"
              }`}
              key={learner.id}
            >
              <div className="flex items-start gap-3">
                <ProfileAvatar name={learner.displayName} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <StudentStatusPill
                      label={learner.attentionLabel}
                      tone={learner.attentionTone}
                    />
                    {learner.ageBandLabel ? (
                      <StudentStatusPill label={learner.ageBandLabel} />
                    ) : null}
                    {learner.under13Label ? (
                      <StudentStatusPill
                        label={learner.under13Label}
                        tone="warning"
                      />
                    ) : null}
                  </div>
                  <h3 className="mt-3 font-[family-name:var(--font-heading)] text-xl leading-tight">
                    {learner.displayName}
                  </h3>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    {copy.learners.lastActivity(learner.lastActivityLabel)}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-3 text-sm text-[color:var(--ink-soft)]">
                <p>{learner.assignmentsLabel}</p>
                <p>{learner.weeklyCompletedLabel}</p>
                <p>{learner.usageLabel}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                  {copy.learners.difficulties}
                </p>
                {learner.weaknessTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {learner.weaknessTags.map((tag) => (
                      <StudentStatusPill key={tag} label={tag} tone="warning" />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                    {copy.learners.noDifficulty}
                  </p>
                )}
              </div>

              <div className="grid gap-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                <p>
                  {learner.latestSessionTitle
                    ? copy.learners.latestSession(learner.latestSessionTitle)
                    : copy.learners.noLatestSession}
                </p>
                {learner.latestNextStepRecommendation ? (
                  <p>{copy.learners.nextStep(learner.latestNextStepRecommendation)}</p>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Link
                  className="button-base button-secondary justify-center"
                  href={learner.detailHref}
                >
                  {copy.learners.openLearner}
                </Link>
                {learner.latestReviewHref ? (
                  <Link
                    className="button-base button-primary justify-center"
                    href={learner.latestReviewHref}
                  >
                    {copy.learners.reviewLatest}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}
