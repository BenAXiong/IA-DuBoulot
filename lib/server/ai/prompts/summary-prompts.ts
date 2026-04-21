import "server-only";

import {
  buildSummarySourceContext,
  buildStudentSummarySourceContext,
  getLanguageLabel,
  PARENT_SUMMARY_PROMPT_VERSION,
  STUDENT_SUMMARY_PROMPT_VERSION,
  TUTOR_SUMMARY_PROMPT_VERSION,
} from "@/lib/server/ai/prompts/shared";
import type { GenerateSummaryInput } from "@/lib/server/ai/types";

function buildAudienceInstruction(input: GenerateSummaryInput) {
  if (input.audience === "student") {
    return [
      "Audience: élève.",
      "Ton résumé doit rester concret, clair, et utile pour reprendre le travail.",
      "Dis d'abord ce qui a été réellement travaillé ou compris pendant la session.",
      "N'inclus pas de métadonnées de session: pas de titre, pas de matière, pas de nom de fichier, pas de compteur d'échanges, pas d'état de plan ou de brouillon, pas de formule comme 'session terminée'.",
      "N'écris pas une solution complète du devoir.",
      "Les weaknessTags doivent décrire des notions ou compétences encore fragiles pendant cette séance, pas des manques de process génériques.",
      "La prochaine étape doit proposer une action de révision ou d'entraînement directement liée à la notion travaillée.",
      "Les weaknessTags doivent rester pédagogiques et courts en snake_case français.",
    ].join("\n");
  }

  if (input.audience === "parent") {
    return [
      "Audience: parent.",
      "Résume ce que l'élève a travaillé, ce qui reste fragile, et la prochaine étape utile.",
      "Le ton doit être clair, rassurant, et non technique.",
      "N'ajoute pas de diagnostic psychologique ou de jugement personnel.",
      "Les weaknessTags doivent rester pédagogiques et courts en snake_case français.",
    ].join("\n");
  }

  return [
    "Audience: tuteur.",
    "Fournis un résumé plus opérationnel, avec points faibles observables et prochaine intervention conseillée.",
    "Les weaknessTags doivent être actionnables, courts, et en snake_case français.",
    "N'invente pas de performance si le transcript ne la justifie pas.",
  ].join("\n");
}

export function buildSummaryPrompt(input: GenerateSummaryInput) {
  const version =
    input.audience === "parent"
      ? PARENT_SUMMARY_PROMPT_VERSION
      : input.audience === "tutor"
        ? TUTOR_SUMMARY_PROMPT_VERSION
        : STUDENT_SUMMARY_PROMPT_VERSION;
  const languageLabel = getLanguageLabel(input.languageCode);

  return {
    version,
    instruction: [
      "Tu rédiges un résumé de session IA DuBoulot.",
      `La sortie finale doit être en ${languageLabel}.`,
      buildAudienceInstruction(input),
      "Retourne un JSON valide avec summaryText, weaknessTags et nextStepRecommendation.",
      input.audience === "student"
        ? "summaryText doit être 2 à 4 phrases courtes ou très courts paragraphes lisibles, sans markdown complexe, centrés sur ce qui a été fait puis sur ce qui reste fragile."
        : "summaryText doit être un paragraphe ou plusieurs courts paragraphes lisibles, sans markdown complexe.",
      "weaknessTags doit contenir 0 à 4 tags maximum.",
      "nextStepRecommendation doit être une action concrète et brève.",
      "",
      "Contexte source",
      input.audience === "student"
        ? buildStudentSummarySourceContext(input)
        : buildSummarySourceContext(input),
    ].join("\n"),
  };
}
