import "server-only";

import { getDeterministicStudentSummaryCopy } from "@/lib/i18n/student-flow-copy";
import type {
  ConversationMessageRecord,
  ConversationRecord,
  SessionSummaryRecord,
  WorkspaceStateRecord,
} from "@/lib/server/conversations/types";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type BuildStudentSessionSummaryInput = {
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord | null;
  messages: ConversationMessageRecord[];
  languageCode: UiLanguageCode;
};

type DeterministicSessionSummary = Pick<
  SessionSummaryRecord,
  | "language_code"
  | "summary_text"
  | "weakness_tags"
  | "next_step_recommendation"
  | "generated_model_name"
>;

function compactText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function normalizeSummaryText(value: string | null | undefined) {
  const compacted = compactText(value);

  if (!compacted) {
    return null;
  }

  const withoutSourceLabels = compacted.replace(
    /\[(Source|Source :|來源：|來源:)[^\]]+\]/gi,
    " ",
  );
  const withoutMarkdown = withoutSourceLabels
    .replace(/[*_`#>-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return withoutMarkdown.length > 0 ? withoutMarkdown : null;
}

function truncateSnippet(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  const shortened = value.slice(0, maxLength).trim();
  const lastBoundary = Math.max(
    shortened.lastIndexOf("."),
    shortened.lastIndexOf(","),
    shortened.lastIndexOf(";"),
    shortened.lastIndexOf(":"),
    shortened.lastIndexOf(" "),
  );

  if (lastBoundary >= Math.floor(maxLength * 0.55)) {
    return shortened.slice(0, lastBoundary).trim();
  }

  return shortened;
}

function splitIntoSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function isPlaceholderTitle(title: string) {
  return /^Subject_\d+$/i.test(title.trim());
}

function buildCombinedContextText(input: BuildStudentSessionSummaryInput) {
  return [
    input.conversation.subject_tag,
    input.conversation.title,
    input.conversation.assignment_text,
    input.conversation.edited_extracted_text,
    input.workspace?.assignment_text,
    input.workspace?.edited_extracted_text,
    ...input.messages.map((message) => message.content_text),
  ]
    .map((value) => normalizeSummaryText(value))
    .filter((value): value is string => Boolean(value))
    .join(" \n ");
}

function buildFallbackTopic(input: BuildStudentSessionSummaryInput) {
  const subject = input.conversation.subject_tag.toLowerCase();

  if (subject.includes("math")) {
    return "le point principal de maths travaillé pendant cette séance";
  }

  if (
    subject.includes("phys") ||
    subject.includes("chim") ||
    subject.includes("svt")
  ) {
    return "la notion scientifique travaillée pendant cette séance";
  }

  if (subject.includes("histoire") || subject.includes("geo")) {
    return "le chapitre d'histoire-géographie travaillé pendant cette séance";
  }

  if (subject.includes("fran") || subject.includes("lang")) {
    return "la notion de français travaillée pendant cette séance";
  }

  return "le point principal travaillé pendant cette séance";
}

function inferTopicLabel(input: BuildStudentSessionSummaryInput) {
  const subject = input.conversation.subject_tag.toLowerCase();
  const contextText = buildCombinedContextText(input).toLowerCase();

  if (
    subject.includes("phys") ||
    subject.includes("chim") ||
    subject.includes("svt")
  ) {
    if (
      contextText.includes("circuit") &&
      (contextText.includes("parall") ||
        contextText.includes("dérivation") ||
        contextText.includes("derivation"))
    ) {
      return "les circuits en série et en dérivation";
    }

    if (contextText.includes("tension") && contextText.includes("voltm")) {
      return "la tension électrique, son unité et sa mesure";
    }

    if (contextText.includes("tension")) {
      return "la tension électrique";
    }
  }

  if (subject.includes("histoire") || subject.includes("geo")) {
    if (
      contextText.includes("jeanne d'arc") ||
      contextText.includes("jeanne d arc")
    ) {
      return "Jeanne d'Arc et la guerre de Cent Ans";
    }

    if (
      contextText.includes("egypte ancienne") ||
      contextText.includes("égypte ancienne")
    ) {
      return "l'Égypte ancienne";
    }
  }

  if (subject.includes("math")) {
    if (contextText.includes("fraction")) {
      return "les fractions";
    }

    if (contextText.includes("programme de calcul")) {
      return "les programmes de calcul";
    }
  }

  if (subject.includes("fran") || subject.includes("lang")) {
    if (
      contextText.includes("pronom relatif") ||
      contextText.includes("pronoms relatifs")
    ) {
      return "les pronoms relatifs";
    }
  }

  const candidates = [
    input.workspace?.assignment_text,
    input.conversation.assignment_text,
    input.workspace?.edited_extracted_text,
    input.conversation.edited_extracted_text,
    input.messages.find((message) => message.role === "student")?.content_text,
    isPlaceholderTitle(input.conversation.title) ? null : input.conversation.title,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeSummaryText(candidate);

    if (!normalized) {
      continue;
    }

    const sentence =
      splitIntoSentences(normalized).find((entry) => entry.length >= 18) ??
      normalized;
    const cleaned = truncateSnippet(sentence, 120)
      .replace(/[.:;,!?]+$/g, "")
      .trim();

    if (cleaned.length >= 12) {
      return cleaned;
    }
  }

  return buildFallbackTopic(input);
}

function cleanAssistantSentence(value: string) {
  return value
    .replace(
      /^(bonjour|salut|d'accord|parfait|exactement|oui|tu as tout à fait raison|tu as bien raison|c'est une excellente réponse|c'est exact)[\s,!:.;-]*/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function buildValidatedFocus(input: BuildStudentSessionSummaryInput) {
  const assistantMessages = input.messages
    .filter((message) => message.role === "assistant")
    .map((message) => normalizeSummaryText(message.content_text))
    .filter((value): value is string => Boolean(value))
    .reverse();

  for (const message of assistantMessages) {
    for (const sentence of splitIntoSentences(message)) {
      const cleaned = cleanAssistantSentence(sentence);

      if (
        cleaned.length < 24 ||
        cleaned.endsWith("?") ||
        /^je suis banban/i.test(cleaned) ||
        /^laisse-moi voir/i.test(cleaned)
      ) {
        continue;
      }

      return truncateSnippet(cleaned, 150)
        .replace(/[.:;,!?]+$/g, "")
        .trim();
    }
  }

  return null;
}

function inferWeaknessTags(input: BuildStudentSessionSummaryInput) {
  const tags = new Set<string>();
  const subject = input.conversation.subject_tag.toLowerCase();
  const contextText = buildCombinedContextText(input).toLowerCase();

  if (
    subject.includes("phys") ||
    subject.includes("chim") ||
    subject.includes("svt")
  ) {
    if (
      contextText.includes("volt") ||
      contextText.includes("unité") ||
      contextText.includes("unite") ||
      contextText.includes("symbole")
    ) {
      tags.add("maitrise_des_unites");
    }

    if (
      contextText.includes("circuit") ||
      contextText.includes("schéma") ||
      contextText.includes("schema") ||
      contextText.includes("parall") ||
      contextText.includes("série") ||
      contextText.includes("serie")
    ) {
      tags.add("lecture_de_schema");
    }

    tags.add("vocabulaire_scientifique");
    tags.add("justification_du_raisonnement");
  }

  if (subject.includes("math")) {
    tags.add("justification_du_raisonnement");
    tags.add("lecture_de_consigne");
  }

  if (subject.includes("histoire") || subject.includes("geo")) {
    tags.add("reperes_historiques");
    tags.add("selection_des_infos_cles");
    tags.add("restitution_des_connaissances");
  }

  if (subject.includes("fran") || subject.includes("lang")) {
    tags.add("grammaire_en_contexte");
    tags.add("vocabulaire_et_expression");
    tags.add("justification_des_reponses");
  }

  if (tags.size === 0) {
    tags.add("lecture_de_consigne");
    tags.add("justification_des_reponses");
  }

  return Array.from(tags).slice(0, 4);
}

function buildNextStepRecommendation(
  weaknessTags: string[],
  topicLabel: string,
  languageCode: UiLanguageCode,
) {
  const copy = getDeterministicStudentSummaryCopy(languageCode);
  const shortTopic = truncateSnippet(topicLabel, 72)
    .replace(/[.:;,!?]+$/g, "")
    .trim();
  const primaryTag = weaknessTags[0] ?? "generic";

  switch (primaryTag) {
    case "maitrise_des_unites":
      return copy.nextSteps.masterUnits;
    case "lecture_de_schema":
      return copy.nextSteps.readDiagram;
    case "reperes_historiques":
      return copy.nextSteps.historyRecall;
    case "selection_des_infos_cles":
      return copy.nextSteps.selectKeyIdeas;
    case "grammaire_en_contexte":
      return copy.nextSteps.grammarPractice;
    case "vocabulaire_et_expression":
      return copy.nextSteps.expressionPractice;
    default:
      return copy.nextSteps.generic(shortTopic);
  }
}

export function buildDeterministicStudentSessionSummary(
  input: BuildStudentSessionSummaryInput,
): DeterministicSessionSummary {
  const copy = getDeterministicStudentSummaryCopy(input.languageCode);
  const weaknessTags = inferWeaknessTags(input);
  const topicLabel = inferTopicLabel(input);
  const validatedFocus = buildValidatedFocus(input);
  const nextStepRecommendation = buildNextStepRecommendation(
    weaknessTags,
    topicLabel,
    input.languageCode,
  );
  const summaryText = [
    copy.summary.workedOn(topicLabel),
    validatedFocus
      ? copy.summary.progress(validatedFocus)
      : copy.summary.progressFallback,
  ].join("\n\n");

  return {
    language_code: input.languageCode,
    summary_text: summaryText,
    weakness_tags: weaknessTags,
    next_step_recommendation: nextStepRecommendation,
    generated_model_name: "deterministic-summary-v2",
  };
}
