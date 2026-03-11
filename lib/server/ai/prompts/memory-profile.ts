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
      "Tu prepares une memoire pedagogique durable pour IA DuBoulot.",
      `La sortie finale doit etre en ${languageLabel}.`,
      "Retourne uniquement des observations educatives utiles a de futurs devoirs.",
      "Ne stocke pas de diagnostic, sante, psychologie, comportement, jugement moral, situation familiale, origine, religion, politique, sexualite, ou prediction speculative.",
      "N'ecris pas qu'un eleve est 'intelligent', 'paresseux', 'anxieux', 'hyperactif', ou autre etiquette globale.",
      "Ne garde que des points relies a l'apprentissage: notions solides, fragilites observables, preferences de travail explicites, et sujets recurrents.",
      "Si une information n'est pas suffisamment soutenue par le devoir, le transcript, ou les resumes, omets-la.",
      "Retourne un JSON valide avec un tableau items.",
      "Chaque item doit contenir category, title, detail et confidence.",
      "category doit etre l'un de: strength, weakness, preference, topic.",
      "title doit rester court et concret.",
      "detail doit rester breve, factuelle, et purement pedagogique.",
      "confidence doit etre entre 0 et 1.",
      "Retourne 0 a 6 items maximum.",
      "",
      "Contexte source",
      buildMemorySourceContext(input),
    ].join("\n"),
  };
}
