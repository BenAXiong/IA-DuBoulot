import "server-only";

export const AI_CONTEXT_LIMITS = {
  assignmentTextChars: 20_000,
  editedExtractedTextChars: 20_000,
  planTextChars: 1800,
  draftAnswerTextChars: 1800,
  studentNotesChars: 1200,
  attachmentExtractChars: 20_000,
  transcriptMessageCount: 30,
  transcriptMessageChars: 600,
  summaryCount: 5,
  summaryTextChars: 900,
  translationSourceChars: 2400,
} as const;

export const AI_OUTPUT_TOKEN_LIMITS = {
  coachReply: 2000,
  summary: 2000,
  memoryProfile: 600,
  translation: 900,
} as const;

const AI_TRUNCATION_SUFFIX = "\n[tronque pour limiter le cout IA]";

export function truncateForAiContext(
  value: string | null | undefined,
  maxChars: number,
) {
  const normalized = value?.trim() ?? "";

  if (!normalized) {
    return null;
  }

  if (normalized.length <= maxChars) {
    return normalized;
  }

  const safeLength = Math.max(maxChars - AI_TRUNCATION_SUFFIX.length, 0);
  return `${normalized.slice(0, safeLength).trimEnd()}${AI_TRUNCATION_SUFFIX}`;
}
