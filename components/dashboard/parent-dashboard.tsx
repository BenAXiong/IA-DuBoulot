import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import {
  getDashboardAccountStatusLabel,
  getDashboardAgeBandLabel,
  getParentDashboardCopy,
} from "@/lib/i18n/dashboard-copy";
import { getLanguageLabel } from "@/lib/i18n/ui-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ParentDashboardSnapshot } from "@/lib/server/oversight/types";

type ParentDashboardProps = {
  snapshot: ParentDashboardSnapshot;
  languageCode: UiLanguageCode;
};

function buildBillingBody(
  snapshot: ParentDashboardSnapshot["billing"],
  languageCode: UiLanguageCode,
) {
  const copy = getParentDashboardCopy(languageCode);

  if (!snapshot.hasSubscription) {
    return copy.noSubscription;
  }

  const planLabel = languageCode === "zh" ? "方案" : "Plan";
  const statusLabel =
    languageCode === "en" ? "status" : languageCode === "zh" ? "狀態" : "statut";

  return `${planLabel} ${snapshot.planKey ?? copy.unknown} | ${statusLabel} ${snapshot.status ?? copy.unknown}`;
}

function getQuotaLabel(
  usage: ParentDashboardSnapshot["linkedStudents"][number]["usage"],
  languageCode: UiLanguageCode,
) {
  const copy = getParentDashboardCopy(languageCode);

  if (usage.quota.accessState === "blocked") {
    return copy.quota.blocked;
  }

  if (usage.quota.accessState === "warning") {
    return copy.quota.warning;
  }

  return usage.quota.planKind === "paid" ? copy.quota.paid : copy.quota.trial;
}

function getQuotaTone(
  usage: ParentDashboardSnapshot["linkedStudents"][number]["usage"],
) {
  if (usage.quota.accessState === "blocked") {
    return "warning" as const;
  }

  if (usage.quota.accessState === "warning") {
    return "accent" as const;
  }

  return undefined;
}

export function ParentDashboard({
  snapshot,
  languageCode,
}: ParentDashboardProps) {
  const copy = getParentDashboardCopy(languageCode);
  const blockedStudents = snapshot.linkedStudents.filter(
    (student) => student.usage.quota.accessState === "blocked",
  ).length;
  const warningStudents = snapshot.linkedStudents.filter(
    (student) => student.usage.quota.accessState === "warning",
  ).length;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="overview">
        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.overview.supervision}
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {copy.overview.linkedStudents(snapshot.linkedStudents.length)}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.overview.supervisionBody}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.overview.quotas}
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {copy.overview.blockedStudents(blockedStudents)}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.overview.blockedBody(warningStudents)}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.overview.billing}
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {snapshot.billing.hasSubscription
              ? copy.overview.billingVisible
              : copy.overview.billingMissing}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {buildBillingBody(snapshot.billing, languageCode)}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <form action="/api/billing/checkout" method="POST">
              <input name="planKey" type="hidden" value="family_monthly" />
              <button
                className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                type="submit"
              >
                {snapshot.billing.hasSubscription
                  ? copy.overview.manage
                  : copy.overview.activate}
              </button>
            </form>
            {snapshot.billing.hasSubscription ? (
              <form action="/api/billing/portal" method="POST">
                <button
                  className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                  type="submit"
                >
                  {copy.overview.portal}
                </button>
              </form>
            ) : null}
          </div>
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
                    {student.ageBand ? (
                      <StudentStatusPill
                        label={
                          getDashboardAgeBandLabel(student.ageBand, languageCode) ??
                          student.ageBand
                        }
                      />
                    ) : null}
                    {student.isUnder13 ? (
                      <StudentStatusPill
                        label={copy.linkedStudents.under13}
                        tone="warning"
                      />
                    ) : null}
                    <StudentStatusPill
                      label={getQuotaLabel(student.usage, languageCode)}
                      tone={getQuotaTone(student.usage)}
                    />
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                      {student.displayName}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                      {copy.linkedStudents.interfaceUsage(
                        getLanguageLabel(student.preferredUiLanguage),
                        student.usage.sessionsCount,
                        student.usage.quota.sessions.limit,
                      )}
                    </p>
                  </div>
                  <Link
                    className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
                    href={`/app/students/${student.id}`}
                  >
                    {copy.linkedStudents.followUp}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              {copy.weekly.eyebrow}
            </p>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.weekly.window(
                formatDateLabel(snapshot.weeklySummary.windowStart, languageCode),
                formatDateLabel(snapshot.weeklySummary.windowEnd, languageCode),
              )}
            </p>
          </div>

          {snapshot.weeklySummary.studentSnapshots.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.weekly.empty}
            </div>
          ) : (
            snapshot.weeklySummary.studentSnapshots.map((student) => (
              <article
                className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
                key={student.studentUserId}
              >
                <div className="flex flex-wrap gap-2">
                  <StudentStatusPill label={student.studentDisplayName} tone="accent" />
                  <StudentStatusPill
                    label={copy.weekly.sessions(student.completedSessionCount)}
                  />
                </div>
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  {student.latestSummaryText ?? copy.weekly.noSummary}
                </p>
                {student.nextStepRecommendation ? (
                  <p className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                    {copy.weekly.nextStep(student.nextStepRecommendation)}
                  </p>
                ) : null}
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
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                      {session.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                      {session.nextStepRecommendation ??
                        copy.recent.noRecommendation}
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
