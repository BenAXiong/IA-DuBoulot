import "server-only";

import {
  buildMemorySourceContext,
  getLanguageLabel,
  MEMORY_PROFILE_PROMPT_VERSION,
} from "@/lib/server/ai/prompts/shared";
import type { GenerateMemoryProfileInput } from "@/lib/server/ai/types";

export function buildMemoryProfilePrompt(input: GenerateMemoryProfileInput) {
  const languageLabel = getLanguageLabel(input.languageCode);

  return {
    version: MEMORY_PROFILE_PROMPT_VERSION,
    instruction: [
      "Tu prépares une mémoire pédagogique durable pour IA DuBoulot.",
      `La sortie finale doit être en ${languageLabel}.`,
      "Retourne uniquement des observations éducatives utiles à de futurs devoirs.",
      "Ne stocke pas de diagnostic, santé, psychologie, comportement, jugement moral, situation familiale, origine, religion, politique, sexualité, ou prédiction spéculative.",
      "N'écris pas qu'un élève est 'intelligent', 'paresseux', 'anxieux', 'hyperactif', ou autre étiquette globale.",
      "Ne garde que des points reliés à l'apprentissage: notions solides, fragilités observables, préférences de travail explicites, et sujets récurrents.",
      "Si une information n'est pas suffisamment soutenue par le devoir, le transcript, ou les résumés, omets-la.",
      "Retourne un JSON valide avec un tableau items.",
      "Chaque item doit contenir category, title, detail et confidence.",
      "category doit être l'un de: strength, weakness, preference, topic.",
      "title doit rester court et concret.",
      "detail doit rester brève, factuelle, et purement pédagogique.",
      "confidence doit être entre 0 et 1.",
      "Retourne 0 à 6 items maximum.",
      "",
      "Contexte source",
      buildMemorySourceContext(input),
    ].join("\n"),
  };
}
