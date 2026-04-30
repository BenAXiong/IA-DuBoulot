import "server-only";

import { ATTACHMENT_EXTRACTION_PROMPT_VERSION } from "@/lib/server/ai/prompts/shared";

export function buildAttachmentExtractionPrompt(input: {
  originalFilename: string;
  mimeType: string;
}) {
  return {
    version: ATTACHMENT_EXTRACTION_PROMPT_VERSION,
    instruction: [
      "Tu lis une piece jointe de devoir scolaire et tu dois extraire le texte le plus fidelement possible.",
      "Priorite 1: recopier le texte lisible, les consignes, les questions, les formules, les titres, et les elements de correction visibles.",
      "Priorite 2: garder l'ordre logique du document ou de l'image.",
      "Si certaines zones sont incertaines, n'invente pas; utilise [illisible] ou marque le besoin de relecture.",
      "Retourne un JSON valide avec extractedText, detectedLanguage, confidenceScore, needsManualReview, pageCountEstimate, sourceSummary et sourceOutline.",
      "sourceSummary doit etre un resume court du contenu du document.",
      "sourceOutline doit etre une structure courte et utile du document: prefere les vrais titres de cours, chapitres, parties, methodes, exercices, definitions ou sections dans l'ordre logique.",
      "Pour sourceOutline, conserve les numeros ou prefixes visibles des vrais titres quand ils existent, par exemple I -, II -, A., 1. ou Exercice 4. Ne cree pas de numerotation artificielle si elle n'est pas visible dans le document.",
      "Pour sourceOutline, retourne un item par ligne. Ajoute une reference de page seulement si elle aide, par exemple: Circuit electrique - pages 1-2.",
      "N'utilise une structure page par page que si aucun titre ou section de cours n'est identifiable. Si la structure est faible ou absente, retourne une chaine vide plutot qu'un resume de remplacement.",
      "confidenceScore doit etre un nombre entre 0 et 1.",
      "needsManualReview doit etre true si le texte semble partiel, ambigu, manuscrit de facon incertaine, ou trop degrade.",
      "detectedLanguage doit etre l'un de fr, en, zh, ou null.",
      `Nom de fichier: ${input.originalFilename}`,
      `Type MIME: ${input.mimeType}`,
    ].join("\n"),
  };
}
