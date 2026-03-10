import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatCompactNumber,
  formatDateLabel,
  formatUsagePeriod,
} from "@/components/dashboard/student/student-dashboard-presenters";
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

function getSupportHeadline(support: StudentDashboardSupportSnapshot) {
  if (support.isUnder13) {
    if (support.parentApprovedAt || support.parentLinks.active > 0) {
      return "Supervision parent active";
    }

    return "Validation parent attendue";
  }

  if (support.tutorLinks.active > 0) {
    return "Cadre adulte branche";
  }

  return "Aucun adulte lie pour l'instant";
}

export function StudentDashboardSupportGrid({
  languageCode,
  support,
  usage,
}: StudentDashboardSupportGridProps) {
  return (
    <div className="grid gap-6">
      <section
        className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
        id="links"
      >
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Cadre adulte
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            {getSupportHeadline(support)}
          </h2>
          <div className="flex flex-wrap gap-2">
            {support.parentalApprovalRequired ? (
              <StudentStatusPill label="Parent requis" tone="accent" />
            ) : (
              <StudentStatusPill label="Parent optionnel" />
            )}
            <StudentStatusPill label={`${support.parentLinks.active} parent actif`} />
            <StudentStatusPill label={`${support.tutorLinks.active} tuteur actif`} />
            {support.parentLinks.pending > 0 ? (
              <StudentStatusPill
                label={`${support.parentLinks.pending} parent en attente`}
                tone="warning"
              />
            ) : null}
            {support.tutorLinks.pending > 0 ? (
              <StudentStatusPill
                label={`${support.tutorLinks.pending} tuteur en attente`}
                tone="warning"
              />
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm">
          <p className="font-medium">Etat de supervision</p>
          <p className="leading-6 text-[color:var(--ink-soft)]">
            {support.parentApprovedAt
              ? `Derniere approbation parent enregistree le ${formatDateLabel(
                  support.parentApprovedAt,
                  languageCode,
                )}.`
              : support.parentalApprovalRequired
                ? "Aucune approbation parent active n'est encore enregistree."
                : "Le compte peut avancer sans approbation parent obligatoire."}
          </p>
        </div>
      </section>

      <section
        className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
        id="usage"
      >
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Usage
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            {usage.hasUsage ? "Activite suivie sur la periode courante" : "Le suivi d'usage demarre avec le premier devoir"}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {formatUsagePeriod(usage, languageCode)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              Sessions
            </p>
            <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl">
              {formatCompactNumber(usage.sessionsCount, languageCode)}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              Uploads
            </p>
            <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl">
              {formatCompactNumber(usage.uploadsCount, languageCode)}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              Messages IA
            </p>
            <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl">
              {formatCompactNumber(usage.assistantMessageCount, languageCode)}
            </p>
          </article>
        </div>

        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          Le produit affiche deja la consommation actuelle. Les vraies regles de
          quota et d&apos;essai seront branchees en `A6.2` sans refaire cette surface.
        </p>
      </section>
    </div>
  );
}
