import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import {
  getStudentSessionSummaryCopy,
  getWeaknessTagLabel,
} from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  ConversationRecord,
  SessionSummaryRecord,
} from "@/lib/server/conversations/types";

type StudentSessionSummaryPanelProps = {
  conversation: ConversationRecord;
  languageCode: UiLanguageCode;
  onComplete: () => void;
  summary: SessionSummaryRecord | null;
  feedbackMessage: string | null;
  isCompleting: boolean;
};

export function StudentSessionSummaryPanel({
  conversation,
  languageCode,
  onComplete,
  summary,
  feedbackMessage,
  isCompleting,
}: StudentSessionSummaryPanelProps) {
  const isCompleted = conversation.status === "completed";
  const copy = getStudentSessionSummaryCopy(languageCode);

  return (
    <aside className="grid gap-4 rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <StudentStatusPill
            label={getConversationStatusLabel(conversation.status, languageCode)}
            tone={isCompleted ? "accent" : "neutral"}
          />
          {summary ? <StudentStatusPill label={copy.summaryBadge(summary.language_code)} /> : null}
        </div>

        <div>
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {isCompleted ? copy.titleCompleted : copy.titleActive}
          </h2>
        </div>

        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
          {isCompleted && conversation.completed_at
            ? copy.completedOn(
                formatDateLabel(conversation.completed_at, languageCode),
              )
            : copy.activeBody}
        </p>

        {!isCompleted ? (
          <button
            className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isCompleting}
            onClick={onComplete}
            type="button"
          >
            {isCompleting ? copy.completing : copy.completeSession}
          </button>
        ) : null}

        {feedbackMessage ? (
          <p
            className={`rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
              isCompleted
                ? "border border-[#cbbf8d] bg-[#fff8df] text-[#69551b]"
                : "border border-[color:var(--line)] bg-white text-[color:var(--ink-soft)]"
            }`}
          >
            {feedbackMessage}
          </p>
        ) : null}
      </div>

      {summary ? (
        <article className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
          <div className="space-y-2">
            <p className="font-medium">{copy.summaryTitle}</p>
            <p className="whitespace-pre-line text-sm leading-6 text-[color:var(--foreground)]">
              {summary.summary_text}
            </p>
          </div>

          {summary.weakness_tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {summary.weakness_tags.map((tag) => (
                <StudentStatusPill
                  key={tag}
                  label={getWeaknessTagLabel(tag, languageCode)}
                  tone="warning"
                />
              ))}
            </div>
          ) : null}

          {summary.next_step_recommendation ? (
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
              {copy.nextStep(summary.next_step_recommendation)}
            </div>
          ) : null}
        </article>
      ) : null}
    </aside>
  );
}
