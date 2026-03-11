import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ParentDashboardSnapshot } from "@/lib/server/oversight/types";

type ParentDashboardProps = {
  snapshot: ParentDashboardSnapshot;
  languageCode: UiLanguageCode;
};

function buildBillingBody(snapshot: ParentDashboardSnapshot["billing"]) {
  if (!snapshot.hasSubscription) {
    return "Aucun abonnement payeur enregistre pour ce compte parent.";
  }

  return `Plan ${snapshot.planKey ?? "inconnu"} | statut ${snapshot.status ?? "inconnu"}`;
}

function getQuotaLabel(
  usage: ParentDashboardSnapshot["linkedStudents"][number]["usage"],
) {
  if (usage.quota.accessState === "blocked") {
    return "Quota bloque";
  }

  if (usage.quota.accessState === "warning") {
    return "Quota a surveiller";
  }

  return usage.quota.planKind === "paid" ? "Acces Family" : "Essai actif";
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
            Supervision
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {snapshot.linkedStudents.length} eleve(s) lie(s)
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Le dashboard parent sert maintenant de point d&apos;entree aux suivis
            eleve et aux sessions consultees en lecture seule.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            Quotas
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {blockedStudents} eleve(s) bloque(s)
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {warningStudents} eleve(s) demandent un suivi rapide avant le prochain
            blocage d&apos;essai ou de budget.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            Facturation
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {snapshot.billing.hasSubscription ? "Statut visible" : "Pas encore liee"}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            {buildBillingBody(snapshot.billing)}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <form action="/api/billing/checkout" method="POST">
              <input name="planKey" type="hidden" value="family_monthly" />
              <button
                className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                type="submit"
              >
                {snapshot.billing.hasSubscription
                  ? "Reprendre la gestion"
                  : "Activer Family"}
              </button>
            </form>
            {snapshot.billing.hasSubscription ? (
              <form action="/api/billing/portal" method="POST">
                <button
                  className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                  type="submit"
                >
                  Portail billing
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
              Eleves lies
            </p>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              Chaque fiche mene vers la vue parent detaillee, puis vers les
              sessions individuelles avec resume traduit si disponible.
            </p>
          </div>

          {snapshot.linkedStudents.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
              Aucun eleve lie pour l&apos;instant.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {snapshot.linkedStudents.map((student) => (
                <article
                  className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
                  key={student.id}
                >
                  <div className="flex flex-wrap gap-2">
                    <StudentStatusPill label={student.accountStatus} tone="accent" />
                    {student.ageBand ? <StudentStatusPill label={student.ageBand} /> : null}
                    {student.isUnder13 ? (
                      <StudentStatusPill label="Moins de 13 ans" tone="warning" />
                    ) : null}
                    <StudentStatusPill
                      label={getQuotaLabel(student.usage)}
                      tone={getQuotaTone(student.usage)}
                    />
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                      {student.displayName}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                      Interface {student.preferredUiLanguage.toUpperCase()} | sessions{" "}
                      {student.usage.sessionsCount}/{student.usage.quota.sessions.limit}
                    </p>
                  </div>
                  <Link
                    className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
                    href={`/app/students/${student.id}`}
                  >
                    Ouvrir le suivi
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              Resume hebdomadaire
            </p>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              Fenetre {formatDateLabel(snapshot.weeklySummary.windowStart, languageCode)} {"->"}{" "}
              {formatDateLabel(snapshot.weeklySummary.windowEnd, languageCode)}
            </p>
          </div>

          {snapshot.weeklySummary.studentSnapshots.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
              Aucune activite terminee cette semaine.
            </div>
          ) : (
            snapshot.weeklySummary.studentSnapshots.map((student) => (
              <article
                className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
                key={student.studentUserId}
              >
                <div className="flex flex-wrap gap-2">
                  <StudentStatusPill label={student.studentDisplayName} tone="accent" />
                  <StudentStatusPill label={`${student.completedSessionCount} session(s)`} />
                </div>
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  {student.latestSummaryText ?? "Aucun resume parent recent."}
                </p>
                {student.nextStepRecommendation ? (
                  <p className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                    Prochaine etape: {student.nextStepRecommendation}
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
            Sessions recentes
          </p>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            Cette liste traverse tous les eleves lies et mene directement vers la
            relecture parent en lecture seule.
          </p>
        </div>

        {snapshot.recentSessions.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
            Aucune session visible pour l&apos;instant.
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
                    <StudentStatusPill label={getConversationStatusLabel(session.status)} />
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                      {session.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                      {session.nextStepRecommendation ??
                        "Aucune recommandation parent n'est encore disponible."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-[color:var(--ink-soft)] md:justify-items-end">
                  <p>
                    {formatDateLabel(
                      session.lastMessageAt ?? session.createdAt,
                      languageCode,
                    ) ?? "Date indisponible"}
                  </p>
                  <Link
                    className="inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                    href={`/app/review/${session.id}`}
                  >
                    Ouvrir
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
