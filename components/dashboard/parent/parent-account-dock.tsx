import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import { ParentDashboardAccountModel } from "@/components/dashboard/parent/parent-dashboard-presenters";
import { ProfileAvatar } from "@/components/dashboard/parent/profile-avatar";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getParentDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ParentBillingSnapshot } from "@/lib/server/oversight/types";

type ParentAccountDockProps = {
  account: ParentDashboardAccountModel;
  billing: ParentBillingSnapshot;
  languageCode: UiLanguageCode;
};

export function ParentAccountDock({
  account,
  billing,
  languageCode,
}: ParentAccountDockProps) {
  const copy = getParentDashboardCopy(languageCode);

  return (
    <SurfaceCard className="grid gap-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <ProfileAvatar name={account.displayName} size="lg" />
        <div className="min-w-0 space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.account.eyebrow}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {account.displayName}
          </h2>
          <p className="truncate text-sm text-[color:var(--ink-soft)]">
            {account.email ?? copy.account.noEmail}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <StudentStatusPill label={account.accountStatusLabel} tone="accent" />
        <StudentStatusPill
          label={
            billing.hasSubscription
              ? copy.account.familyPlan
              : copy.account.noPlan
          }
        />
      </div>

      <div className="grid gap-2 rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--ink-soft)]">
        <p>{`${copy.account.plan} ${billing.planKey ?? copy.account.unknown}`}</p>
        <p>{`${copy.account.status} ${billing.status ?? copy.account.unknown}`}</p>
        {billing.currentPeriodEndsAt ? (
          <p>{`${copy.account.periodEndsAt} ${formatDateLabel(
            billing.currentPeriodEndsAt,
            languageCode,
          )}`}</p>
        ) : null}
        {billing.trialEndsAt ? (
          <p>{`${copy.account.trialEndsAt} ${formatDateLabel(
            billing.trialEndsAt,
            languageCode,
          )}`}</p>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link className="button-base button-secondary justify-center" href="/app/settings">
          {copy.account.settings}
        </Link>

        {billing.hasSubscription ? (
          <form action="/api/billing/portal" method="POST">
            <button
              className="button-base button-primary w-full justify-center"
              type="submit"
            >
              {copy.account.manageBilling}
            </button>
          </form>
        ) : (
          <form action="/api/billing/checkout" method="POST">
            <input name="planKey" type="hidden" value="family_monthly" />
            <button
              className="button-base button-primary w-full justify-center"
              type="submit"
            >
              {copy.account.activateFamily}
            </button>
          </form>
        )}
      </div>
    </SurfaceCard>
  );
}
