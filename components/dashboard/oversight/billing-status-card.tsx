import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import { getBillingStatusCardCopy } from "@/lib/i18n/oversight-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ParentBillingSnapshot } from "@/lib/server/oversight/types";

type BillingStatusCardProps = {
  billing: ParentBillingSnapshot;
  languageCode: UiLanguageCode;
};

export function BillingStatusCard({
  billing,
  languageCode,
}: BillingStatusCardProps) {
  const copy = getBillingStatusCardCopy(languageCode);

  return (
    <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="space-y-2">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
          {copy.eyebrow}
        </p>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.body}
        </p>
      </div>

      {billing.hasSubscription ? (
        <div className="grid gap-2 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
          <p>{copy.plan}: {billing.planKey ?? copy.unknown}</p>
          <p>{copy.status}: {billing.status ?? copy.unknown}</p>
          {billing.trialEndsAt ? (
            <p>
              {copy.trialEndsAt}:{" "}
              {formatDateLabel(billing.trialEndsAt, languageCode)}
            </p>
          ) : null}
          {billing.currentPeriodEndsAt ? (
            <p>
              {copy.periodEndsAt}:{" "}
              {formatDateLabel(billing.currentPeriodEndsAt, languageCode)}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-3">
            <form action="/api/billing/portal" method="POST">
              <button
                className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
                type="submit"
              >
                {copy.openPortal}
              </button>
            </form>
            <form action="/api/billing/checkout" method="POST">
              <input name="planKey" type="hidden" value="family_monthly" />
              <button
                className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2 font-medium transition hover:-translate-y-0.5"
                type="submit"
              >
                {copy.resumeSubscription}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
          <p>{copy.noSubscription}</p>
          <form action="/api/billing/checkout" className="mt-3" method="POST">
            <input name="planKey" type="hidden" value="family_monthly" />
            <button
              className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
              type="submit"
            >
              {copy.activateFamily}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
