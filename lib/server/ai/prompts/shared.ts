import "server-only";

import type { ConversationAttachmentRecord, GenerateSummaryInput } from "@/lib/server/ai/types";
import type {
  ConversationMessageRecord,
  ConversationRecord,
  WorkspaceStateRecord,
} from "@/lib/server/conversations/types";
import type { AiLanguageCode, UiLanguageCode } from "@/lib/server/auth/types";

export const STUDENT_COACH_PROMPT_VERSION = "student-coach-v1";
export const STUDENT_SUMMARY_PROMPT_VERSION = "student-summary-v1";
export const PARENT_SUMMARY_PROMPT_VERSION = "parent-summary-v1";
export const TUTOR_SUMMARY_PROMPT_VERSION = "tutor-summary-v1";
export const ATTACHMENT_EXTRACTION_PROMPT_VERSION = "attachment-extraction-v1";
export const TRANSLATION_PROMPT_VERSION = "translation-v1";

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function getLanguageLabel(languageCode: UiLanguageCode | AiLanguageCode) {
  if (languageCode === "fr") {
    return "francais";
  }

  if (languageCode === "en") {
    return "english";
  }

  return "zhongwen";
}

export function buildAttachmentContextLines(
  attachments: ConversationAttachmentRecord[],
) {
  if (attachments.length === 0) {
    return ["- aucune piece jointe durable"];
  }

  return attachments.map((attachment) => {
    const extractionState =
      attachment.extraction_status === "ready"
        ? "texte extrait disponible"
        : attachment.extraction_status === "failed"
          ? "extraction a revoir"
          : "extraction en attente";
    const extractedText = normalizeText(attachment.raw_extracted_text);

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
  const recentMessages = messages.slice(-8);

  if (recentMessages.length === 0) {
    return "- aucun historique";
  }

  return recentMessages
    .map((message) => `[${message.role}] ${message.content_text}`)
    .join("\n\n");
}

export function buildWorkspaceContext(workspace: WorkspaceStateRecord | null) {
  return {
    assignmentText:
      normalizeText(workspace?.assignment_text) ?? "non renseigne",
    editedExtractedText:
      normalizeText(workspace?.edited_extracted_text) ?? "non renseigne",
    planText: normalizeText(workspace?.plan_text) ?? "aucun plan note",
    draftAnswerText:
      normalizeText(workspace?.draft_answer_text) ?? "aucun brouillon note",
    studentNotes:
      normalizeText(workspace?.student_notes) ?? "aucune note etudiante",
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
    `Matiere: ${input.conversation.subject_tag}`,
    `Devoir note: ${input.conversation.graded_homework ? "oui" : "non"}`,
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
    "Notes eleve",
    workspace.studentNotes,
    "",
    "Pieces jointes",
    ...buildAttachmentContextLines(input.attachments),
    "",
    "Extrait recent du transcript",
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
