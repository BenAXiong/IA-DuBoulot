import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  getStartStateBody,
  getStartStateLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  StudentDashboardSnapshot,
  StudentDashboardSubjectRollup,
} from "@/lib/server/student-dashboard/types";

type StudentDashboardStartPanelProps = {
  snapshot: StudentDashboardSnapshot;
};

function getButtonLabel(snapshot: StudentDashboardSnapshot) {
  if (snapshot.canStartHomework) {
    return "Nouveau devoir";
  }

  if (snapshot.startState === "pending_parent_approval") {
    return "Attendre le parent";
  }

  if (snapshot.startState === "quota_blocked") {
    return "Voir le quota";
  }

  return "Depart bloque";
}

function getButtonHref(snapshot: StudentDashboardSnapshot) {
  if (snapshot.canStartHomework) {
    return "/app/new";
  }

  if (snapshot.startState === "quota_blocked") {
    return "/app#usage";
  }

  return "/app#links";
}

function getTone(snapshot: StudentDashboardSnapshot) {
  return snapshot.canStartHomework ? "accent" : "warning";
}

function renderSubjectHighlights(
  subjectRollup: StudentDashboardSubjectRollup[],
  languageCode: UiLanguageCode,
) {
  if (subjectRollup.length === 0) {
    return (
      <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
        Aucun sujet recent pour l&apos;instant. Le premier devoir fixera les tags
        les plus utiles pour la reprise de session.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {subjectRollup.slice(0, 5).map((subject) => (
        <span
          className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-2 text-sm"
          key={subject.subjectTag}
        >
          {subject.subjectTag}
          <span className="ml-2 text-[color:var(--ink-soft)]">
            {new Intl.NumberFormat(
              languageCode === "fr"
                ? "fr-FR"
                : languageCode === "en"
                  ? "en-US"
                  : "zh-TW",
            ).format(subject.count)}
          </span>
        </span>
      ))}
    </div>
  );
}

export function StudentDashboardStartPanel({
  snapshot,
}: StudentDashboardStartPanelProps) {
  return (
    <section
      className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.2fr_0.8fr]"
      id="start"
    >
      <article className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StudentStatusPill
            label={getStartStateLabel(snapshot.startState)}
            tone={getTone(snapshot)}
          />
          <StudentStatusPill
            label={
              snapshot.usage.quota.planKind === "paid"
                ? "Acces Family"
                : "Essai gratuit"
            }
          />
          <StudentStatusPill
            label={
              snapshot.support.parentalApprovalRequired
                ? "Supervision requise"
                : "Depart autonome"
            }
          />
          <StudentStatusPill
            label={`${snapshot.recentSessions.length} session${snapshot.recentSessions.length > 1 ? "s" : ""} recente${snapshot.recentSessions.length > 1 ? "s" : ""}`}
          />
        </div>

        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Point de depart eleve
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
            {snapshot.canStartHomework
              ? "Le prochain devoir commence ici."
              : "Le prochain devoir attend encore un jalon de confiance."}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
            {getStartStateBody(snapshot.startState)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            aria-disabled={!snapshot.canStartHomework}
            className={`inline-flex rounded-full px-5 py-3 text-sm font-medium transition ${
              snapshot.canStartHomework
                ? "bg-[color:var(--accent)] text-white hover:-translate-y-0.5"
                : "cursor-not-allowed border border-[rgba(208,124,91,0.4)] bg-[#fff0ea] text-[#8d3b1f]"
            }`}
            href={getButtonHref(snapshot)}
          >
            {getButtonLabel(snapshot)}
          </Link>
          <p className="text-sm text-[color:var(--ink-soft)]">
            Route canonique: <code>/app/new</code>
          </p>
        </div>
      </article>

      <article className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
        <div className="space-y-2">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            Matieres recentes
          </p>
          <h3 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
            Les prochains raccourcis d&apos;intake partiront des sujets deja vus.
          </h3>
        </div>

        {renderSubjectHighlights(
          snapshot.subjectRollup,
          snapshot.appUser.preferred_ui_language,
        )}

        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          Le formulaire d&apos;intake detaille est maintenant relie au quota et a
          la facturation sans changer la route canonique d&apos;entree eleve.
        </p>
      </article>
    </section>
  );
}
