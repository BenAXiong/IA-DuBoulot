import "server-only";

import {
  getLanguageLabel,
  TRANSLATION_PROMPT_VERSION,
} from "@/lib/server/ai/prompts/shared";
import {
  AI_CONTEXT_LIMITS,
  truncateForAiContext,
} from "@/lib/server/ai/guardrails";
import type { TranslateTextInput } from "@/lib/server/ai/types";

export function buildTranslationPrompt(input: TranslateTextInput) {
  const sourceText =
    truncateForAiContext(
      input.sourceText,
      AI_CONTEXT_LIMITS.translationSourceChars,
    ) ?? "";

  return {
    version: TRANSLATION_PROMPT_VERSION,
    instruction: [
      "Tu traduis un texte de suivi scolaire sans en changer le sens.",
      "Ne résume pas et n'ajoute aucune interprétation.",
      `Langue source: ${getLanguageLabel(input.sourceLanguage)}.`,
      `Langue cible: ${getLanguageLabel(input.targetLanguage)}.`,
      "Retourne uniquement le texte traduit.",
      "",
      sourceText,
    ].join("\n"),
  };
}
