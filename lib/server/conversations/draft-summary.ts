import "server-only";

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
  const studentMessages = input.messages.filter(
    (message) => message.role === "student",
  ).length;
  const assistantMessages = input.messages.filter(
    (message) => message.role === "assistant",
  ).length;
  const planText = compactText(input.workspace?.plan_text);
  const draftAnswerText = compactText(input.workspace?.draft_answer_text);

  return [
    `- Echanges eleve: ${studentMessages}`,
    `- Reponses de coaching: ${assistantMessages}`,
    `- Plan note: ${planText ? "oui" : "non"}`,
    `- Brouillon present: ${draftAnswerText ? "oui" : "non"}`,
  ].join("\n");
}

export function buildDeterministicStudentSessionSummary(
  input: BuildStudentSessionSummaryInput,
): DeterministicSessionSummary {
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
    ? "Reprends ton brouillon, verifie chaque etape, puis ouvre une nouvelle session si tu veux un feedback plus cible."
    : planText
      ? "Transforme maintenant ton plan en premier brouillon complet avant de lancer une nouvelle session."
      : "Reformule la consigne et ecris un plan court en 3 etapes avant la prochaine reprise.";

  const summaryText = [
    `Session terminee: ${input.conversation.title}`,
    "",
    `Matiere: ${input.conversation.subject_tag}`,
    assignmentText
      ? `Consigne retenue: ${assignmentText}`
      : "Consigne retenue: la session doit encore conserver un enonce plus explicite.",
    editedExtractedText
      ? `Texte relu disponible: ${editedExtractedText}`
      : "Texte relu disponible: aucun texte relu n'a ete sauve pour cette session.",
    planText
      ? `Plan de travail: ${planText}`
      : "Plan de travail: aucun plan n'a ete note pendant la session.",
    draftAnswerText
      ? `Brouillon actuel: ${draftAnswerText}`
      : "Brouillon actuel: aucune tentative redigee n'a ete gardee.",
    "",
    "Progression observee",
    buildProgressLine(input),
    "",
    `Prochaine etape conseillee: ${nextStepRecommendation}`,
  ].join("\n");

  return {
    language_code: input.languageCode,
    summary_text: summaryText,
    weakness_tags: weaknessTags,
    next_step_recommendation: nextStepRecommendation,
    generated_model_name: "deterministic-summary-v1",
  };
}
