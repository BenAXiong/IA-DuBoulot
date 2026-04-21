import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAiProvider } from "@/lib/server/ai/provider";
import { translateText } from "@/lib/server/translations/service";
import { logRuntimeError, logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import { AppError } from "@/lib/server/errors/app-error";
import type { AppUserRecord } from "@/lib/server/auth/types";
import { recordStudentAiUsageBestEffort } from "@/lib/server/usage/service";
import type {
  AiUsageSnapshot,
  ConversationAttachmentRecord,
  GenerateSummaryInput,
  GenerateSummaryResult,
} from "@/lib/server/ai/types";
import { buildDeterministicStudentSessionSummary } from "@/lib/server/conversations/draft-summary";
import type {
  ConversationMessageRecord,
  ConversationRecord,
  SessionSummaryRecord,
  WorkspaceStateRecord,
} from "@/lib/server/conversations/types";
import { PARENT_SUMMARY_PROMPT_VERSION } from "@/lib/server/ai/prompts/shared";

const SUMMARY_SELECT =
  "id, conversation_id, audience, language_code, summary_text, weakness_tags, next_step_recommendation, generated_model_name, created_at, updated_at";

type GenerateConversationSummariesInput = {
  requestId: string;
  route: string;
  appUser: AppUserRecord;
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord | null;
  messages: ConversationMessageRecord[];
  attachments: ConversationAttachmentRecord[];
  studentOnly?: boolean;
};

function toSummaryServiceError(
  input: GenerateConversationSummariesInput,
  step: string,
  error: unknown,
) {
  logRuntimeError({
    message: "Conversation summary generation failed",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: input.appUser.id,
    actorRole: input.appUser.role,
    targetStudentUserId: input.appUser.id,
    errorCode: "summary_generation_failed",
    details: {
      conversationId: input.conversation.id,
      step,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
            }
          : error,
    },
  });

  return new AppError({
    code: "service_unavailable",
    message: "Unable to generate conversation summaries.",
    status: 503,
    retryable: true,
    cause: error,
  });
}

function logOptionalSummaryFailure(
  input: GenerateConversationSummariesInput,
  step: string,
  error: unknown,
) {
  logRuntimeError({
    message: "Conversation summary generation failed",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: input.appUser.id,
    actorRole: input.appUser.role,
    targetStudentUserId: input.appUser.id,
    errorCode: "summary_generation_failed",
    details: {
      conversationId: input.conversation.id,
      step,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
            }
          : error,
    },
  });
}

async function runSummaryStep<T>(
  input: GenerateConversationSummariesInput,
  step: string,
  operation: () => Promise<T>,
) {
  try {
    return await operation();
  } catch (error) {
    throw toSummaryServiceError(input, step, error);
  }
}

async function runOptionalSummaryStep<T>(
  input: GenerateConversationSummariesInput,
  step: string,
  operation: () => Promise<T>,
) {
  try {
    return await operation();
  } catch (error) {
    logOptionalSummaryFailure(input, step, error);
    return null;
  }
}

function mergeSummaryRecord(
  summaries: SessionSummaryRecord[],
  nextSummary: SessionSummaryRecord,
) {
  const remaining = summaries.filter(
    (summary) =>
      !(
        summary.audience === nextSummary.audience &&
        summary.language_code === nextSummary.language_code
      ),
  );

  return [nextSummary, ...remaining].sort((left, right) =>
    right.created_at.localeCompare(left.created_at),
  );
}

async function upsertSummary(input: {
  conversationId: string;
  audience: SessionSummaryRecord["audience"];
  summary: Pick<
    SessionSummaryRecord,
    | "language_code"
    | "summary_text"
    | "weakness_tags"
    | "next_step_recommendation"
    | "generated_model_name"
  >;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("session_summaries")
    .upsert(
      {
        conversation_id: input.conversationId,
        audience: input.audience,
        ...input.summary,
      },
      {
        onConflict: "conversation_id,audience,language_code",
      },
    )
    .select(SUMMARY_SELECT)
    .single<SessionSummaryRecord>();

  if (error) {
    throw error;
  }

  return data;
}

function toPersistedSummaryFields(
  summary: Pick<
    SessionSummaryRecord,
    | "language_code"
    | "summary_text"
    | "weakness_tags"
    | "next_step_recommendation"
    | "generated_model_name"
  >,
) {
  return {
    language_code: summary.language_code,
    summary_text: summary.summary_text,
    weakness_tags: summary.weakness_tags,
    next_step_recommendation: summary.next_step_recommendation,
    generated_model_name: summary.generated_model_name,
  };
}

function buildBaseSummaryInput(
  input: GenerateConversationSummariesInput,
  audience: GenerateSummaryInput["audience"],
  languageCode: GenerateSummaryInput["languageCode"],
): GenerateSummaryInput {
  return {
    audience,
    languageCode,
    aiHelpLanguage: input.appUser.ai_help_language,
    conversation: input.conversation,
    workspace: input.workspace,
    messages: input.messages,
    attachments: input.attachments,
    requestContext: {
      requestId: input.requestId,
      route: input.route,
      actorUserId: input.appUser.id,
      actorRole: input.appUser.role,
      conversationId: input.conversation.id,
      studentUserId: input.appUser.id,
    },
  };
}

function buildEmptyUsageSnapshot(): AiUsageSnapshot {
  return {
    inputTokens: null,
    outputTokens: null,
    totalTokens: null,
    estimatedCostUsd: null,
  };
}

async function generateRequiredStudentSummary(
  input: GenerateConversationSummariesInput,
  provider: ReturnType<typeof getAiProvider>,
): Promise<GenerateSummaryResult> {
  try {
    const result = await provider.generateSummary(
      buildBaseSummaryInput(input, "student", input.appUser.ai_help_language),
    );
    await recordStudentAiUsageBestEffort({
      studentUserId: input.appUser.id,
      usage: result.usage,
    });
    return result;
  } catch (error) {
    const fallbackSummary = buildDeterministicStudentSessionSummary({
      conversation: input.conversation,
      workspace: input.workspace,
      messages: input.messages,
      languageCode: input.appUser.ai_help_language,
    });

    logRuntimeInfo({
      message: "Fell back to deterministic student summary",
      requestId: input.requestId,
      route: input.route,
      method: "POST",
      actorUserId: input.appUser.id,
      actorRole: input.appUser.role,
      targetStudentUserId: input.appUser.id,
      details: {
        conversationId: input.conversation.id,
        fallback_model: fallbackSummary.generated_model_name,
        reason:
          error instanceof Error ? error.message : "student_summary_provider_failure",
      },
    });

    return {
      ...fallbackSummary,
      promptVersion: "deterministic-summary-v2",
      usage: buildEmptyUsageSnapshot(),
    };
  }
}

export async function generateConversationSummaries(
  input: GenerateConversationSummariesInput,
) {
  const provider = getAiProvider();
  let summaries: SessionSummaryRecord[] = [];

  const studentSummary = await generateRequiredStudentSummary(input, provider);
  summaries = mergeSummaryRecord(
    summaries,
    await runSummaryStep(input, "upsert_student_summary", () =>
      upsertSummary({
        conversationId: input.conversation.id,
        audience: "student",
        summary: toPersistedSummaryFields(studentSummary),
      }),
    ),
  );

  if (input.studentOnly) {
    return summaries;
  }

  const parentBaseSummary = await runOptionalSummaryStep(
    input,
    "generate_parent_summary_fr",
    async () => {
      const result = await provider.generateSummary(
        buildBaseSummaryInput(input, "parent", "fr"),
      );
      await recordStudentAiUsageBestEffort({
        studentUserId: input.appUser.id,
        usage: result.usage,
      });
      return result;
    },
  );
  if (parentBaseSummary) {
    const persistedParentSummary = await runOptionalSummaryStep(
      input,
      "upsert_parent_summary_fr",
      () =>
        upsertSummary({
          conversationId: input.conversation.id,
          audience: "parent",
          summary: toPersistedSummaryFields(parentBaseSummary),
        }),
    );

    if (persistedParentSummary) {
      summaries = mergeSummaryRecord(summaries, persistedParentSummary);
    }

    for (const languageCode of ["en", "zh"] as const) {
      const parentRecommendation = parentBaseSummary.next_step_recommendation;
      const translatedSummary = await runOptionalSummaryStep(
        input,
        `translate_parent_summary_${languageCode}`,
        () =>
          translateText({
            sourceText: parentBaseSummary.summary_text,
            sourceLanguage: "fr",
            targetLanguage: languageCode,
            requestContext: {
              requestId: input.requestId,
              route: input.route,
              actorUserId: input.appUser.id,
              actorRole: input.appUser.role,
              conversationId: input.conversation.id,
              studentUserId: input.appUser.id,
            },
          }),
      );

      if (!translatedSummary) {
        continue;
      }

      const translatedRecommendation = parentRecommendation
        ? await runOptionalSummaryStep(
            input,
            `translate_parent_recommendation_${languageCode}`,
            () =>
              translateText({
                sourceText: parentRecommendation,
                sourceLanguage: "fr",
                targetLanguage: languageCode,
                requestContext: {
                  requestId: input.requestId,
                  route: input.route,
                  actorUserId: input.appUser.id,
                  actorRole: input.appUser.role,
                  conversationId: input.conversation.id,
                  studentUserId: input.appUser.id,
                },
              }),
          )
        : null;

      const persistedTranslatedParentSummary = await runOptionalSummaryStep(
        input,
        `upsert_parent_summary_${languageCode}`,
        () =>
          upsertSummary({
            conversationId: input.conversation.id,
            audience: "parent",
            summary: {
              language_code: languageCode,
              summary_text: translatedSummary.translatedText,
              weakness_tags: parentBaseSummary.weakness_tags,
              next_step_recommendation:
                translatedRecommendation?.translatedText ??
                parentRecommendation,
              generated_model_name:
                parentBaseSummary.generated_model_name
                  ? `${parentBaseSummary.generated_model_name}+${PARENT_SUMMARY_PROMPT_VERSION}`
                  : PARENT_SUMMARY_PROMPT_VERSION,
            },
          }),
      );

      if (!persistedTranslatedParentSummary) {
        continue;
      }

      summaries = mergeSummaryRecord(
        summaries,
        persistedTranslatedParentSummary,
      );
    }
  }

  const tutorSummary = await runOptionalSummaryStep(
    input,
    "generate_tutor_summary_fr",
    async () => {
      const result = await provider.generateSummary(
        buildBaseSummaryInput(input, "tutor", "fr"),
      );
      await recordStudentAiUsageBestEffort({
        studentUserId: input.appUser.id,
        usage: result.usage,
      });
      return result;
    },
  );

  if (tutorSummary) {
    const persistedTutorSummary = await runOptionalSummaryStep(
      input,
      "upsert_tutor_summary_fr",
      () =>
        upsertSummary({
          conversationId: input.conversation.id,
          audience: "tutor",
          summary: toPersistedSummaryFields(tutorSummary),
        }),
    );

    if (persistedTutorSummary) {
      summaries = mergeSummaryRecord(summaries, persistedTutorSummary);
    }
  }

  return summaries;
}
