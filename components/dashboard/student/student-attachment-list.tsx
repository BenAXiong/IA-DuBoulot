import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";

type StudentAttachmentListProps = {
  attachments: ConversationAttachmentRecord[];
  disabled?: boolean;
  onRetryExtraction: (attachmentId: string) => void;
};

function getAttachmentStatusLabel(attachment: ConversationAttachmentRecord) {
  if (attachment.extraction_status === "ready") {
    return "Extrait";
  }

  if (attachment.extraction_status === "failed") {
    return "A relire";
  }

  return "Analyse";
}

export function StudentAttachmentList({
  attachments,
  disabled = false,
  onRetryExtraction,
}: StudentAttachmentListProps) {
  if (attachments.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4 text-sm leading-6 text-[color:var(--ink-soft)]">
        Les pieces jointes confirmees apparaitront ici avec leur statut
        d&apos;extraction.
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
            <StudentStatusPill label={attachment.attachment_kind} tone="accent" />
            <StudentStatusPill label={getAttachmentStatusLabel(attachment)} />
          </div>

          <div className="space-y-2">
            <p className="font-medium">{attachment.original_filename}</p>
            {attachment.raw_extracted_text ? (
              <p className="line-clamp-4 text-sm leading-6 text-[color:var(--ink-soft)]">
                {attachment.raw_extracted_text}
              </p>
            ) : (
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                Aucun texte exploitable n&apos;a encore ete sauve pour cette piece.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
              href={`/api/attachments/${attachment.id}/access`}
              rel="noreferrer"
              target="_blank"
            >
              Ouvrir
            </a>
            {attachment.extraction_status === "failed" ? (
              <button
                className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={disabled}
                onClick={() => onRetryExtraction(attachment.id)}
                type="button"
              >
                Relancer l&apos;extraction
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
