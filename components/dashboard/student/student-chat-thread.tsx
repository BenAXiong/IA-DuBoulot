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
  void languageCode;

  return (
    <div className="grid gap-5">
      {messages.map((message) => {
        const isStudent = message.role === "student";
        const isSystem = message.role === "system";

        return (
          <article
            className={`grid ${isStudent ? "justify-items-end" : "justify-items-start"}`}
            key={message.id}
          >
            <div
              className={`w-full max-w-3xl text-sm leading-7 text-[color:var(--foreground)] ${
                isStudent
                  ? "rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                  : isSystem
                    ? "rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--ink-soft)]"
                    : "px-1 py-1.5"
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
