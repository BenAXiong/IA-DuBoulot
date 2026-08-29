"use client";

import { useEffect, useRef } from "react";
import { StudentReplyModeSwitch } from "@/components/dashboard/student/student-reply-mode-switch";
import { StudentUploadProgressRing } from "@/components/dashboard/student/student-upload-progress-ring";
import { extractClipboardFiles } from "@/lib/intake/intake-config";
import { getStudentConversationComposerCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { StudentReplyMode } from "@/lib/server/conversations/types";
import type { ConversationUploadPhase } from "@/lib/uploads/client-upload";

type StudentConversationComposerProps = {
  composerText: string;
  languageCode: UiLanguageCode;
  replyMode: StudentReplyMode;
  disabled?: boolean;
  isUploading?: boolean;
  isSending?: boolean;
  uploadProgress?: {
    phase: ConversationUploadPhase;
    completedPhases: number;
    totalPhases: number;
  } | null;
  onComposerTextChange: (value: string) => void;
  onReplyModeChange: (mode: StudentReplyMode) => void;
  onPasteAttachments: (files: File[]) => void;
  onSendMessage: () => void;
  onUploadAttachments: () => void;
};

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 4.75a2.75 2.75 0 0 1 2.75 2.75v4.25a2.75 2.75 0 1 1-5.5 0V7.5A2.75 2.75 0 0 1 12 4.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M7.75 10.75v.75a4.25 4.25 0 0 0 8.5 0v-.75M12 15.75v3.5M9.25 19.25h5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m5 12 13-7-3.5 14-2.5-5-7-2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M11.5 13.5 18 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function getCompletedUploadSegments(
  progress: NonNullable<StudentConversationComposerProps["uploadProgress"]>,
): 1 | 2 | 3 {
  const phaseIndex =
    progress.phase === "prepare" ? 0 : progress.phase === "upload" ? 1 : 2;
  const completedSegments = Math.min(
    3,
    Math.max(
      1,
      Math.ceil(
        ((progress.completedPhases + phaseIndex + 1) / progress.totalPhases) * 3,
      ),
    ),
  );

  if (completedSegments === 1 || completedSegments === 2) {
    return completedSegments;
  }

  return 3;
}

export function StudentConversationComposer({
  composerText,
  languageCode,
  replyMode,
  disabled = false,
  isUploading = false,
  isSending = false,
  uploadProgress = null,
  onComposerTextChange,
  onReplyModeChange,
  onPasteAttachments,
  onSendMessage,
  onUploadAttachments,
}: StudentConversationComposerProps) {
  const copy = getStudentConversationComposerCopy(languageCode);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, 224);
    textarea.style.height = `${Math.max(nextHeight, 24)}px`;
  }, [composerText]);

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter" || !event.ctrlKey) {
      return;
    }

    event.preventDefault();

    if (disabled || isSending || isUploading || composerText.trim().length === 0) {
      return;
    }

    onSendMessage();
  }

  function handleComposerPaste(
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) {
    const files = extractClipboardFiles(event.clipboardData);

    if (files.length === 0 || disabled) {
      return;
    }

    event.preventDefault();
    onPasteAttachments(files);
  }

  return (
    <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-2.5 py-2">
      <textarea
        className="student-chat-textarea min-h-6 w-full resize-none overflow-y-hidden bg-transparent px-1 py-0 text-sm leading-6 placeholder:text-[color:var(--ink-soft)]"
        disabled={disabled || isSending}
        onChange={(event) => onComposerTextChange(event.target.value)}
        onKeyDown={handleComposerKeyDown}
        onPaste={handleComposerPaste}
        placeholder={copy.placeholder}
        ref={textareaRef}
        rows={1}
        value={composerText}
      />

      <div className="flex items-center justify-between gap-3 px-0.5 pt-1">
        <div className="flex items-center gap-2">
          <button
            aria-label={copy.addAttachment}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-strong)] focus:shadow-none focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || isSending || isUploading}
            onClick={onUploadAttachments}
            title={copy.addAttachment}
            type="button"
          >
            <PlusIcon />
          </button>
          <StudentReplyModeSwitch
            disabled={disabled || isSending}
            languageCode={languageCode}
            mode={replyMode}
            onModeChange={onReplyModeChange}
          />
          <button
            aria-label={copy.voice}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-strong)] focus:shadow-none focus-visible:shadow-none"
            disabled
            title={copy.voice}
            type="button"
          >
            <MicIcon />
          </button>
        </div>

        <span
          className="inline-flex"
          title={
            isUploading ? copy.uploadInProgressTooltip : undefined
          }
        >
          <button
            aria-label={
              isUploading ? copy.uploadInProgressTooltip : isSending ? copy.sending : copy.send
            }
            className="inline-flex h-11 w-11 items-center justify-center text-[color:var(--foreground)] transition hover:text-[color:var(--accent)] focus:shadow-none focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
            disabled={
              disabled || isSending || isUploading || composerText.trim().length === 0
            }
            onClick={onSendMessage}
            type="button"
          >
            {isUploading ? (
              <span className={uploadProgress ? undefined : "opacity-60"}>
                <StudentUploadProgressRing
                  completedSegments={
                    uploadProgress ? getCompletedUploadSegments(uploadProgress) : 1
                  }
                />
              </span>
            ) : (
              <SendIcon />
            )}
          </button>
        </span>
      </div>
    </div>
  );
}
