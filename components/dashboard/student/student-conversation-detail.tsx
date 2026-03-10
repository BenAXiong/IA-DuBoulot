import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ConversationDetail } from "@/lib/server/conversations/types";

type StudentConversationDetailProps = {
  detail: ConversationDetail;
  languageCode: UiLanguageCode;
};

function formatMessageRole(role: "student" | "assistant" | "system") {
  switch (role) {
    case "student":
      return "Eleve";
    case "assistant":
      return "Assistant";
    case "system":
      return "Systeme";
    default:
      return "Message";
  }
}

export function StudentConversationDetail({
  detail,
  languageCode,
}: StudentConversationDetailProps) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.15fr_0.85fr]">
        <article className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StudentStatusPill label={detail.conversation.subject_tag} tone="accent" />
            <StudentStatusPill
              label={getConversationStatusLabel(detail.conversation.status)}
            />
            <StudentStatusPill
              label={detail.conversation.graded_homework ? "Notee" : "Exercice libre"}
            />
          </div>

          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              Session brouillon
            </p>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
              {detail.conversation.title}
            </h1>
            <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
              Le cadrage du devoir est maintenant persiste. Le vrai chat et les
              actions de coaching arriveront dans `A3.4`.
            </p>
          </div>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm">
          <p className="font-medium">Reprise</p>
          <p className="text-[color:var(--ink-soft)]">
            Cree le {formatDateLabel(detail.conversation.created_at, languageCode)}
          </p>
          <p className="text-[color:var(--ink-soft)]">
            Derniere activite le{" "}
            {formatDateLabel(
              detail.conversation.last_message_at ?? detail.conversation.created_at,
              languageCode,
            )}
          </p>
          <Link
            className="mt-2 inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
            href="/app/new"
          >
            Nouveau devoir
          </Link>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              Historique de session
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
              Le premier message garde le cadrage du devoir et les references de pieces.
            </h2>
          </div>

          <div className="grid gap-4">
            {detail.messages.map((message) => (
              <article
                className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
                key={message.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <StudentStatusPill label={formatMessageRole(message.role)} />
                    <StudentStatusPill
                      label={
                        formatDateLabel(message.created_at, languageCode) ??
                        "Date indisponible"
                      }
                    />
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground)]">
                  {message.content_text}
                </p>
              </article>
            ))}
          </div>
        </article>

        <article className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              Espace de travail
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
              Le brouillon relu est deja stocke pour la reprise.
            </h2>
          </div>

          <div className="grid gap-4 text-sm leading-7 text-[color:var(--ink-soft)]">
            <section className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <p className="font-medium text-[color:var(--foreground)]">Texte fourni</p>
              <p className="mt-2 whitespace-pre-wrap">
                {detail.workspace?.assignment_text ?? detail.conversation.assignment_text ?? "Aucun texte fourni."}
              </p>
            </section>

            <section className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <p className="font-medium text-[color:var(--foreground)]">Texte relu</p>
              <p className="mt-2 whitespace-pre-wrap">
                {detail.workspace?.edited_extracted_text ??
                  detail.conversation.edited_extracted_text ??
                  "Aucun texte relu."}
              </p>
            </section>

            <section className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <p className="font-medium text-[color:var(--foreground)]">
                References de pieces
              </p>
              <p className="mt-2 whitespace-pre-wrap">
                {detail.workspace?.student_notes ??
                  "Aucune reference de fichier persistante pour cette session."}
              </p>
            </section>
          </div>
        </article>
      </section>
    </div>
  );
}
