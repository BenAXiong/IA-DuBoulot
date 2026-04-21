import "server-only";

import {
  buildConversationTitleSourceContext,
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
      "Ne répète pas toute la phrase de l'élève et ne copie jamais un fragment brut ou tronqué du premier message.",
      "Résume le thème scolaire général du devoir ou de la révision, pas la demande formulée mot à mot.",
      "Appuie-toi sur la consigne, le texte extrait et les pièces jointes s'ils rendent le sujet plus clair que le premier message.",
      "Privilégie un intitulé de notion, de chapitre, de comparaison, ou de type d'exercice clair.",
      "Si la matière aide à désambiguïser, tu peux l'intégrer naturellement au titre, mais reste compact.",
      "Mauvais style: 'exercices, le premier la réponse c'. Bon style: 'Circuits en série et en dérivation'.",
      "",
      `Premier message élève: ${input.firstStudentMessageText}`,
      `Première réponse banban: ${input.firstAssistantReplyText}`,
      "",
      "Contexte scolaire utile",
      buildConversationTitleSourceContext({
        conversation: input.conversation,
        attachments: input.attachments,
      }),
    ].join("\n"),
  };
}
