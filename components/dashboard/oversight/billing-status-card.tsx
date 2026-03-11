import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
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
  return (
    <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="space-y-2">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
          Facturation
        </p>
        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          Le statut payeur reste visible cote parent et donne un point d&apos;entree direct vers l&apos;activation ou la gestion Lemon Squeezy.
        </p>
      </div>

      {billing.hasSubscription ? (
        <div className="grid gap-2 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--ink-soft)]">
          <p>Plan: {billing.planKey ?? "inconnu"}</p>
          <p>Statut: {billing.status ?? "inconnu"}</p>
          {billing.trialEndsAt ? (
            <p>Fin d&apos;essai: {formatDateLabel(billing.trialEndsAt, languageCode)}</p>
          ) : null}
          {billing.currentPeriodEndsAt ? (
            <p>
              Fin de periode:{" "}
              {formatDateLabel(billing.currentPeriodEndsAt, languageCode)}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-3">
            <form action="/api/billing/portal" method="POST">
              <button
                className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
                type="submit"
              >
                Ouvrir le portail billing
              </button>
            </form>
            <form action="/api/billing/checkout" method="POST">
              <input name="planKey" type="hidden" value="family_monthly" />
              <button
                className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2 font-medium transition hover:-translate-y-0.5"
                type="submit"
              >
                Reprendre l&apos;abonnement
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
          <p>Aucun abonnement payeur visible pour ce compte parent.</p>
          <form action="/api/billing/checkout" className="mt-3" method="POST">
            <input name="planKey" type="hidden" value="family_monthly" />
            <button
              className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
              type="submit"
            >
              Activer Family
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
