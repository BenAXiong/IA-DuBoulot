"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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

function isPreviewableAttachment(attachment: ConversationAttachmentRecord) {
  return (
    attachment.mime_type.startsWith("image/") ||
    attachment.attachment_kind === "image" ||
    attachment.attachment_kind === "screenshot"
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
  const [previewAttachment, setPreviewAttachment] =
    useState<ConversationAttachmentRecord | null>(null);
  const [expandedPreviewAttachment, setExpandedPreviewAttachment] =
    useState<ConversationAttachmentRecord | null>(null);

  useEffect(() => {
    if (!previewAttachment) {
      return;
    }

    const stillExists = attachments.some(
      (attachment) => attachment.id === previewAttachment.id,
    );

    if (!stillExists) {
      setPreviewAttachment(null);
      setExpandedPreviewAttachment(null);
    }
  }, [attachments, previewAttachment]);

  useEffect(() => {
    if (!expandedPreviewAttachment) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpandedPreviewAttachment(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedPreviewAttachment]);

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
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-3 pr-1">
          {attachments.length === 0 ? (
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.noFilesUploaded}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => {
                const isPending = pendingAttachmentId === attachment.id;
                const isPreviewable = isPreviewableAttachment(attachment);

                return (
                  <div
                    className="group relative inline-flex max-w-full items-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] pr-8 text-xs text-[color:var(--foreground)]"
                    key={attachment.id}
                  >
                    {isPreviewable ? (
                      <button
                        className="min-w-0 rounded-full px-3 py-1.5 text-left transition hover:text-[color:var(--foreground)]"
                        onClick={() => setPreviewAttachment(attachment)}
                        title={copy.previewImage}
                        type="button"
                      >
                        <span className="block max-w-[11rem] truncate">
                          {attachment.original_filename}
                        </span>
                      </button>
                    ) : (
                      <span className="block max-w-[11rem] truncate px-3 py-1.5">
                        {attachment.original_filename}
                      </span>
                    )}
                    <button
                      aria-label={copy.removeAttachment}
                      className="absolute right-2 inline-flex h-4 w-4 items-center justify-center rounded-full text-[color:var(--ink-soft)] opacity-0 transition hover:text-[#c95f44] group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={disabled || isPending}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleRemoveAttachment(attachment.id);
                      }}
                      type="button"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {previewAttachment ? (
            <div className="group relative overflow-hidden rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)]">
              <button
                aria-label={copy.expandPreview}
                className="absolute right-3 top-3 z-10 inline-flex min-h-9 items-center rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/70 focus-visible:opacity-100"
                onClick={() => setExpandedPreviewAttachment(previewAttachment)}
                type="button"
              >
                {copy.expandPreview}
              </button>
              <div className="relative aspect-[4/3] w-full bg-black/25">
                <Image
                  alt={previewAttachment.original_filename}
                  className="object-contain"
                  fill
                  sizes="(min-width: 1280px) 30vw, 100vw"
                  src={`/api/attachments/${previewAttachment.id}/access`}
                  unoptimized
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 pt-4">
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

      {expandedPreviewAttachment ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6"
          onClick={() => setExpandedPreviewAttachment(null)}
          role="presentation"
        >
          <div
            className="relative max-h-full max-w-[min(90vw,72rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label={copy.closePreview}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white transition hover:bg-black/70"
              onClick={() => setExpandedPreviewAttachment(null)}
              type="button"
            >
              <CloseIcon />
            </button>
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/35 shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
              <Image
                alt={expandedPreviewAttachment.original_filename}
                className="block max-h-[82vh] w-auto max-w-[min(88vw,68rem)] object-contain"
                height={1200}
                src={`/api/attachments/${expandedPreviewAttachment.id}/access`}
                unoptimized
                width={1600}
              />
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
