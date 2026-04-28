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

export const STUDENT_COACH_PROMPT_VERSION = "student-coach-v7";
export const CONVERSATION_TITLE_PROMPT_VERSION = "conversation-title-v2";
export const STUDENT_SUMMARY_PROMPT_VERSION = "student-summary-v3";
export const PARENT_SUMMARY_PROMPT_VERSION = "parent-summary-v2";
export const TUTOR_SUMMARY_PROMPT_VERSION = "tutor-summary-v2";
export const ATTACHMENT_EXTRACTION_PROMPT_VERSION = "attachment-extraction-v2";
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
  options?: { includeExtractedText?: boolean },
) {
  if (attachments.length === 0) {
    return ["- aucune pièce jointe durable"];
  }

  const includeExtractedText = options?.includeExtractedText ?? true;

  return attachments.map((attachment) => {
    const extractedText = includeExtractedText
      ? truncateForAiContext(
          normalizeText(attachment.raw_extracted_text),
          AI_CONTEXT_LIMITS.attachmentExtractChars,
        )
      : null;
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

function buildAttachmentExcerptLines(
  attachments: ConversationAttachmentRecord[],
  fallbackText: string,
) {
  const excerpts = attachments
    .map((attachment) =>
      truncateForAiContext(
        normalizeText(attachment.raw_extracted_text),
        Math.min(320, AI_CONTEXT_LIMITS.attachmentExtractChars),
      ),
    )
    .filter((value): value is string => Boolean(value))
    .slice(0, 2);

  if (excerpts.length === 0) {
    return [fallbackText];
  }

  return excerpts.map((excerpt, index) => `- Extrait ${index + 1}: ${excerpt}`);
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
  subjectResourceContext?: string | null;
  preferWorkspaceSource?: boolean;
}) {
  const workspace = buildWorkspaceContext(input.workspace);
  const hasReviewedSource = workspace.editedExtractedText !== "non renseigné";
  const includeAttachmentExtractedText = !(
    input.preferWorkspaceSource && hasReviewedSource
  );

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
    ...buildAttachmentContextLines(input.attachments, {
      includeExtractedText: includeAttachmentExtractedText,
    }),
    "",
    "Ressources de matière récupérées",
    truncateForAiContext(
      input.subjectResourceContext,
      AI_CONTEXT_LIMITS.subjectResourceContextChars,
    ) ?? "aucun extrait de ressource sélectionnée récupéré",
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

export function buildStudentSummarySourceContext(input: GenerateSummaryInput) {
  const workspace = buildWorkspaceContext(input.workspace);

  return [
    `Matière: ${input.conversation.subject_tag}`,
    "",
    "Consigne ou support utile",
    workspace.assignmentText !== "non renseigné"
      ? workspace.assignmentText
      : workspace.editedExtractedText !== "non renseigné"
        ? workspace.editedExtractedText
        : "aucune consigne exploitable n'a été conservée",
    "",
    "Extraits utiles des pièces jointes",
    ...buildAttachmentExcerptLines(
      input.attachments,
      "- aucun extrait de pièce jointe exploitable",
    ),
    "",
    "Échanges de la session",
    buildTranscriptExcerpt(input.messages),
  ].join("\n");
}

export function buildConversationTitleSourceContext(input: {
  conversation: ConversationRecord;
  attachments: ConversationAttachmentRecord[];
}) {
  const assignmentText = truncateForAiContext(
    normalizeText(input.conversation.assignment_text),
    320,
  );
  const editedExtractedText = truncateForAiContext(
    normalizeText(input.conversation.edited_extracted_text),
    360,
  );

  return [
    `Matière: ${input.conversation.subject_tag}`,
    "",
    "Consigne ou support utile",
    assignmentText ?? editedExtractedText ?? "aucune consigne exploitable",
    "",
    "Extraits utiles des pièces jointes",
    ...buildAttachmentExcerptLines(
      input.attachments,
      "- aucun extrait de pièce jointe exploitable",
    ),
  ].join("\n");
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
