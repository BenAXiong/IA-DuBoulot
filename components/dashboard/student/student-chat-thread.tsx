import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ConversationMessageRecord } from "@/lib/server/conversations/types";

type StudentChatThreadProps = {
  languageCode: UiLanguageCode;
  messages: ConversationMessageRecord[];
};

function getRoleLabel(role: ConversationMessageRecord["role"]) {
  switch (role) {
    case "student":
      return "Eleve";
    case "assistant":
      return "Coach";
    case "system":
      return "Systeme";
    default:
      return "Message";
  }
}

function getCardTone(role: ConversationMessageRecord["role"]) {
  if (role === "assistant") {
    return "border-[rgba(203,95,44,0.2)] bg-[rgba(203,95,44,0.08)]";
  }

  if (role === "system") {
    return "border-[rgba(20,33,61,0.16)] bg-[rgba(20,33,61,0.05)]";
  }

  return "border-[color:var(--line)] bg-[color:var(--surface-strong)]";
}

export function StudentChatThread({
  languageCode,
  messages,
}: StudentChatThreadProps) {
  return (
    <div className="grid gap-4">
      {messages.map((message) => (
        <article
          className={`grid gap-3 rounded-[1.5rem] border p-5 ${getCardTone(message.role)}`}
          key={message.id}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <StudentStatusPill label={getRoleLabel(message.role)} />
              <StudentStatusPill
                label={
                  formatDateLabel(message.created_at, languageCode) ??
                  "Date indisponible"
                }
              />
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground)]">
            {message.content_text}
          </p>
        </article>
      ))}
    </div>
  );
}
