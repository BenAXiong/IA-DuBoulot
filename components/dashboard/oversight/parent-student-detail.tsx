import Link from "next/link";
import { TutorInviteForm } from "@/components/links/tutor-invite-form";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ParentStudentDetail } from "@/lib/server/oversight/types";

type ParentStudentDetailProps = {
  detail: ParentStudentDetail;
  languageCode: UiLanguageCode;
};

export function ParentStudentDetailView({
  detail,
  languageCode,
}: ParentStudentDetailProps) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.08fr_0.92fr]">
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Suivi parent
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
            {detail.student.displayName}
          </h1>
          <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
            Vue parent orientee supervision: sessions recentes, resume hebdo et
            lien tuteur si besoin.
          </p>
          <div className="flex flex-wrap gap-2">
            {detail.relationshipLabel ? (
              <StudentStatusPill label={detail.relationshipLabel} tone="accent" />
            ) : null}
            <StudentStatusPill label={detail.student.accountStatus} />
            {detail.student.ageBand ? (
              <StudentStatusPill label={detail.student.ageBand} />
            ) : null}
            {detail.student.isUnder13 ? (
              <StudentStatusPill label="Moins de 13 ans" tone="warning" />
            ) : null}
          </div>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm">
          <p className="font-medium">Resume 7 jours</p>
          <p className="text-[color:var(--ink-soft)]">
            {detail.weeklySummary.completedSessionCount} session(s) terminee(s)
          </p>
          <p className="text-[color:var(--ink-soft)]">
            Fenetre: {formatDateLabel(detail.weeklySummary.windowStart, languageCode)} {"->"}{" "}
            {formatDateLabel(detail.weeklySummary.windowEnd, languageCode)}
          </p>
          <Link
            className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
            href="/app"
          >
            Retour au dashboard parent
          </Link>
          <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/80 px-4 py-3">
            <p className="font-medium">
              {detail.student.usage.quota.planKind === "paid"
                ? "Acces Family"
                : "Essai gratuit"}
            </p>
            <p className="mt-2 text-[color:var(--ink-soft)]">
              Sessions {detail.student.usage.sessionsCount}/
              {detail.student.usage.quota.sessions.limit} | Uploads{" "}
              {detail.student.usage.uploadsCount}/
              {detail.student.usage.quota.uploads.limit}
            </p>
            <p className="mt-2 text-[color:var(--ink-soft)]">
              Etat quota:{" "}
              {detail.student.usage.quota.accessState === "blocked"
                ? "bloque"
                : detail.student.usage.quota.accessState === "warning"
                  ? "a surveiller"
                  : "disponible"}
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-6">
          <section className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                Sessions recentes
              </p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                Ouvre une session pour consulter le resume parent et le transcript en lecture seule.
              </p>
            </div>

            {detail.recentSessions.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                Aucune session visible pour cet eleve.
              </div>
            ) : (
              <div className="grid gap-3">
                {detail.recentSessions.map((session) => (
                  <article
                    className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 md:grid-cols-[1fr_auto]"
                    key={session.id}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <StudentStatusPill label={session.subjectTag} tone="accent" />
                        <StudentStatusPill label={getConversationStatusLabel(session.status)} />
                        {session.summaryLanguage ? (
                          <StudentStatusPill label={`Resume ${session.summaryLanguage.toUpperCase()}`} />
                        ) : null}
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

        <div className="grid gap-6">
          <section className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                Rythme hebdo
              </p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                Le resume hebdomadaire reprend le volume recent et la prochaine etape proposee.
              </p>
            </div>

            {detail.weeklySummary.studentSnapshots.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                Aucune session terminee sur cette fenetre.
              </div>
            ) : (
              detail.weeklySummary.studentSnapshots.map((snapshot) => (
                <article
                  className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
                  key={snapshot.studentUserId}
                >
                  <div className="flex flex-wrap gap-2">
                    <StudentStatusPill label={`${snapshot.completedSessionCount} session(s)`} tone="accent" />
                  </div>
                  <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                    {snapshot.latestSummaryText ?? "Aucun resume parent recent."}
                  </p>
                  {snapshot.nextStepRecommendation ? (
                    <p className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                      Prochaine etape: {snapshot.nextStepRecommendation}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </section>

          <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <TutorInviteForm studentUserId={detail.student.id} />
          </section>
        </div>
      </section>
    </div>
  );
}
