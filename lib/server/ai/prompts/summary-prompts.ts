import "server-only";

import {
  buildSummarySourceContext,
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
      "Ton résumé doit rester motivant, concret, et centré sur la prochaine étape de travail.",
      "N'écris pas une solution complète du devoir.",
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
      "summaryText doit être un paragraphe ou plusieurs courts paragraphes lisibles, sans markdown complexe.",
      "weaknessTags doit contenir 0 à 4 tags maximum.",
      "nextStepRecommendation doit être une action concrète et brève.",
      "",
      "Contexte source",
      buildSummarySourceContext(input),
    ].join("\n"),
  };
}
