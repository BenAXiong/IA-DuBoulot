"use client";

import { extractClipboardFiles } from "@/lib/intake/intake-config";
import { getStudentConversationComposerCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type StudentConversationComposerProps = {
  composerText: string;
  languageCode: UiLanguageCode;
  disabled?: boolean;
  isSending?: boolean;
  onComposerTextChange: (value: string) => void;
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

export function StudentConversationComposer({
  composerText,
  languageCode,
  disabled = false,
  isSending = false,
  onComposerTextChange,
  onPasteAttachments,
  onSendMessage,
  onUploadAttachments,
}: StudentConversationComposerProps) {
  const copy = getStudentConversationComposerCopy(languageCode);

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter" || !event.ctrlKey) {
      return;
    }

    event.preventDefault();

    if (disabled || isSending || composerText.trim().length === 0) {
      return;
    }

    onSendMessage();
  }

  function handleComposerPaste(
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) {
    const files = extractClipboardFiles(event.clipboardData);

    if (files.length === 0 || disabled || isSending) {
      return;
    }

    event.preventDefault();
    onPasteAttachments(files);
  }

  return (
    <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-2.5">
      <textarea
        className="student-chat-textarea min-h-8 w-full resize-none bg-transparent px-1 py-0.5 text-sm leading-5 placeholder:text-[color:var(--ink-soft)]"
        disabled={disabled || isSending}
        onChange={(event) => onComposerTextChange(event.target.value)}
        onKeyDown={handleComposerKeyDown}
        onPaste={handleComposerPaste}
        placeholder={copy.placeholder}
        value={composerText}
      />

      <div className="flex items-center justify-between gap-3 px-0.5 py-0">
        <div className="flex items-center gap-2">
          <button
            aria-label={copy.addAttachment}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-strong)] focus:shadow-none focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || isSending}
            onClick={onUploadAttachments}
            title={copy.addAttachment}
            type="button"
          >
            <PlusIcon />
          </button>
          <button
            aria-label={copy.voice}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-strong)] focus:shadow-none focus-visible:shadow-none"
            disabled
            title={copy.voice}
            type="button"
          >
            <MicIcon />
          </button>
        </div>

        <button
          aria-label={isSending ? copy.sending : copy.send}
          className="inline-flex h-8 w-8 items-center justify-center text-[color:var(--foreground)] transition hover:text-[color:var(--accent)] focus:shadow-none focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || isSending || composerText.trim().length === 0}
          onClick={onSendMessage}
          type="button"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
