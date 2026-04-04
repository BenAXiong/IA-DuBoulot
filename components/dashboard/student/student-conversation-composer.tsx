"use client";

import { getStudentConversationComposerCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type StudentConversationComposerProps = {
  composerText: string;
  languageCode: UiLanguageCode;
  disabled?: boolean;
  isSending?: boolean;
  onComposerTextChange: (value: string) => void;
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
  onSendMessage,
  onUploadAttachments,
}: StudentConversationComposerProps) {
  const copy = getStudentConversationComposerCopy(languageCode);

  return (
    <div className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
      <textarea
        className="min-h-28 w-full resize-none bg-transparent px-2 pt-2 text-sm leading-7 outline-none placeholder:text-[color:var(--ink-soft)]"
        disabled={disabled || isSending}
        onChange={(event) => onComposerTextChange(event.target.value)}
        placeholder={copy.placeholder}
        value={composerText}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            aria-label={copy.addAttachment}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--foreground)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || isSending}
            onClick={onUploadAttachments}
            type="button"
          >
            <PlusIcon />
          </button>
          <button
            aria-label={copy.voice}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--ink-soft)]"
            disabled
            title={copy.voice}
            type="button"
          >
            <MicIcon />
          </button>
        </div>

        <button
          aria-label={isSending ? copy.sending : copy.send}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--foreground)] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
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
