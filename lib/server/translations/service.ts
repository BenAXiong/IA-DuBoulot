import "server-only";

import { getAiProvider } from "@/lib/server/ai/provider";
import type { TranslateTextInput } from "@/lib/server/ai/types";
import { recordStudentAiUsageBestEffort } from "@/lib/server/usage/service";

export async function translateText(input: TranslateTextInput) {
  const provider = getAiProvider();
  const result = await provider.translateText(input);

  if (input.requestContext.studentUserId) {
    await recordStudentAiUsageBestEffort({
      studentUserId: input.requestContext.studentUserId,
      usage: result.usage,
    });
  }

  return result;
}
