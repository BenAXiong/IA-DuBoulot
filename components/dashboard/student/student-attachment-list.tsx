import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  getAttachmentKindLabel,
  getAttachmentStatusLabel,
  getStudentAttachmentListCopy,
} from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type StudentAttachmentListProps = {
  attachments: ConversationAttachmentRecord[];
  languageCode: UiLanguageCode;
  disabled?: boolean;
  onRetryExtraction: (attachmentId: string) => void;
};

export function StudentAttachmentList({
  attachments,
  languageCode,
  disabled = false,
  onRetryExtraction,
}: StudentAttachmentListProps) {
  const copy = getStudentAttachmentListCopy(languageCode);

  if (attachments.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
        {copy.empty}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {attachments.map((attachment) => (
        <article
          className="grid gap-3 rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4"
          key={attachment.id}
        >
          <div className="flex flex-wrap gap-2">
            <StudentStatusPill
              label={getAttachmentKindLabel(
                attachment.attachment_kind,
                languageCode,
              )}
              tone="accent"
            />
            <StudentStatusPill
              label={getAttachmentStatusLabel(
                attachment.extraction_status,
                languageCode,
              )}
            />
          </div>

          <div className="space-y-2">
            <p className="font-medium">{attachment.original_filename}</p>
            {attachment.raw_extracted_text ? (
              <p className="line-clamp-4 text-sm leading-6 text-[color:var(--ink-soft)]">
                {attachment.raw_extracted_text}
              </p>
            ) : (
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.noExtractedText}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
              href={`/api/attachments/${attachment.id}/access`}
              rel="noreferrer"
              target="_blank"
            >
              {copy.open}
            </a>
            {attachment.extraction_status === "failed" ? (
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={disabled}
                onClick={() => onRetryExtraction(attachment.id)}
                type="button"
              >
                {copy.retryExtraction}
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
