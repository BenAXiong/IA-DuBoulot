import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { TutorDashboardSnapshot } from "@/lib/server/oversight/types";

type TutorDashboardProps = {
  snapshot: TutorDashboardSnapshot;
  languageCode: UiLanguageCode;
};

export function TutorDashboard({
  snapshot,
  languageCode,
}: TutorDashboardProps) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="overview">
        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            Liens
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {snapshot.linkedStudents.length} eleve(s) suivi(s)
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Les invitations tuteur debouchent maintenant sur un vrai suivi eleve
            et sur des notes privees persistantes.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            Sessions
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {snapshot.recentSessions.length} session(s) recente(s)
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Les syntheses tuteur et leurs tags faibles deviennent la vue d&apos;entree pedagogique.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            Notes
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            Notes privees actives
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Les notes restent invisibles pour l&apos;eleve et le parent, avec audit a chaque mutation.
          </p>
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
              Chaque fiche mene vers le detail eleve avec vues de sessions, tags faibles et notes privees.
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
                    <StudentStatusPill label={`${student.recentSessionCount} session(s)`} />
                    <StudentStatusPill label={`${student.pinnedNoteCount} note(s)`} tone="warning" />
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                      {student.displayName}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {student.topWeaknessTags.length > 0 ? (
                        student.topWeaknessTags.map((tag) => (
                          <StudentStatusPill key={tag} label={tag} tone="warning" />
                        ))
                      ) : (
                        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                          Aucun tag faible consolide.
                        </p>
                      )}
                    </div>
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
              Sessions a revoir
            </p>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              Les sessions recentes remontent avec les insights tuteur deja disponibles.
            </p>
          </div>

          {snapshot.recentSessions.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
              Aucune session recente visible.
            </div>
          ) : (
            snapshot.recentSessions.slice(0, 4).map((session) => (
              <article
                className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
                key={session.id}
              >
                <div className="flex flex-wrap gap-2">
                  <StudentStatusPill label={session.studentDisplayName} tone="accent" />
                  <StudentStatusPill label={session.subjectTag} />
                </div>
                <p className="font-medium">{session.title}</p>
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  {session.nextStepRecommendation ??
                    "Aucune recommandation tuteur disponible."}
                </p>
                <p className="text-sm text-[color:var(--ink-soft)]">
                  {formatDateLabel(
                    session.lastMessageAt ?? session.createdAt,
                    languageCode,
                  ) ?? "Date indisponible"}
                </p>
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
            Cette liste traverse tous les eleves lies et mene vers la relecture tuteur et les notes de seance.
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
                    {session.weaknessTags.map((tag) => (
                      <StudentStatusPill key={tag} label={tag} tone="warning" />
                    ))}
                  </div>
                  <div>
                    <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
                      {session.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                      {session.summaryText ??
                        "Aucune synthese tuteur n'est encore disponible pour cette session."}
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
