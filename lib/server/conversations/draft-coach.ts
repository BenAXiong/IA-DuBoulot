import "server-only";

import { getStudentDraftCoachCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  ConversationActionIntent,
  ConversationRecord,
  CreateConversationDraftInput,
  WorkspaceStateRecord,
} from "@/lib/server/conversations/types";

type BuildDraftAssistantReplyInput = {
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord | null;
  intent: ConversationActionIntent;
  studentMessageText: string;
  languageCode: UiLanguageCode;
};

function compactText(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : fallback;
}

function buildHintReply(input: BuildDraftAssistantReplyInput) {
  const copy = getStudentDraftCoachCopy(input.languageCode);
  const assignmentText = compactText(
    input.workspace?.assignment_text ?? input.conversation.assignment_text,
    copy.hint.assignmentFallback,
  );

  return [
    copy.hint.title,
    "",
    copy.hint.firstStep(input.conversation.title),
    copy.hint.secondStep(input.conversation.subject_tag),
    copy.hint.thirdStep(assignmentText),
    "",
    copy.hint.closing,
  ].join("\n");
}

function buildSummaryReply(input: BuildDraftAssistantReplyInput) {
  const copy = getStudentDraftCoachCopy(input.languageCode);
  const planText = compactText(
    input.workspace?.plan_text,
    copy.summary.noPlan,
  );
  const draftAnswerText = compactText(
    input.workspace?.draft_answer_text,
    copy.summary.noDraft,
  );

  return [
    copy.summary.title,
    "",
    copy.summary.assignment(input.conversation.title),
    copy.summary.subject(input.conversation.subject_tag),
    copy.summary.plan(planText),
    copy.summary.draft(draftAnswerText),
    "",
    copy.summary.nextStep,
  ].join("\n");
}

function buildGenericReply(input: BuildDraftAssistantReplyInput) {
  const copy = getStudentDraftCoachCopy(input.languageCode);
  const editedExtractedText = compactText(
    input.workspace?.edited_extracted_text ??
      input.conversation.edited_extracted_text,
    copy.generic.noReviewedText,
  );

  return [
    copy.generic.title,
    "",
    copy.generic.notedMessage(input.studentMessageText),
    copy.generic.activeContext(
      input.conversation.title,
      input.conversation.subject_tag,
    ),
    copy.generic.reviewedText(editedExtractedText),
    "",
    copy.generic.nextStepTitle,
    ...copy.generic.bullets.map((line) => `- ${line}`),
  ].join("\n");
}

export function buildDraftAssistantReply(
  input: BuildDraftAssistantReplyInput,
) {
  if (input.intent === "hint") {
    return buildHintReply(input);
  }

  if (input.intent === "summarize") {
    return buildSummaryReply(input);
  }

  return buildGenericReply(input);
}

export function buildStudentIntentMessage(input: {
  intent: ConversationActionIntent;
  contentText: string;
  languageCode: UiLanguageCode;
}) {
  const copy = getStudentDraftCoachCopy(input.languageCode);

  if (input.intent === "hint") {
    return copy.intents.hint;
  }

  if (input.intent === "summarize") {
    return copy.intents.summarize;
  }

  return input.contentText.trim();
}

export function buildInitialWorkspaceFromDraft(input: CreateConversationDraftInput) {
  return {
    assignmentText: input.pastedText.trim(),
    editedExtractedText: input.editedExtractedText.trim(),
  };
}
