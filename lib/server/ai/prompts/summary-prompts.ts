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
      "Audience: eleve.",
      "Ton resume doit rester motivant, concret, et centre sur la prochaine etape de travail.",
      "N'ecris pas une solution complete du devoir.",
      "Les weaknessTags doivent rester pedagogiques et courts en snake_case francais.",
    ].join("\n");
  }

  if (input.audience === "parent") {
    return [
      "Audience: parent.",
      "Resume ce que l'eleve a travaille, ce qui reste fragile, et la prochaine etape utile.",
      "Le ton doit etre clair, rassurant, et non technique.",
      "N'ajoute pas de diagnostic psychologique ou de jugement personnel.",
      "Les weaknessTags doivent rester pedagogiques et courts en snake_case francais.",
    ].join("\n");
  }

  return [
    "Audience: tuteur.",
    "Fournis un resume plus operationnel, avec points faibles observables et prochaine intervention conseillee.",
    "Les weaknessTags doivent etre actionnables, courts, et en snake_case francais.",
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
      "Tu rediges un resume de session IA DuBoulot.",
      `La sortie finale doit etre en ${languageLabel}.`,
      buildAudienceInstruction(input),
      "Retourne un JSON valide avec summaryText, weaknessTags et nextStepRecommendation.",
      "summaryText doit etre un paragraphe ou plusieurs courts paragraphes lisibles, sans markdown complexe.",
      "weaknessTags doit contenir 0 a 4 tags maximum.",
      "nextStepRecommendation doit etre une action concrete et breve.",
      "",
      "Contexte source",
      buildSummarySourceContext(input),
    ].join("\n"),
  };
}
