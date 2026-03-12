import Link from "next/link";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import {
  getAdultConversationReviewCopy,
} from "@/lib/i18n/oversight-copy";
import {
  getAttachmentKindLabel,
  getAttachmentStatusLabel,
  getConversationRoleLabel,
} from "@/lib/i18n/student-flow-copy";
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
  const copy = getAdultConversationReviewCopy(languageCode);

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.1fr_0.9fr]">
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.eyebrow}
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
            {detail.conversation.title}
          </h1>
          <p className="text-sm leading-7 text-[color:var(--ink-soft)]">
            {copy.body(audienceLabel, studentName)}
          </p>
          <div className="flex flex-wrap gap-2">
            <StudentStatusPill label={studentName} tone="accent" />
            <StudentStatusPill label={detail.conversation.subject_tag} />
            <StudentStatusPill
              label={getConversationStatusLabel(
                detail.conversation.status,
                languageCode,
              )}
            />
            <StudentStatusPill
              label={
                detail.conversation.graded_homework
                  ? copy.graded
                  : copy.practice
              }
            />
          </div>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm">
          <p className="font-medium">{copy.chronologyTitle}</p>
          <p className="text-[color:var(--ink-soft)]">
            {copy.createdOn(
              formatDateLabel(detail.conversation.created_at, languageCode),
            )}
          </p>
          <p className="text-[color:var(--ink-soft)]">
            {copy.lastActivity(
              formatDateLabel(
                detail.conversation.last_message_at ??
                  detail.conversation.created_at,
                languageCode,
              ),
            )}
          </p>
          <p className="text-[color:var(--ink-soft)]">
            {detail.conversation.completed_at
              ? copy.completedOn(
                  formatDateLabel(
                    detail.conversation.completed_at,
                    languageCode,
                  ),
                )
              : copy.studentActive}
          </p>
          <Link
            className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium transition hover:-translate-y-0.5"
            href={`/app/students/${detail.conversation.student_user_id}`}
          >
            {copy.backToStudent}
          </Link>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <article className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-2">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                {copy.conversationEyebrow}
              </p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.conversationBody}
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
                      label={getConversationRoleLabel(message.role, languageCode)}
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
                {copy.workspaceEyebrow}
              </p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.workspaceBody}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <p className="font-medium">{copy.workspaceLabels.assignment}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[color:var(--ink-soft)]">
                  {detail.workspace?.assignment_text ??
                    detail.conversation.assignment_text ??
                    copy.workspaceEmpty.assignment}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <p className="font-medium">{copy.workspaceLabels.reviewedText}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[color:var(--ink-soft)]">
                  {detail.workspace?.edited_extracted_text ??
                    detail.conversation.edited_extracted_text ??
                    copy.workspaceEmpty.reviewedText}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <p className="font-medium">{copy.workspaceLabels.plan}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[color:var(--ink-soft)]">
                  {detail.workspace?.plan_text ?? copy.workspaceEmpty.plan}
                </p>
              </article>
              <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <p className="font-medium">{copy.workspaceLabels.draft}</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[color:var(--ink-soft)]">
                  {detail.workspace?.draft_answer_text ?? copy.workspaceEmpty.draft}
                </p>
              </article>
            </div>
          </article>

          <article className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-2">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                {copy.attachmentsEyebrow}
              </p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.attachmentsBody}
              </p>
            </div>

            {detail.attachments.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.noAttachments}
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
                      <StudentStatusPill
                        label={getAttachmentKindLabel(
                          attachment.attachment_kind,
                          languageCode,
                        )}
                      />
                      <StudentStatusPill
                        label={getAttachmentStatusLabel(
                          attachment.extraction_status,
                          languageCode,
                        )}
                      />
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                      {copy.attachmentMeta(
                        attachment.mime_type,
                        Math.max(1, Math.round(attachment.byte_size / 1024)),
                        attachment.page_count,
                      )}
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
