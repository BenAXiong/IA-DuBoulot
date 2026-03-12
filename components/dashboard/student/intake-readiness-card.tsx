import {
  formatBytes,
  INTAKE_MAX_ATTACHMENTS,
  INTAKE_MAX_TOTAL_UPLOAD_BYTES,
} from "@/lib/intake/intake-config";
import { getIntakeReadinessCardCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type IntakeReadinessCardProps = {
  canStartHomework: boolean;
  filesCount: number;
  pastedTextLength: number;
  extractionDraftLength: number;
  totalBytes: number;
  titleReady: boolean;
  subjectReady: boolean;
  reviewMessage: string | null;
  languageCode: UiLanguageCode;
};

export function IntakeReadinessCard({
  canStartHomework,
  filesCount,
  pastedTextLength,
  extractionDraftLength,
  totalBytes,
  titleReady,
  subjectReady,
  reviewMessage,
  languageCode,
}: IntakeReadinessCardProps) {
  const copy = getIntakeReadinessCardCopy(languageCode);

  return (
    <aside className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
      <div className="space-y-2">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
          {copy.eyebrow}
        </p>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl leading-tight">
          {copy.title}
        </h2>
      </div>

      <div className="grid gap-3 text-sm leading-6 text-[color:var(--ink-soft)]">
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="font-medium text-[color:var(--foreground)]">
            {copy.cards.state}
          </p>
          <p>{canStartHomework ? copy.stateReady : copy.stateBlocked}</p>
        </div>
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="font-medium text-[color:var(--foreground)]">
            {copy.cards.title}
          </p>
          <p>{copy.readinessLabel(titleReady)}</p>
        </div>
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="font-medium text-[color:var(--foreground)]">
            {copy.cards.subject}
          </p>
          <p>{copy.readinessLabel(subjectReady)}</p>
        </div>
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="font-medium text-[color:var(--foreground)]">
            {copy.cards.sources}
          </p>
          <p>{copy.sourcesLine(filesCount, pastedTextLength)}</p>
        </div>
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="font-medium text-[color:var(--foreground)]">
            {copy.cards.reviewedText}
          </p>
          <p>{copy.reviewedTextLine(extractionDraftLength)}</p>
        </div>
        <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/70 px-4 py-3">
          <p className="font-medium text-[color:var(--foreground)]">
            {copy.cards.limits}
          </p>
          <p>
            {copy.limitsLine(
              filesCount,
              INTAKE_MAX_ATTACHMENTS,
              formatBytes(totalBytes),
              formatBytes(INTAKE_MAX_TOTAL_UPLOAD_BYTES),
            )}
          </p>
        </div>
      </div>

      {reviewMessage ? (
        <p className="rounded-[1.25rem] border border-[rgba(203,95,44,0.24)] bg-[rgba(203,95,44,0.12)] px-4 py-3 text-sm leading-6 text-[color:var(--foreground)]">
          {reviewMessage}
        </p>
      ) : null}
    </aside>
  );
}
