import Link from "next/link";
import { TutorNotesPanel } from "@/components/dashboard/oversight/tutor-notes-panel";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { TutorStudentDetail } from "@/lib/server/oversight/types";

type TutorStudentDetailProps = {
  detail: TutorStudentDetail;
  languageCode: UiLanguageCode;
};

export function TutorStudentDetailView({
  detail,
  languageCode,
}: TutorStudentDetailProps) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.08fr_0.92fr]">
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Suivi tuteur
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
            {detail.student.displayName}
          </h1>
          <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
            Vue tuteur orientee progression: sessions recentes, fragilites
            recurrentes et notes privees invisibles a l&apos;eleve.
          </p>
          <div className="flex flex-wrap gap-2">
            <StudentStatusPill label={detail.student.accountStatus} tone="accent" />
            <StudentStatusPill label={`${detail.student.recentSessionCount} session(s)`} />
            <StudentStatusPill label={`${detail.student.pinnedNoteCount} note(s) epinglee(s)`} tone="warning" />
          </div>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm">
          <p className="font-medium">Fragilites observees</p>
          {detail.insight.topWeaknessTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {detail.insight.topWeaknessTags.map((tag) => (
                <StudentStatusPill key={tag} label={tag} tone="warning" />
              ))}
            </div>
          ) : (
            <p className="text-[color:var(--ink-soft)]">
              Aucun tag faible consolide pour l&apos;instant.
            </p>
          )}
          <Link
            className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
            href="/app"
          >
            Retour au dashboard tuteur
          </Link>
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
                Ouvre une session pour lire le transcript, la synthese tuteur et
                ajouter une note liee a cette seance si besoin.
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
                        {session.weaknessTags.map((tag) => (
                          <StudentStatusPill key={tag} label={tag} tone="warning" />
                        ))}
                      </div>
                      <div>
                        <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                          {session.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                          {session.nextStepRecommendation ??
                            "Aucune recommandation tuteur n'est encore disponible."}
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
                Prochains sujets
              </p>
              {detail.insight.recommendedNextTopics.length > 0 ? (
                <div className="grid gap-3">
                  {detail.insight.recommendedNextTopics.map((topic) => (
                    <div
                      className="rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]"
                      key={topic}
                    >
                      {topic}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                  Les recommandations apparaitront ici quand des syntheses tuteur
                  auront ete generees sur plusieurs sessions.
                </div>
              )}
            </div>
          </section>

          <TutorNotesPanel
            body="Ces notes restent invisibles pour l'eleve et pour le parent. Utilise-les pour garder des hypotheses pedagogiques et une trace des prochaines interventions."
            initialNotes={detail.notes}
            studentUserId={detail.student.id}
            title="Notes privees du suivi"
          />
        </div>
      </section>
    </div>
  );
}
