import "server-only";

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
};

function compactText(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : fallback;
}

function buildHintReply(input: BuildDraftAssistantReplyInput) {
  const assignmentText = compactText(
    input.workspace?.assignment_text ?? input.conversation.assignment_text,
    "Reprends l'enonce exact du devoir dans ton espace de travail.",
  );

  return [
    "Indice de depart",
    "",
    `1. Reformule l'objectif du devoir: ${input.conversation.title}.`,
    `2. Repere la matiere et la consigne cle: ${input.conversation.subject_tag}.`,
    `3. A partir du texte disponible, commence par la partie la plus concrete: ${assignmentText}`,
    "",
    "Avant de demander une solution complete, note ce que tu sais deja faire et ce qui te bloque precisement.",
  ].join("\n");
}

function buildSummaryReply(input: BuildDraftAssistantReplyInput) {
  const planText = compactText(
    input.workspace?.plan_text,
    "Aucun plan n'est encore note dans l'espace de travail.",
  );
  const draftAnswerText = compactText(
    input.workspace?.draft_answer_text,
    "Aucune reponse brouillon n'est encore ecrite.",
  );

  return [
    "Resume de session",
    "",
    `- Devoir: ${input.conversation.title}`,
    `- Matiere: ${input.conversation.subject_tag}`,
    `- Plan actuel: ${planText}`,
    `- Reponse brouillon: ${draftAnswerText}`,
    "",
    "Prochaine etape conseillee: choisis un sous-probleme, ecris ton essai dans le panneau de droite, puis demande un indice cible si besoin.",
  ].join("\n");
}

function buildGenericReply(input: BuildDraftAssistantReplyInput) {
  const editedExtractedText = compactText(
    input.workspace?.edited_extracted_text ??
      input.conversation.edited_extracted_text,
    "Aucun texte relu n'est encore disponible.",
  );

  return [
    "Coach brouillon",
    "",
    `J'ai note ton message: "${input.studentMessageText}".`,
    `Contexte actif: ${input.conversation.title} (${input.conversation.subject_tag}).`,
    `Texte relu disponible: ${editedExtractedText}`,
    "",
    "Etape suivante conseillee:",
    "- decris ce que tu as deja essaye",
    "- isole la question exacte a traiter",
    "- remplis le plan ou la reponse brouillon dans l'espace de travail avant le futur moteur IA",
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
}) {
  if (input.intent === "hint") {
    return "Je veux un indice pour avancer sur ce devoir.";
  }

  if (input.intent === "summarize") {
    return "Peux-tu resumer la session et la prochaine etape utile ?";
  }

  return input.contentText.trim();
}

export function buildInitialWorkspaceFromDraft(input: CreateConversationDraftInput) {
  return {
    assignmentText: input.pastedText.trim(),
    editedExtractedText: input.editedExtractedText.trim(),
  };
}
