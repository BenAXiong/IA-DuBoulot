"use client";

import { useState } from "react";
import { getStudentWorkbenchCopy } from "@/lib/i18n/student-flow-copy";
import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type StudentConversationSideRailProps = {
  attachments: ConversationAttachmentRecord[];
  languageCode: UiLanguageCode;
  disabled?: boolean;
  isCompleting?: boolean;
  onComplete: () => void;
  onRemoveAttachment: (attachmentId: string) => void;
};

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 7 17 17M17 7 7 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function StudentConversationSideRail({
  attachments,
  languageCode,
  disabled = false,
  isCompleting = false,
  onComplete,
  onRemoveAttachment,
}: StudentConversationSideRailProps) {
  const copy = getStudentWorkbenchCopy(languageCode);
  const [pendingAttachmentId, setPendingAttachmentId] = useState<string | null>(
    null,
  );

  async function handleRemoveAttachment(attachmentId: string) {
    const confirmed = window.confirm(copy.removeAttachmentConfirm);
    if (!confirmed) {
      return;
    }

    setPendingAttachmentId(attachmentId);

    try {
      await onRemoveAttachment(attachmentId);
    } finally {
      setPendingAttachmentId(null);
    }
  }

  return (
    <aside className="flex min-h-full flex-1 flex-col">
      <div className="space-y-3">
        {attachments.length === 0 ? (
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.noFilesUploaded}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => {
              const isPending = pendingAttachmentId === attachment.id;

              return (
                <span
                  className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-xs text-[color:var(--foreground)]"
                  key={attachment.id}
                >
                  <span className="max-w-[11rem] truncate">
                    {attachment.original_filename}
                  </span>
                  <button
                    aria-label={copy.removeAttachment}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[color:var(--ink-soft)] opacity-0 transition hover:text-[#c95f44] group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={disabled || isPending}
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    type="button"
                  >
                    <CloseIcon />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4">
        <button
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[color:var(--foreground)] px-5 py-3 text-sm font-medium text-[color:var(--background)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || isCompleting}
          onClick={onComplete}
          title={copy.completeTooltip}
          type="button"
        >
          {copy.completeButton}
        </button>
      </div>
    </aside>
  );
}
