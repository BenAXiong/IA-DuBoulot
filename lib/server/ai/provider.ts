import "server-only";

import { env } from "@/lib/env";
import { GeminiAiProvider } from "@/lib/server/ai/gemini-provider";
import type { AiProvider } from "@/lib/server/ai/types";
import { AppError } from "@/lib/server/errors/app-error";

let provider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (provider) {
    return provider;
  }

  if (!env.GEMINI_API_KEY) {
    throw new AppError({
      code: "service_unavailable",
      message: "AI provider is not configured yet.",
      status: 503,
      retryable: true,
    });
  }

  provider = new GeminiAiProvider();
  return provider;
}
