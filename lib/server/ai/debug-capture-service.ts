import "server-only";

import type { AiUsageSnapshot } from "@/lib/server/ai/types";
import { logRuntimeError } from "@/lib/server/audit/runtime-logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RecordSuccessfulCoachReplyDebugCaptureInput = {
  requestId: string;
  route: string;
  conversationId: string;
  studentUserId: string;
  studentMessageId: string;
  assistantMessageId: string;
  provider: string;
  requestedModelName: string;
  modelName: string;
  fallbackModelName: string | null;
  promptVersion: string;
  replyMode: string;
  rawOutputText: string;
  finalOutputText: string;
  coachingMode: string;
  asksForAttempt: boolean;
  usage: AiUsageSnapshot;
};

export async function recordSuccessfulCoachReplyDebugCaptureBestEffort(
  input: RecordSuccessfulCoachReplyDebugCaptureInput,
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("ai_generation_debug_captures").insert({
      conversation_id: input.conversationId,
      student_user_id: input.studentUserId,
      student_message_id: input.studentMessageId,
      assistant_message_id: input.assistantMessageId,
      request_id: input.requestId,
      route: input.route,
      provider: input.provider,
      operation: "coach_reply",
      model_name: input.modelName,
      prompt_version: input.promptVersion,
      reply_mode: input.replyMode,
      raw_output_text: input.rawOutputText,
      final_output_text: input.finalOutputText,
      usage_snapshot: {
        inputTokens: input.usage.inputTokens,
        outputTokens: input.usage.outputTokens,
        totalTokens: input.usage.totalTokens,
        estimatedCostUsd: input.usage.estimatedCostUsd,
      },
      metadata: {
        coachingMode: input.coachingMode,
        asksForAttempt: input.asksForAttempt,
        requestedModelName: input.requestedModelName,
        fallbackModelName: input.fallbackModelName,
        usedFallback: input.requestedModelName !== input.modelName,
      },
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logRuntimeError({
      message: "Unable to persist successful AI debug capture",
      requestId: input.requestId,
      route: input.route,
      method: "POST",
      actorUserId: input.studentUserId,
      actorRole: "student",
      provider: input.provider,
      targetStudentUserId: input.studentUserId,
      errorCode: "debug_capture_persist_failed",
      details: {
        conversationId: input.conversationId,
        operation: "coach_reply",
        model: input.modelName,
        promptVersion: input.promptVersion,
        error:
          error instanceof Error ? error.message : "Unknown debug capture failure",
      },
    });
  }
}
