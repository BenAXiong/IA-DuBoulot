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
  onRequestHint: () => void;
  onRequestSummary: () => void;
  onUploadAttachments: () => void;
};

export function StudentConversationComposer({
  composerText,
  languageCode,
  disabled = false,
  isSending = false,
  onComposerTextChange,
  onSendMessage,
  onRequestHint,
  onRequestSummary,
  onUploadAttachments,
}: StudentConversationComposerProps) {
  const copy = getStudentConversationComposerCopy(languageCode);

  return (
    <div className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
      <div className="flex flex-wrap gap-3">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled || isSending}
          onClick={onUploadAttachments}
          type="button"
        >
          {copy.addAttachment}
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled || isSending}
          onClick={onRequestHint}
          type="button"
        >
          {copy.hint}
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled || isSending}
          onClick={onRequestSummary}
          type="button"
        >
          {copy.summarize}
        </button>
      </div>

      <textarea
        className="min-h-32 rounded-[1.5rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
        disabled={disabled || isSending}
        onChange={(event) => onComposerTextChange(event.target.value)}
        placeholder={copy.placeholder}
        value={composerText}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[color:var(--ink-soft)]">
          {copy.body}
        </p>
        <button
          className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled || isSending || composerText.trim().length === 0}
          onClick={onSendMessage}
          type="button"
        >
          {isSending ? copy.sending : copy.send}
        </button>
      </div>
    </div>
  );
}
