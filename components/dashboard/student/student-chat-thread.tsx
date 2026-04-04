import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import {
  getConversationRoleLabel,
  getStudentChatThreadCopy,
} from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ConversationMessageRecord } from "@/lib/server/conversations/types";

type StudentChatThreadProps = {
  languageCode: UiLanguageCode;
  messages: ConversationMessageRecord[];
};

export function StudentChatThread({
  languageCode,
  messages,
}: StudentChatThreadProps) {
  const copy = getStudentChatThreadCopy(languageCode);

  return (
    <div className="grid gap-6">
      {messages.map((message) => {
        const isStudent = message.role === "student";
        const isSystem = message.role === "system";

        return (
          <article
            className={`grid gap-2 ${isStudent ? "justify-items-end" : "justify-items-start"}`}
            key={message.id}
          >
            <div
              className={`flex max-w-3xl flex-wrap items-center gap-2 text-xs text-[color:var(--ink-muted)] ${
                isStudent ? "justify-end" : "justify-start"
              }`}
            >
              <span className="font-medium text-[color:var(--ink-soft)]">
                {getConversationRoleLabel(message.role, languageCode)}
              </span>
              <span>
                {formatDateLabel(message.created_at, languageCode) ?? copy.noDate}
              </span>
            </div>

            <div
              className={`w-full max-w-3xl text-sm leading-7 text-[color:var(--foreground)] ${
                isStudent
                  ? "rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                  : isSystem
                    ? "rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-4 text-[color:var(--ink-soft)]"
                    : "px-1 py-1"
              } ${isStudent ? "ml-auto" : ""}`}
            >
              <p className="whitespace-pre-wrap">{message.content_text}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
