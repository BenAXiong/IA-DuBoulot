import "server-only";

export const AI_CONTEXT_LIMITS = {
  assignmentTextChars: 3500,
  editedExtractedTextChars: 3500,
  planTextChars: 1800,
  draftAnswerTextChars: 1800,
  studentNotesChars: 1200,
  attachmentExtractChars: 2000,
  attachmentPartChars: 1200,
  transcriptMessageCount: 8,
  transcriptMessageChars: 600,
  summaryCount: 5,
  summaryTextChars: 900,
  translationSourceChars: 2400,
} as const;

export const AI_OUTPUT_TOKEN_LIMITS = {
  coachReply: 2000,
  summary: 450,
  memoryProfile: 280,
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
