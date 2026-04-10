import "server-only";

import type {
  ConversationAttachmentRecord,
  GenerateSummaryInput,
  GenerateMemoryProfileInput,
} from "@/lib/server/ai/types";
import type {
  ConversationMessageRecord,
  ConversationRecord,
  WorkspaceStateRecord,
} from "@/lib/server/conversations/types";
import type { AiLanguageCode, UiLanguageCode } from "@/lib/server/auth/types";
import {
  AI_CONTEXT_LIMITS,
  truncateForAiContext,
} from "@/lib/server/ai/guardrails";

export const STUDENT_COACH_PROMPT_VERSION = "student-coach-v6";
export const CONVERSATION_TITLE_PROMPT_VERSION = "conversation-title-v1";
export const STUDENT_SUMMARY_PROMPT_VERSION = "student-summary-v2";
export const PARENT_SUMMARY_PROMPT_VERSION = "parent-summary-v2";
export const TUTOR_SUMMARY_PROMPT_VERSION = "tutor-summary-v2";
export const ATTACHMENT_EXTRACTION_PROMPT_VERSION = "attachment-extraction-v1";
export const TRANSLATION_PROMPT_VERSION = "translation-v2";
export const MEMORY_PROFILE_PROMPT_VERSION = "memory-profile-v2";

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function getLanguageLabel(languageCode: UiLanguageCode | AiLanguageCode) {
  if (languageCode === "fr") {
    return "français";
  }

  if (languageCode === "en") {
    return "English";
  }

  return "中文";
}

export function buildAttachmentContextLines(
  attachments: ConversationAttachmentRecord[],
) {
  if (attachments.length === 0) {
    return ["- aucune pièce jointe durable"];
  }

  return attachments.map((attachment) => {
    const extractedText = truncateForAiContext(
      normalizeText(attachment.raw_extracted_text),
      AI_CONTEXT_LIMITS.attachmentExtractChars,
    );
    const extractionState =
      attachment.extraction_status === "ready"
        ? extractedText
          ? "texte extrait disponible"
          : "aucun texte exploitable disponible"
        : attachment.extraction_status === "failed"
          ? extractedText
            ? "extraction incertaine, texte partiel seulement"
            : "extraction à revoir, aucun texte fiable disponible"
          : "extraction en attente, aucun texte disponible encore";

    return [
      `- ${attachment.original_filename} (${attachment.mime_type}, ${attachment.attachment_kind}, ${Math.max(
        1,
        Math.round(attachment.byte_size / 1024),
      )} KB, ${extractionState})`,
      extractedText ? `  Extrait: ${extractedText}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });
}

export function buildTranscriptExcerpt(messages: ConversationMessageRecord[]) {
  const recentMessages = messages.slice(-AI_CONTEXT_LIMITS.transcriptMessageCount);

  if (recentMessages.length === 0) {
    return "- aucun historique";
  }

  return recentMessages
    .map((message) => {
      const content =
        truncateForAiContext(
          message.content_text,
          AI_CONTEXT_LIMITS.transcriptMessageChars,
        ) ?? "";
      return `[${message.role}] ${content}`;
    })
    .join("\n\n");
}

export function buildWorkspaceContext(workspace: WorkspaceStateRecord | null) {
  return {
    assignmentText:
      truncateForAiContext(
        normalizeText(workspace?.assignment_text),
        AI_CONTEXT_LIMITS.assignmentTextChars,
      ) ?? "non renseigné",
    editedExtractedText:
      truncateForAiContext(
        normalizeText(workspace?.edited_extracted_text),
        AI_CONTEXT_LIMITS.editedExtractedTextChars,
      ) ?? "non renseigné",
    planText:
      truncateForAiContext(
        normalizeText(workspace?.plan_text),
        AI_CONTEXT_LIMITS.planTextChars,
      ) ?? "aucun plan noté",
    draftAnswerText:
      truncateForAiContext(
        normalizeText(workspace?.draft_answer_text),
        AI_CONTEXT_LIMITS.draftAnswerTextChars,
      ) ?? "aucun brouillon noté",
    studentNotes:
      truncateForAiContext(
        normalizeText(workspace?.student_notes),
        AI_CONTEXT_LIMITS.studentNotesChars,
      ) ?? "aucune note élève",
  };
}

export function buildConversationCoreContext(input: {
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord | null;
  messages: ConversationMessageRecord[];
  attachments: ConversationAttachmentRecord[];
}) {
  const workspace = buildWorkspaceContext(input.workspace);

  return [
    `Titre: ${input.conversation.title}`,
    `Matière: ${input.conversation.subject_tag}`,
    `Devoir noté: ${input.conversation.graded_homework ? "oui" : "non"}`,
    "",
    "Texte de devoir",
    workspace.assignmentText,
    "",
    "Texte extrait relu",
    workspace.editedExtractedText,
    "",
    "Plan",
    workspace.planText,
    "",
    "Brouillon",
    workspace.draftAnswerText,
    "",
    "Notes élève",
    workspace.studentNotes,
    "",
    "Pièces jointes",
    ...buildAttachmentContextLines(input.attachments),
    "",
    "Extrait récent du transcript",
    buildTranscriptExcerpt(input.messages),
  ].join("\n");
}

export function buildSummarySourceContext(input: GenerateSummaryInput) {
  return buildConversationCoreContext({
    conversation: input.conversation,
    workspace: input.workspace,
    messages: input.messages,
    attachments: input.attachments,
  });
}

export function buildMemorySourceContext(input: GenerateMemoryProfileInput) {
  const summaryLines =
    input.summaries.length === 0
      ? ["- aucun résumé de session encore disponible"]
      : input.summaries.slice(0, AI_CONTEXT_LIMITS.summaryCount).map((summary) => {
          const weaknessTags =
            summary.weakness_tags.length > 0
              ? ` | tags: ${summary.weakness_tags.join(", ")}`
              : "";

          const summaryText =
            truncateForAiContext(
              summary.summary_text,
              AI_CONTEXT_LIMITS.summaryTextChars,
            ) ?? "résumé indisponible";

          return `- [${summary.audience}/${summary.language_code}] ${summaryText}${weaknessTags}`;
        });

  return [
    buildConversationCoreContext({
      conversation: input.conversation,
      workspace: input.workspace,
      messages: input.messages,
      attachments: input.attachments,
    }),
    "",
    "Résumés déjà générés",
    ...summaryLines,
  ].join("\n");
}
