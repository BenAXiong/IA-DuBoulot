import "server-only";

import {
  getLanguageLabel,
  TRANSLATION_PROMPT_VERSION,
} from "@/lib/server/ai/prompts/shared";
import type { TranslateTextInput } from "@/lib/server/ai/types";

export function buildTranslationPrompt(input: TranslateTextInput) {
  return {
    version: TRANSLATION_PROMPT_VERSION,
    instruction: [
      "Tu traduis un texte de suivi scolaire sans en changer le sens.",
      "Ne resume pas et n'ajoute aucune interpretation.",
      `Langue source: ${getLanguageLabel(input.sourceLanguage)}.`,
      `Langue cible: ${getLanguageLabel(input.targetLanguage)}.`,
      "Retourne uniquement le texte traduit.",
      "",
      input.sourceText,
    ].join("\n"),
  };
}
