import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatCompactNumber,
  formatDateLabel,
  formatUsagePeriod,
} from "@/components/dashboard/student/student-dashboard-presenters";
import { getStudentDashboardSupportCopy } from "@/lib/i18n/dashboard-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  StudentDashboardSupportSnapshot,
  StudentDashboardUsageSnapshot,
} from "@/lib/server/student-dashboard/types";

type StudentDashboardSupportGridProps = {
  languageCode: UiLanguageCode;
  support: StudentDashboardSupportSnapshot;
  usage: StudentDashboardUsageSnapshot;
};

function getUsageBody(
  usage: StudentDashboardUsageSnapshot,
  languageCode: UiLanguageCode,
) {
  const copy = getStudentDashboardSupportCopy(languageCode);

  return copy.usageBody(
    usage,
    formatDateLabel(usage.quota.trialEndsAt, languageCode),
  );
}

function formatBudgetLine(
  used: number,
  limit: number | null,
  languageCode: UiLanguageCode,
) {
  const copy = getStudentDashboardSupportCopy(languageCode);
  const formattedUsed = formatCompactNumber(used, languageCode);

  if (limit == null) {
    return copy.usedNoLimit(formattedUsed);
  }

  return `${formattedUsed} / ${formatCompactNumber(limit, languageCode)}`;
}

export function StudentDashboardSupportGrid({
  languageCode,
  support,
  usage,
}: StudentDashboardSupportGridProps) {
  const copy = getStudentDashboardSupportCopy(languageCode);

  return (
    <div className="grid gap-6">
      <section
        className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
        id="links"
      >
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.adultFrameEyebrow}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            {copy.supportHeadline(support)}
          </h2>
          <div className="flex flex-wrap gap-2">
            {support.parentalApprovalRequired ? (
              <StudentStatusPill label={copy.approvalRequired} tone="accent" />
            ) : (
              <StudentStatusPill label={copy.approvalOptional} />
            )}
            <StudentStatusPill label={copy.activeParents(support.parentLinks.active)} />
            <StudentStatusPill label={copy.activeTutors(support.tutorLinks.active)} />
            {support.parentLinks.pending > 0 ? (
              <StudentStatusPill
                label={copy.pendingParents(support.parentLinks.pending)}
                tone="warning"
              />
            ) : null}
            {support.tutorLinks.pending > 0 ? (
              <StudentStatusPill
                label={copy.pendingTutors(support.tutorLinks.pending)}
                tone="warning"
              />
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm">
          <p className="font-medium">{copy.supervisionState}</p>
          <p className="leading-6 text-[color:var(--ink-soft)]">
            {support.parentApprovedAt
              ? copy.supervisionApproved(
                  formatDateLabel(support.parentApprovedAt, languageCode) ?? "",
                )
              : support.parentalApprovalRequired
                ? copy.supervisionMissing
                : copy.supervisionOptionalBody}
          </p>
        </div>
      </section>

      <section
        className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
        id="usage"
      >
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.usageEyebrow}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            {copy.usageHeadline(usage)}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {formatUsagePeriod(usage, languageCode)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StudentStatusPill
            label={usage.quota.planKind === "paid" ? copy.paidPlan : copy.trialPlan}
            tone={usage.quota.planKind === "paid" ? "accent" : undefined}
          />
          <StudentStatusPill
            label={
              usage.quota.accessState === "blocked"
                ? copy.blocked
                : usage.quota.accessState === "warning"
                  ? copy.warning
                  : copy.available
            }
            tone={
              usage.quota.accessState === "blocked"
                ? "warning"
                : usage.quota.accessState === "warning"
                  ? "accent"
                  : undefined
            }
          />
          {usage.quota.trialEndsAt ? (
            <StudentStatusPill
              label={copy.trialUntil(
                formatDateLabel(usage.quota.trialEndsAt, languageCode) ?? "",
              )}
            />
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              {copy.cards.sessions}
            </p>
            <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl">
              {formatBudgetLine(
                usage.sessionsCount,
                usage.quota.sessions.limit,
                languageCode,
              )}
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              {copy.remaining}:{" "}
              {formatCompactNumber(usage.quota.sessions.remaining ?? 0, languageCode)}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              {copy.cards.uploads}
            </p>
            <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl">
              {formatBudgetLine(
                usage.uploadsCount,
                usage.quota.uploads.limit,
                languageCode,
              )}
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              {copy.remaining}:{" "}
              {formatCompactNumber(usage.quota.uploads.remaining ?? 0, languageCode)}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              {copy.cards.assistantMessages}
            </p>
            <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl">
              {formatBudgetLine(
                usage.assistantMessageCount,
                usage.quota.assistantMessages.limit,
                languageCode,
              )}
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              {copy.remaining}:{" "}
              {formatCompactNumber(
                usage.quota.assistantMessages.remaining ?? 0,
                languageCode,
              )}
            </p>
          </article>
        </div>

        <div className="grid gap-2 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
          <p>{getUsageBody(usage, languageCode)}</p>
          <p>
            {copy.inputTokens}:{" "}
            {formatBudgetLine(
              usage.inputTokens,
              usage.quota.inputTokens.limit,
              languageCode,
            )}
          </p>
          <p>
            {copy.outputTokens}:{" "}
            {formatBudgetLine(
              usage.outputTokens,
              usage.quota.outputTokens.limit,
              languageCode,
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
