import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ConversationDetail } from "@/lib/server/conversations/types";

type AdultConversationReviewProps = {
  detail: ConversationDetail;
  studentName: string;
  languageCode: UiLanguageCode;
  audienceLabel: string;
  summaryPanel: React.ReactNode;
  secondaryPanel?: React.ReactNode;
};

function getMessageRoleTone(role: "student" | "assistant" | "system") {
  if (role === "assistant") {
    return "accent" as const;
  }

  if (role === "system") {
    return "warning" as const;
  }

  return "neutral" as const;
}

export function AdultConversationReview({
  detail,
  studentName,
  languageCode,
  audienceLabel,
  summaryPanel,
  secondaryPanel,
}: AdultConversationReviewProps) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.1fr_0.9fr]">
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Relecture adulte
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
            {detail.conversation.title}
          </h1>
          <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
            {audienceLabel} sur la session de {studentName}. La lecture reste
            strictement consultative pour respecter les frontieres d&apos;acces.
          </p>
          <div className="flex flex-wrap gap-2">
            <StudentStatusPill label={studentName} tone="accent" />
            <StudentStatusPill label={detail.conversation.subject_tag} />
            <StudentStatusPill
              label={getConversationStatusLabel(detail.conversation.status)}
            />
            <StudentStatusPill
              label={
                detail.conversation.graded_homework ? "Devoir note" : "Exercice libre"
              }
            />
          </div>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm">
          <p className="font-medium">Chronologie</p>
          <p className="text-[color:var(--ink-soft)]">
            Creee le {formatDateLabel(detail.conversation.created_at, languageCode)}
          </p>
          <p className="text-[color:var(--ink-soft)]">
            Derniere activite:{" "}
            {formatDateLabel(
              detail.conversation.last_message_at ?? detail.conversation.created_at,
              languageCode,
            )}
          </p>
          <p className="text-[color:var(--ink-soft)]">
            {detail.conversation.completed_at
              ? `Cloturee le ${formatDateLabel(detail.conversation.completed_at, languageCode)}`
              : "Session encore active cote eleve."}
          </p>
          <Link
            className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
            href={`/app/students/${detail.conversation.student_user_id}`}
          >
            Retour au suivi eleve
          </Link>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <article className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-2">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                Conversation
              </p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                Transcript de travail en lecture seule.
              </p>
            </div>

            <div className="grid gap-3">
              {detail.messages.map((message) => (
                <article
                  className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
                  key={message.id}
                >
                  <div className="flex flex-wrap gap-2">
                    <StudentStatusPill
                      label={message.role}
                      tone={getMessageRoleTone(message.role)}
                    />
                    {message.content_language ? (
                      <StudentStatusPill label={message.content_language.toUpperCase()} />
                    ) : null}
                  </div>
                  <p className="whitespace-pre-line text-sm leading-6 text-[color:var(--foreground)]">
                    {message.content_text}
                  </p>
                </article>
              ))}
            </div>
          </article>

          <article className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-2">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                Espace de travail
              </p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                Lecture du brouillon et des notes sauvegardees pendant la session.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <p className="font-medium">Consigne</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[color:var(--ink-soft)]">
                  {detail.workspace?.assignment_text ??
                    detail.conversation.assignment_text ??
                    "Aucune consigne sauvegardee."}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <p className="font-medium">Texte relu</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[color:var(--ink-soft)]">
                  {detail.workspace?.edited_extracted_text ??
                    detail.conversation.edited_extracted_text ??
                    "Aucun texte relu sauvegarde."}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <p className="font-medium">Plan</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[color:var(--ink-soft)]">
                  {detail.workspace?.plan_text ?? "Aucun plan note."}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <p className="font-medium">Brouillon</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[color:var(--ink-soft)]">
                  {detail.workspace?.draft_answer_text ?? "Aucun brouillon sauvegarde."}
                </p>
              </article>
            </div>
          </article>

          <article className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-2">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                Pieces jointes
              </p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                Les fichiers restent prives; cette vue montre seulement leurs metadonnees et l&apos;etat d&apos;extraction.
              </p>
            </div>

            {detail.attachments.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                Aucune piece jointe pour cette session.
              </div>
            ) : (
              <div className="grid gap-3">
                {detail.attachments.map((attachment) => (
                  <article
                    className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5"
                    key={attachment.id}
                  >
                    <div className="flex flex-wrap gap-2">
                      <StudentStatusPill label={attachment.original_filename} tone="accent" />
                      <StudentStatusPill label={attachment.attachment_kind} />
                      <StudentStatusPill label={attachment.extraction_status} />
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                      {attachment.mime_type} | {Math.max(1, Math.round(attachment.byte_size / 1024))} KB
                      {attachment.page_count ? ` | ${attachment.page_count} page(s)` : ""}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>

        <div className="grid gap-6">
          {summaryPanel}
          {secondaryPanel}
        </div>
      </section>
    </div>
  );
}
