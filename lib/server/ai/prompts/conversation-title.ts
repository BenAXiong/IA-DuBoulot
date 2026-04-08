import "server-only";

import {
  CONVERSATION_TITLE_PROMPT_VERSION,
  getLanguageLabel,
} from "@/lib/server/ai/prompts/shared";
import type { GenerateConversationTitleInput } from "@/lib/server/ai/types";

export function buildConversationTitlePrompt(
  input: GenerateConversationTitleInput,
) {
  const languageLabel = getLanguageLabel(input.languageCode);

  return {
    version: CONVERSATION_TITLE_PROMPT_VERSION,
    instruction: [
      "Tu résumes un nouveau chat élève en un titre très court de type ChatGPT.",
      `Retourne uniquement le titre final en ${languageLabel}.`,
      "Le titre doit faire 3 à 7 mots si possible, rester naturel, et aider l'élève à retrouver rapidement la discussion.",
      "Ne retourne ni guillemets, ni ponctuation finale, ni emoji, ni préfixe comme 'Titre:'.",
      "Ne répète pas toute la phrase de l'élève. Résume le sujet réel du devoir ou de la révision.",
      "Si la matière aide à désambiguïser, tu peux l'intégrer naturellement au titre, mais reste compact.",
      "",
      `Matière: ${input.conversation.subject_tag}`,
      `Premier message élève: ${input.firstStudentMessageText}`,
      `Première réponse banban: ${input.firstAssistantReplyText}`,
    ].join("\n"),
  };
}
