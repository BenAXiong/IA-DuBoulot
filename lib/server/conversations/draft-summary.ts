import "server-only";

import { getDeterministicStudentSummaryCopy } from "@/lib/i18n/student-flow-copy";
import type {
  ConversationMessageRecord,
  ConversationRecord,
  SessionSummaryRecord,
  WorkspaceStateRecord,
} from "@/lib/server/conversations/types";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type BuildStudentSessionSummaryInput = {
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord | null;
  messages: ConversationMessageRecord[];
  languageCode: UiLanguageCode;
};

type DeterministicSessionSummary = Pick<
  SessionSummaryRecord,
  | "language_code"
  | "summary_text"
  | "weakness_tags"
  | "next_step_recommendation"
  | "generated_model_name"
>;

function compactText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function inferWeaknessTags(input: BuildStudentSessionSummaryInput) {
  const tags = new Set<string>();
  const subject = input.conversation.subject_tag.toLowerCase();

  if (!compactText(input.workspace?.plan_text)) {
    tags.add("structurer_la_demarche");
  }

  if (!compactText(input.workspace?.draft_answer_text)) {
    tags.add("formaliser_une_tentative");
  }

  if (
    !compactText(input.workspace?.edited_extracted_text) &&
    !compactText(input.workspace?.assignment_text)
  ) {
    tags.add("clarifier_la_consigne");
  }

  if (subject.includes("math")) {
    tags.add("verifier_le_raisonnement");
  }

  if (subject.includes("fran") || subject.includes("lang")) {
    tags.add("justifier_la_reponse");
  }

  return Array.from(tags).slice(0, 4);
}

function buildProgressLine(input: BuildStudentSessionSummaryInput) {
  const copy = getDeterministicStudentSummaryCopy(input.languageCode);
  const studentMessages = input.messages.filter(
    (message) => message.role === "student",
  ).length;
  const assistantMessages = input.messages.filter(
    (message) => message.role === "assistant",
  ).length;
  const planText = compactText(input.workspace?.plan_text);
  const draftAnswerText = compactText(input.workspace?.draft_answer_text);

  return [
    copy.progressLines.studentMessages(studentMessages),
    copy.progressLines.assistantMessages(assistantMessages),
    copy.progressLines.planSaved(Boolean(planText)),
    copy.progressLines.draftSaved(Boolean(draftAnswerText)),
  ].join("\n");
}

export function buildDeterministicStudentSessionSummary(
  input: BuildStudentSessionSummaryInput,
): DeterministicSessionSummary {
  const copy = getDeterministicStudentSummaryCopy(input.languageCode);
  const assignmentText =
    compactText(input.workspace?.assignment_text) ??
    compactText(input.conversation.assignment_text);
  const editedExtractedText =
    compactText(input.workspace?.edited_extracted_text) ??
    compactText(input.conversation.edited_extracted_text);
  const planText = compactText(input.workspace?.plan_text);
  const draftAnswerText = compactText(input.workspace?.draft_answer_text);
  const weaknessTags = inferWeaknessTags(input);
  const nextStepRecommendation = draftAnswerText
    ? copy.nextSteps.refineDraft
    : planText
      ? copy.nextSteps.writeDraft
      : copy.nextSteps.clarifyPlan;

  const summaryText = [
    copy.summary.title(input.conversation.title),
    "",
    copy.summary.subject(input.conversation.subject_tag),
    assignmentText
      ? copy.summary.assignment(assignmentText)
      : copy.summary.noAssignment,
    editedExtractedText
      ? copy.summary.reviewedText(editedExtractedText)
      : copy.summary.noReviewedText,
    planText
      ? copy.summary.plan(planText)
      : copy.summary.noPlan,
    draftAnswerText
      ? copy.summary.draft(draftAnswerText)
      : copy.summary.noDraft,
    "",
    copy.progressTitle,
    buildProgressLine(input),
    "",
    copy.summary.nextStep(nextStepRecommendation),
  ].join("\n");

  return {
    language_code: input.languageCode,
    summary_text: summaryText,
    weakness_tags: weaknessTags,
    next_step_recommendation: nextStepRecommendation,
    generated_model_name: "deterministic-summary-v1",
  };
}
