"use client";

import { useEffect, useState } from "react";
import { ProfileAvatar } from "@/components/dashboard/parent/profile-avatar";
import { StudentMessageContent } from "@/components/dashboard/student/student-message-content";
import { getStudentWorkbenchCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ConversationMessageRecord } from "@/lib/server/conversations/types";

type DisplayConversationMessage = ConversationMessageRecord & {
  isPending?: boolean;
};

type StudentChatThreadProps = {
  languageCode: UiLanguageCode;
  messages: DisplayConversationMessage[];
  studentDisplayName: string;
};

export function StudentChatThread({
  languageCode,
  messages,
  studentDisplayName,
}: StudentChatThreadProps) {
  const copy = getStudentWorkbenchCopy(languageCode);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedMessageId) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedMessageId(null), 1400);
    return () => window.clearTimeout(timeout);
  }, [copiedMessageId]);

  async function handleCopy(messageId: string, contentText: string) {
    try {
      await navigator.clipboard.writeText(contentText);
      setCopiedMessageId(messageId);
    } catch {
      setCopiedMessageId(null);
    }
  }

  return (
    <div className="relative grid gap-5">
      {messages.map((message) => {
        const isStudent = message.role === "student";
        const isSystem = message.role === "system";
        const isAssistant = message.role === "assistant";
        const isCopied = copiedMessageId === message.id;
        const copyLabel = isStudent
          ? copy.copyPrompt
          : isAssistant
            ? copy.copyReply
            : copy.copyMessage;

        return (
          <article
            className={`group grid ${isStudent ? "justify-items-end" : "justify-items-start"}`}
            key={message.id}
          >
            <div
              className={`flex w-full items-start gap-3 ${
                isStudent ? "justify-end" : "justify-start"
              }`}
            >
              {!isStudent ? (
                <div
                  className={`mt-1 shrink-0 ${
                    isAssistant
                      ? "brand-mark brand-mark--mini inline-flex items-center justify-center font-[family-name:var(--font-heading)] text-[0.65rem] font-semibold text-white"
                      : ""
                  }`}
                >
                  {isAssistant ? (
                    "bb"
                  ) : (
                    <ProfileAvatar name={studentDisplayName} size="sm" />
                  )}
                </div>
              ) : null}

              <div
                className={`flex min-w-0 flex-col ${
                  isStudent
                    ? "max-w-[min(calc(100%-3rem),42rem)] items-end"
                    : "flex-1 items-start"
                }`}
              >
                <div
                  className={`min-w-0 text-sm leading-7 text-[color:var(--foreground)] ${
                    isStudent
                      ? "w-fit max-w-full rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                      : isSystem
                        ? "max-w-[min(100%,42rem)] rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--ink-soft)]"
                        : message.isPending
                          ? "student-pending-shimmer max-w-[min(100%,42rem)] rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--ink-soft)]"
                          : "w-full px-1 py-1.5"
                  }`}
                >
                  {isAssistant && !message.isPending ? (
                    <StudentMessageContent content={message.content_text} />
                  ) : (
                    <p className="whitespace-pre-wrap text-left">
                      {message.content_text}
                    </p>
                  )}
                </div>

                <div
                  className={`mt-1 flex ${isStudent ? "justify-end" : "justify-start"}`}
                >
                  <button
                    aria-label={isCopied ? copy.copiedMessage : copyLabel}
                    className={`group/copy relative inline-flex items-center rounded-full px-2 py-1 text-xs text-[color:var(--ink-soft)] transition hover:text-[color:var(--foreground)] group-hover:opacity-100 focus-visible:opacity-100 ${
                      isCopied ? "opacity-100" : "opacity-0"
                    }`}
                    onClick={() => handleCopy(message.id, message.content_text)}
                    type="button"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M9 9.75A2.25 2.25 0 0 1 11.25 7.5h6A2.25 2.25 0 0 1 19.5 9.75v7.5a2.25 2.25 0 0 1-2.25 2.25h-6A2.25 2.25 0 0 1 9 17.25v-7.5Z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.7"
                      />
                      <path
                        d="M15 7.5V6.75A2.25 2.25 0 0 0 12.75 4.5h-6A2.25 2.25 0 0 0 4.5 6.75v7.5a2.25 2.25 0 0 0 2.25 2.25H9"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.7"
                      />
                    </svg>
                    {isCopied ? (
                      <span
                        className={`pointer-events-none absolute top-1/2 whitespace-nowrap rounded-full bg-[color:var(--surface-raised)] px-2 py-0.5 text-[11px] text-[color:var(--foreground)] shadow-[var(--shadow)] ${
                          isStudent
                            ? "right-full mr-2 -translate-y-1/2"
                            : "left-full ml-2 -translate-y-1/2"
                        }`}
                      >
                        {copy.copiedToast}
                      </span>
                    ) : (
                      <span
                        className={`pointer-events-none absolute top-1/2 whitespace-nowrap rounded-full bg-[color:var(--surface-raised)] px-2 py-0.5 text-[11px] text-[color:var(--foreground)] opacity-0 shadow-[var(--shadow)] transition group-hover/copy:opacity-100 ${
                          isStudent
                            ? "right-full mr-2 -translate-y-1/2"
                            : "left-full ml-2 -translate-y-1/2"
                        }`}
                      >
                        {copyLabel}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {isStudent ? (
                <ProfileAvatar name={studentDisplayName} size="sm" />
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
