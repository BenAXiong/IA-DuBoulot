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

function getUsageHeadline(usage: StudentDashboardUsageSnapshot) {
  if (usage.quota.accessState === "blocked") {
    return "Essai ou quota atteint";
  }

  if (usage.quota.accessState === "warning") {
    return usage.quota.planKind === "paid"
      ? "Acces actif, marge a surveiller"
      : "Essai en cours, marge bientot reduite";
  }

  if (usage.hasUsage) {
    return "Activite suivie sur la periode courante";
  }

  return "Le suivi d'usage demarre avec le premier devoir";
}

function getUsageBody(
  usage: StudentDashboardUsageSnapshot,
  languageCode: UiLanguageCode,
) {
  if (!usage.quota.trialStartedAt && usage.quota.planKind === "trial") {
    return "L'essai gratuit commencera avec le premier devoir enregistre.";
  }

  if (usage.quota.blockReason === "trial_window_expired") {
    return "La periode d'essai est terminee. Le prochain devoir depend maintenant d'un abonnement payeur actif.";
  }

  if (usage.quota.blockReason === "sessions") {
    return "La limite de sessions de cette periode est atteinte.";
  }

  if (usage.quota.blockReason === "uploads") {
    return "La limite d'uploads de cette periode est atteinte.";
  }

  if (usage.quota.blockReason === "assistant_messages") {
    return "La limite de messages IA de cette periode est atteinte.";
  }

  if (
    usage.quota.blockReason === "input_tokens" ||
    usage.quota.blockReason === "output_tokens"
  ) {
    return "Le budget IA de cette periode est atteint.";
  }

  if (usage.quota.planKind === "paid") {
    return usage.quota.subscriptionStatus === "past_due"
      ? "Le plan Family reste actif pour l'instant, mais la facturation parent demande une verification."
      : "Le compte travaille sur un acces Family actif pilote par un adulte payeur.";
  }

  if (usage.quota.trialEndsAt) {
    return `Essai actif jusqu'au ${formatDateLabel(
      usage.quota.trialEndsAt,
      languageCode,
    )}.`;
  }

  return "Le premier devoir fixera la date d'essai et la premiere periode d'usage.";
}

function formatBudgetLine(
  used: number,
  limit: number | null,
  languageCode: UiLanguageCode,
) {
  const formattedUsed = formatCompactNumber(used, languageCode);

  if (limit == null) {
    return `${formattedUsed} utilises`;
  }

  return `${formattedUsed} / ${formatCompactNumber(limit, languageCode)}`;
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
            {getUsageHeadline(usage)}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {formatUsagePeriod(usage, languageCode)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StudentStatusPill
            label={usage.quota.planKind === "paid" ? "Plan Family" : "Essai gratuit"}
            tone={usage.quota.planKind === "paid" ? "accent" : undefined}
          />
          <StudentStatusPill
            label={
              usage.quota.accessState === "blocked"
                ? "Bloque"
                : usage.quota.accessState === "warning"
                  ? "A surveiller"
                  : "Disponible"
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
              label={`Essai jusqu'au ${formatDateLabel(
                usage.quota.trialEndsAt,
                languageCode,
              )}`}
            />
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              Sessions
            </p>
            <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl">
              {formatBudgetLine(
                usage.sessionsCount,
                usage.quota.sessions.limit,
                languageCode,
              )}
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Restant: {formatCompactNumber(usage.quota.sessions.remaining ?? 0, languageCode)}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              Uploads
            </p>
            <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl">
              {formatBudgetLine(
                usage.uploadsCount,
                usage.quota.uploads.limit,
                languageCode,
              )}
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Restant: {formatCompactNumber(usage.quota.uploads.remaining ?? 0, languageCode)}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              Messages IA
            </p>
            <p className="mt-3 font-[family-name:var(--font-heading)] text-3xl">
              {formatBudgetLine(
                usage.assistantMessageCount,
                usage.quota.assistantMessages.limit,
                languageCode,
              )}
            </p>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Restant:{" "}
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
            Tokens entree:{" "}
            {formatBudgetLine(
              usage.inputTokens,
              usage.quota.inputTokens.limit,
              languageCode,
            )}
          </p>
          <p>
            Tokens sortie:{" "}
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
