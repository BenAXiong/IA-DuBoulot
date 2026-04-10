import "server-only";

import {
  HarmBlockThreshold,
  HarmCategory,
  type SafetySetting,
} from "@google/genai";

export const GEMINI_PROVIDER_NAME = "gemini";
export const GEMINI_COACH_MODEL = "gemini-2.5-pro";
export const GEMINI_EXTRACTION_MODEL = "gemini-2.5-flash";
export const GEMINI_SUMMARY_MODEL = "gemini-2.5-pro";
export const GEMINI_TRANSLATION_MODEL = "gemini-2.5-flash";
export const GEMINI_UPLOAD_POLL_ATTEMPTS = 20;
export const GEMINI_UPLOAD_POLL_DELAY_MS = 750;
export const GEMINI_ATTACHMENT_CONTEXT_LIMIT = 2;

type GeminiPricingSnapshot = {
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
};

const GEMINI_PRICING: Record<string, GeminiPricingSnapshot> = {
  "gemini-2.5-flash": {
    inputUsdPerMillionTokens: 0.3,
    outputUsdPerMillionTokens: 2.5,
  },
  "gemini-2.5-pro": {
    inputUsdPerMillionTokens: 1.25,
    outputUsdPerMillionTokens: 10,
  },
};

export const GEMINI_DEFAULT_SAFETY_SETTINGS: SafetySetting[] = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

export function estimateGeminiCostUsd(input: {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
}) {
  const pricing = GEMINI_PRICING[input.model];

  if (!pricing) {
    return null;
  }

  const inputCost =
    input.inputTokens === null
      ? 0
      : (input.inputTokens / 1_000_000) * pricing.inputUsdPerMillionTokens;
  const outputCost =
    input.outputTokens === null
      ? 0
      : (input.outputTokens / 1_000_000) * pricing.outputUsdPerMillionTokens;

  return Number((inputCost + outputCost).toFixed(6));
}
