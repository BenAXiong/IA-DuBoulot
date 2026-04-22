import "server-only";

import {
  type ContentListUnion,
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
  Type,
} from "@google/genai";
import { env } from "@/lib/env";
import {
  estimateGeminiCostUsd,
  GEMINI_ATTACHMENT_CONTEXT_LIMIT,
  GEMINI_COACH_MODEL,
  GEMINI_DEFAULT_SAFETY_SETTINGS,
  GEMINI_EXTRACTION_MODEL,
  GEMINI_PROVIDER_NAME,
  GEMINI_SUMMARY_MODEL,
  GEMINI_TITLE_MODEL,
  GEMINI_TRANSLATION_MODEL,
  GEMINI_UPLOAD_POLL_ATTEMPTS,
  GEMINI_UPLOAD_POLL_DELAY_MS,
} from "@/lib/server/ai/config";
import {
  AI_CONTEXT_LIMITS,
  AI_OUTPUT_TOKEN_LIMITS,
  truncateForAiContext,
} from "@/lib/server/ai/guardrails";
import { buildAttachmentExtractionPrompt } from "@/lib/server/ai/prompts/attachment-extraction";
import { buildConversationTitlePrompt } from "@/lib/server/ai/prompts/conversation-title";
import { buildMemoryProfilePrompt } from "@/lib/server/ai/prompts/memory-profile";
import { buildStudentCoachSystemPrompt } from "@/lib/server/ai/prompts/student-coach";
import { buildSummaryPrompt } from "@/lib/server/ai/prompts/summary-prompts";
import { buildTranslationPrompt } from "@/lib/server/ai/prompts/translation";
import type {
  AiProvider,
  AiProviderLogContext,
  AiUsageSnapshot,
  ConversationAttachmentRecord,
  ExtractAttachmentTextInput,
  ExtractAttachmentTextResult,
  GenerateCoachReplyInput,
  GenerateCoachReplyResult,
  GenerateConversationTitleInput,
  GenerateConversationTitleResult,
  MemoryGenerationItem,
  GenerateMemoryProfileInput,
  GenerateMemoryProfileResult,
  GenerateSummaryInput,
  GenerateSummaryResult,
  TranslateTextInput,
  TranslateTextResult,
} from "@/lib/server/ai/types";
import { logRuntimeError, logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import { AppError } from "@/lib/server/errors/app-error";

type JsonSchema = {
  type: Type;
  properties?: Record<string, unknown>;
  items?: unknown;
  required?: string[];
};

type GeneratedUsageResult = {
  responseText: string;
  modelName: string;
  usage: AiUsageSnapshot;
};

type GeneratedTextResult = {
  responseText: string;
  requestedModelName: string;
  modelName: string;
  fallbackModelName: string | null;
  usage: AiUsageSnapshot;
};

type GeminiResponseMeta = {
  finishReason: string | null;
  promptBlockReason: string | null;
  candidateCount: number;
};

type GeminiUsageMeta = {
  promptTokenCount: number | null;
  candidatesTokenCount: number | null;
  totalTokenCount: number | null;
  thoughtsTokenCount: number | null;
  toolUsePromptTokenCount: number | null;
  cachedContentTokenCount: number | null;
};

type GeminiUsageExtraction = {
  usage: AiUsageSnapshot;
  logDetails: Record<string, unknown>;
};

function sleep(delayMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeUiLanguage(value: unknown) {
  if (value === "fr" || value === "en" || value === "zh") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (["french", "français", "francais"].includes(normalized)) {
    return "fr";
  }

  if (["english", "anglais"].includes(normalized)) {
    return "en";
  }

  if (["chinese", "mandarin", "zhongwen", "中文"].includes(normalized)) {
    return "zh";
  }

  return null;
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function extractProviderFailureDetails(error: unknown) {
  const details: Record<string, unknown> = {};
  const record =
    error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const httpStatus =
    typeof record?.status === "number"
      ? record.status
      : typeof record?.statusCode === "number"
        ? record.statusCode
        : null;
  const message =
    error instanceof Error
      ? error.message
      : typeof record?.message === "string"
        ? record.message
        : null;
  const name =
    error instanceof Error
      ? error.name
      : typeof record?.name === "string"
        ? record.name
        : null;
  const providerBody =
    record?.error && typeof record.error === "object"
      ? (record.error as Record<string, unknown>)
      : null;
  const providerStatus =
    typeof providerBody?.status === "string" ? providerBody.status : null;
  const providerCode =
    typeof providerBody?.code === "number" ? providerBody.code : null;
  const providerMessage =
    typeof providerBody?.message === "string" ? providerBody.message : null;
  const providerDetailsJson = safeJson(providerBody?.details);
  const isRateLimited =
    httpStatus === 429 ||
    providerCode === 429 ||
    providerStatus === "RESOURCE_EXHAUSTED" ||
    name === "RateLimitError";

  if (name) {
    details.provider_error_name = name;
  }

  if (httpStatus !== null) {
    details.provider_http_status = httpStatus;
  }

  if (message) {
    details.provider_error_message = message;
  }

  if (providerStatus) {
    details.provider_status = providerStatus;
  }

  if (providerCode !== null) {
    details.provider_code = providerCode;
  }

  if (providerMessage) {
    details.provider_body_message = providerMessage;
  }

  if (providerDetailsJson) {
    details.provider_details = providerDetailsJson;
  }

  return {
    appErrorCode: isRateLimited ? "rate_limited" : "provider_error",
    appErrorStatus: isRateLimited ? 429 : 502,
    appErrorMessage: isRateLimited
      ? "The AI provider is temporarily rate limited."
      : "The AI provider request failed.",
    logDetails: details,
  } as const;
}

function shouldRetryProviderFailure(error: unknown) {
  const record =
    error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const httpStatus =
    typeof record?.status === "number"
      ? record.status
      : typeof record?.statusCode === "number"
        ? record.statusCode
        : null;
  const providerBody =
    record?.error && typeof record.error === "object"
      ? (record.error as Record<string, unknown>)
      : null;
  const providerStatus =
    typeof providerBody?.status === "string" ? providerBody.status : null;

  return (
    httpStatus === 429 ||
    httpStatus === 503 ||
    providerStatus === "RESOURCE_EXHAUSTED" ||
    providerStatus === "UNAVAILABLE"
  );
}

function toProviderError(cause: unknown) {
  const failure = extractProviderFailureDetails(cause);

  return new AppError({
    code: failure.appErrorCode,
    message: failure.appErrorMessage,
    status: failure.appErrorStatus,
    retryable: true,
    details: failure.logDetails,
    cause,
  });
}

function buildUsageSnapshot(input: {
  modelName: string;
  inputTokens: number | null;
  outputTokens: number | null;
}) {
  const totalTokens =
    input.inputTokens === null && input.outputTokens === null
      ? null
      : (input.inputTokens ?? 0) + (input.outputTokens ?? 0);

  return {
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    totalTokens,
    estimatedCostUsd: estimateGeminiCostUsd({
      model: input.modelName,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
    }),
  } satisfies AiUsageSnapshot;
}

function normalizeGeminiEnumValue(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function extractGeminiResponseMeta(response: unknown): GeminiResponseMeta {
  const record =
    response && typeof response === "object"
      ? (response as Record<string, unknown>)
      : null;
  const candidates = Array.isArray(record?.candidates)
    ? (record.candidates as Array<Record<string, unknown>>)
    : [];
  const firstCandidate =
    candidates.length > 0 && candidates[0] && typeof candidates[0] === "object"
      ? candidates[0]
      : null;
  const promptFeedback =
    record?.promptFeedback && typeof record.promptFeedback === "object"
      ? (record.promptFeedback as Record<string, unknown>)
      : null;

  return {
    finishReason: normalizeGeminiEnumValue(firstCandidate?.finishReason),
    promptBlockReason: normalizeGeminiEnumValue(promptFeedback?.blockReason),
    candidateCount: candidates.length,
  };
}

function extractGeminiUsageMeta(response: unknown): GeminiUsageMeta {
  const record =
    response && typeof response === "object"
      ? (response as Record<string, unknown>)
      : null;
  const usageMetadata =
    record?.usageMetadata && typeof record.usageMetadata === "object"
      ? (record.usageMetadata as Record<string, unknown>)
      : null;

  return {
    promptTokenCount: asNumber(usageMetadata?.promptTokenCount),
    candidatesTokenCount: asNumber(usageMetadata?.candidatesTokenCount),
    totalTokenCount: asNumber(usageMetadata?.totalTokenCount),
    thoughtsTokenCount: asNumber(usageMetadata?.thoughtsTokenCount),
    toolUsePromptTokenCount: asNumber(usageMetadata?.toolUsePromptTokenCount),
    cachedContentTokenCount: asNumber(usageMetadata?.cachedContentTokenCount),
  };
}

function extractTextFromGeminiCandidateParts(response: unknown) {
  const record =
    response && typeof response === "object"
      ? (response as Record<string, unknown>)
      : null;
  const candidates = Array.isArray(record?.candidates)
    ? (record.candidates as Array<Record<string, unknown>>)
    : [];
  const textParts = candidates.flatMap((candidate) => {
    const content =
      candidate?.content && typeof candidate.content === "object"
        ? (candidate.content as Record<string, unknown>)
        : null;
    const parts = Array.isArray(content?.parts)
      ? (content.parts as Array<Record<string, unknown>>)
      : [];

    return parts
      .map((part) => (typeof part?.text === "string" ? part.text.trim() : null))
      .filter((value): value is string => Boolean(value));
  });

  if (textParts.length === 0) {
    return null;
  }

  return textParts.join("\n").trim() || null;
}

function buildGeminiCandidatePartSummaries(response: unknown) {
  const record =
    response && typeof response === "object"
      ? (response as Record<string, unknown>)
      : null;
  const candidates = Array.isArray(record?.candidates)
    ? (record.candidates as Array<Record<string, unknown>>)
    : [];

  return candidates.map((candidate, index) => {
    const content =
      candidate?.content && typeof candidate.content === "object"
        ? (candidate.content as Record<string, unknown>)
        : null;
    const parts = Array.isArray(content?.parts)
      ? (content.parts as Array<Record<string, unknown>>)
      : [];
    const textLengths = parts
      .map((part) => (typeof part?.text === "string" ? part.text.trim().length : null))
      .filter((value): value is number => typeof value === "number");
    const partKinds = Array.from(
      new Set(
        parts.flatMap((part) =>
          Object.keys(part).filter((key) => key !== "text" && part[key] != null),
        ),
      ),
    );

    return {
      candidateIndex: index,
      finishReason: normalizeGeminiEnumValue(candidate?.finishReason),
      partCount: parts.length,
      textPartCount: textLengths.length,
      textPartLengths: textLengths,
      partKinds,
    };
  });
}

function inspectGeminiStructuredPayload(response: unknown) {
  const directText =
    response && typeof response === "object"
      ? asString((response as Record<string, unknown>).text)
      : null;
  const candidateText = extractTextFromGeminiCandidateParts(response);
  const fencedMatch = candidateText?.match(/```(?:json)?\s*([\s\S]+?)\s*```/i);
  const normalizedPayload =
    directText ?? fencedMatch?.[1]?.trim() ?? candidateText?.trim() ?? null;
  const responseMeta = extractGeminiResponseMeta(response);
  const candidateSummaries = buildGeminiCandidatePartSummaries(response);

  return {
    normalizedPayload,
    responseMeta,
    logDetails: {
      provider_finish_reason: responseMeta.finishReason,
      provider_prompt_block_reason: responseMeta.promptBlockReason,
      provider_candidate_count: responseMeta.candidateCount,
      structured_json_direct_text_present: Boolean(directText),
      structured_json_direct_text_length: directText?.length ?? null,
      structured_json_candidate_text_present: Boolean(candidateText),
      structured_json_candidate_text_length: candidateText?.length ?? null,
      structured_json_fenced_payload_detected: Boolean(fencedMatch),
      structured_json_normalized_payload_length: normalizedPayload?.length ?? null,
      structured_json_candidate_summaries:
        candidateSummaries.length > 0 ? safeJson(candidateSummaries) : null,
    } satisfies Record<string, unknown>,
  };
}

function isGeminiCleanStopReason(value: string | null) {
  return value === "STOP" || value === "FINISH_REASON_UNSPECIFIED";
}

function looksLikeObviouslyCutOffText(value: string) {
  const trimmed = value.trimEnd();

  if (trimmed.length < 200) {
    return false;
  }

  const lastLine = trimmed.split(/\r?\n/).at(-1)?.trim() ?? "";

  if (!lastLine || lastLine.length < 40) {
    return false;
  }

  if (/[.!?…。！？…]["')\]»”’]*$/u.test(lastLine)) {
    return false;
  }

  if (/[:;,\-–—(/]\s*$/u.test(lastLine)) {
    return true;
  }

  if (/\n\s*(?:[-*]|\d+\.)\s+/u.test(trimmed)) {
    return true;
  }

  const finalWord =
    lastLine.match(/([\p{L}\p{N}'’_-]+)\s*$/u)?.[1]?.toLowerCase() ?? "";

  return [
    "and",
    "or",
    "to",
    "of",
    "for",
    "with",
    "the",
    "a",
    "an",
    "et",
    "ou",
    "de",
    "des",
    "du",
    "la",
    "le",
    "les",
    "un",
    "une",
    "dans",
    "sur",
    "avec",
    "pour",
    "à",
    "au",
    "aux",
  ].includes(finalWord);
}

function buildSuspiciousSuccessDetails(input: {
  responseText: string;
  responseMeta: GeminiResponseMeta;
}) {
  if (
    input.responseMeta.finishReason &&
    !isGeminiCleanStopReason(input.responseMeta.finishReason)
  ) {
    return {
      reason: "finish_reason",
      details: {
        provider_finish_reason: input.responseMeta.finishReason,
        provider_prompt_block_reason: input.responseMeta.promptBlockReason,
        provider_candidate_count: input.responseMeta.candidateCount,
        truncated_success_output: true,
      },
    };
  }

  if (looksLikeObviouslyCutOffText(input.responseText)) {
    return {
      reason: "text_heuristic",
      details: {
        provider_finish_reason: input.responseMeta.finishReason,
        provider_prompt_block_reason: input.responseMeta.promptBlockReason,
        provider_candidate_count: input.responseMeta.candidateCount,
        heuristic_cutoff_detected: true,
        truncated_success_output: true,
      },
    };
  }

  return null;
}

function buildEmptyTextPayloadDetails(response: unknown) {
  const responseMeta = extractGeminiResponseMeta(response);

  return {
    provider_finish_reason: responseMeta.finishReason,
    provider_prompt_block_reason: responseMeta.promptBlockReason,
    provider_candidate_count: responseMeta.candidateCount,
    empty_text_payload: true,
  };
}

function shouldRetryOutputIssue(error: unknown) {
  if (!(error instanceof AppError)) {
    return false;
  }

  const details = error.details ?? {};

  return (
    details.empty_text_payload === true ||
    details.truncated_success_output === true
  );
}

function buildLogDetails(input: {
  operation: string;
  modelName: string;
  usage: AiUsageSnapshot;
  extra?: Record<string, unknown>;
}) {
  return {
    operation: input.operation,
    model: input.modelName,
    input_tokens: input.usage.inputTokens,
    output_tokens: input.usage.outputTokens,
    total_tokens: input.usage.totalTokens,
    estimated_cost_usd: input.usage.estimatedCostUsd,
    ...(input.extra ?? {}),
  };
}

function buildAttachmentParts(attachments: ConversationAttachmentRecord[]) {
  return attachments
    .filter((attachment) => attachment.raw_extracted_text?.trim())
    .slice(-GEMINI_ATTACHMENT_CONTEXT_LIMIT)
    .map((attachment) => {
      const extractedText =
        truncateForAiContext(
          attachment.raw_extracted_text,
          AI_CONTEXT_LIMITS.attachmentPartChars,
        ) ?? "";

      return [
        `Piece jointe: ${attachment.original_filename} (${attachment.mime_type})`,
        extractedText,
      ].join("\n");
    });
}

export class GeminiAiProvider implements AiProvider {
  readonly name = GEMINI_PROVIDER_NAME;
  private readonly client = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

  private async countTextTokens(model: string, text: string) {
    if (!text.trim()) {
      return 0;
    }

    try {
      const response = await this.client.models.countTokens({
        model,
        contents: text,
      });
      return response.totalTokens ?? 0;
    } catch {
      return null;
    }
  }

  private async countContentTokens(model: string, contents: ContentListUnion) {
    try {
      const response = await this.client.models.countTokens({
        model,
        contents,
      });
      return response.totalTokens ?? 0;
    } catch {
      return null;
    }
  }

  private async buildUsageFromGeminiResponse(input: {
    response: unknown;
    modelName: string;
    fallbackInputTokens: () => Promise<number | null>;
    fallbackOutputTokens: () => Promise<number | null>;
  }): Promise<GeminiUsageExtraction> {
    const usageMeta = extractGeminiUsageMeta(input.response);
    let inputTokens = usageMeta.promptTokenCount;
    let outputTokens = usageMeta.candidatesTokenCount;
    let usageSource = "provider_usage_metadata";

    if (inputTokens === null) {
      inputTokens = await input.fallbackInputTokens();
      usageSource = "mixed_fallback";
    }

    if (outputTokens === null) {
      outputTokens = await input.fallbackOutputTokens();
      usageSource =
        usageSource === "provider_usage_metadata"
          ? "mixed_fallback"
          : "count_tokens_fallback";
    }

    if (
      usageMeta.promptTokenCount === null &&
      usageMeta.candidatesTokenCount === null
    ) {
      usageSource = "count_tokens_fallback";
    }

    return {
      usage: buildUsageSnapshot({
        modelName: input.modelName,
        inputTokens,
        outputTokens,
      }),
      logDetails: {
        usage_source: usageSource,
        provider_prompt_token_count: usageMeta.promptTokenCount,
        provider_candidates_token_count: usageMeta.candidatesTokenCount,
        provider_total_token_count: usageMeta.totalTokenCount,
        provider_thoughts_token_count: usageMeta.thoughtsTokenCount,
        provider_tool_use_prompt_token_count: usageMeta.toolUsePromptTokenCount,
        provider_cached_content_token_count: usageMeta.cachedContentTokenCount,
      },
    };
  }

  private logSuccess(input: {
    context: AiProviderLogContext;
    operation: string;
    modelName: string;
    usage: AiUsageSnapshot;
    extra?: Record<string, unknown>;
  }) {
    logRuntimeInfo({
      message: "Gemini provider call succeeded",
      requestId: input.context.requestId,
      route: input.context.route,
      method: "POST",
      actorUserId: input.context.actorUserId,
      actorRole: input.context.actorRole,
      provider: GEMINI_PROVIDER_NAME,
      targetStudentUserId: input.context.studentUserId,
      details: {
        conversationId: input.context.conversationId,
        attachmentId: input.context.attachmentId,
        ...buildLogDetails({
          operation: input.operation,
          modelName: input.modelName,
          usage: input.usage,
          extra: input.extra,
        }),
      },
    });
  }

  private logFailure(input: {
    context: AiProviderLogContext;
    operation: string;
    modelName: string;
    errorCode: string;
    extra?: Record<string, unknown>;
  }) {
    logRuntimeError({
      message: "Gemini provider call failed",
      requestId: input.context.requestId,
      route: input.context.route,
      method: "POST",
      actorUserId: input.context.actorUserId,
      actorRole: input.context.actorRole,
      provider: GEMINI_PROVIDER_NAME,
      targetStudentUserId: input.context.studentUserId,
      errorCode: input.errorCode,
      details: {
        conversationId: input.context.conversationId,
        attachmentId: input.context.attachmentId,
        operation: input.operation,
        model: input.modelName,
        ...(input.extra ?? {}),
      },
    });
  }

  private async generateJsonResponse<T>(input: {
    model: string;
    systemInstruction: string;
    contents: ContentListUnion;
    responseSchema: JsonSchema;
    requestContext: AiProviderLogContext;
    operation: string;
    extraLogDetails?: Record<string, unknown>;
    maxOutputTokens?: number;
  }): Promise<T & GeneratedUsageResult> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await this.client.models.generateContent({
          model: input.model,
          contents: input.contents,
          config: {
            temperature: 0.2,
            safetySettings: GEMINI_DEFAULT_SAFETY_SETTINGS,
            systemInstruction: input.systemInstruction,
            responseMimeType: "application/json",
            responseSchema: input.responseSchema,
            maxOutputTokens: input.maxOutputTokens,
          },
        });
        const payloadInspection = inspectGeminiStructuredPayload(response);
        const responseText = payloadInspection.normalizedPayload;

        if (!responseText) {
          throw new AppError({
            code: "provider_error",
            message: "Gemini returned an empty JSON payload.",
            status: 502,
            retryable: true,
            details: {
              ...payloadInspection.logDetails,
              empty_json_payload: true,
            },
          });
        }

        let parsed: T;
        try {
          parsed = JSON.parse(responseText) as T;
        } catch {
          throw new AppError({
            code: "provider_error",
            message: "Gemini returned malformed JSON.",
            status: 502,
            retryable: true,
            details: {
              ...payloadInspection.logDetails,
              malformed_json_payload: true,
            },
          });
        }
        const usageResult = await this.buildUsageFromGeminiResponse({
          response,
          modelName: response.modelVersion ?? input.model,
          fallbackInputTokens: () =>
            this.countContentTokens(input.model, input.contents),
          fallbackOutputTokens: () =>
            this.countTextTokens(input.model, responseText),
        });
        const usage = usageResult.usage;
        const responseMeta = extractGeminiResponseMeta(response);
        const successExtra = {
          ...input.extraLogDetails,
          ...usageResult.logDetails,
          provider_finish_reason: responseMeta.finishReason,
          provider_prompt_block_reason: responseMeta.promptBlockReason,
          provider_candidate_count: responseMeta.candidateCount,
        };

        if (
          responseMeta.finishReason &&
          !isGeminiCleanStopReason(responseMeta.finishReason)
        ) {
          const cutoffError = new AppError({
            code: "provider_error",
            message: "The AI provider returned an incomplete structured response.",
            status: 502,
            retryable: true,
            details: {
              provider_finish_reason: responseMeta.finishReason,
              provider_prompt_block_reason: responseMeta.promptBlockReason,
              provider_candidate_count: responseMeta.candidateCount,
              truncated_success_output: true,
            },
          });
          const canRetry = attempt < 2;

          if (canRetry) {
            await sleep(450 * (attempt + 1));
            continue;
          }

          this.logFailure({
            context: input.requestContext,
            operation: input.operation,
            modelName: input.model,
            errorCode: cutoffError.code,
            extra: {
              ...successExtra,
              retry_attempts: attempt,
              truncated_success_output: true,
            },
          });
          throw cutoffError;
        }

        this.logSuccess({
          context: input.requestContext,
          operation: input.operation,
          modelName: response.modelVersion ?? input.model,
          usage,
          extra: successExtra,
        });

        return {
          ...parsed,
          responseText,
          modelName: response.modelVersion ?? input.model,
          usage,
        };
      } catch (error) {
        if (error instanceof AppError) {
          this.logFailure({
            context: input.requestContext,
            operation: input.operation,
            modelName: input.model,
            errorCode: error.code,
            extra: {
              ...input.extraLogDetails,
              retry_attempts: attempt,
              ...(error.details ?? {}),
            },
          });
          throw error;
        }

        const canRetry = attempt < 2 && shouldRetryProviderFailure(error);

        if (canRetry) {
          await sleep(450 * (attempt + 1));
          continue;
        }

        const failure = extractProviderFailureDetails(error);
        this.logFailure({
          context: input.requestContext,
          operation: input.operation,
          modelName: input.model,
          errorCode: failure.appErrorCode,
          extra: {
            ...input.extraLogDetails,
            retry_attempts: attempt,
            ...failure.logDetails,
          },
        });
        throw toProviderError(error);
      }
    }

    throw new AppError({
      code: "provider_error",
      message: "The AI provider request failed.",
      status: 502,
      retryable: true,
    });
  }

  private async generateTextResponse(input: {
    model: string;
    systemInstruction: string;
    contents: ContentListUnion;
    requestContext: AiProviderLogContext;
    operation: string;
    extraLogDetails?: Record<string, unknown>;
    maxOutputTokens?: number;
    fallbackModel?: string | null;
  }): Promise<GeneratedTextResult> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await this.client.models.generateContent({
          model: input.model,
          contents: input.contents,
          config: {
            temperature: 0.2,
            safetySettings: GEMINI_DEFAULT_SAFETY_SETTINGS,
            systemInstruction: input.systemInstruction,
            maxOutputTokens: input.maxOutputTokens,
          },
        });
        const responseText =
          response.text?.trim() ?? extractTextFromGeminiCandidateParts(response);

        if (!responseText) {
          throw new AppError({
            code: "provider_error",
            message: "Gemini returned an empty text payload.",
            status: 502,
            retryable: true,
            details: buildEmptyTextPayloadDetails(response),
          });
        }

        const usageResult = await this.buildUsageFromGeminiResponse({
          response,
          modelName: response.modelVersion ?? input.model,
          fallbackInputTokens: () =>
            this.countContentTokens(input.model, input.contents),
          fallbackOutputTokens: () =>
            this.countTextTokens(input.model, responseText),
        });
        const usage = usageResult.usage;
        const responseMeta = extractGeminiResponseMeta(response);
        const successExtra = {
          ...input.extraLogDetails,
          ...usageResult.logDetails,
          provider_finish_reason: responseMeta.finishReason,
          provider_prompt_block_reason: responseMeta.promptBlockReason,
          provider_candidate_count: responseMeta.candidateCount,
        };
        const suspiciousSuccess = buildSuspiciousSuccessDetails({
          responseText,
          responseMeta,
        });

        if (suspiciousSuccess) {
          const cutoffError = new AppError({
            code: "provider_error",
            message: "The AI provider returned a likely truncated text response.",
            status: 502,
            retryable: true,
            details: suspiciousSuccess.details,
          });
          const canRetry = attempt < 2;

          if (canRetry) {
            await sleep(450 * (attempt + 1));
            continue;
          }

          this.logFailure({
            context: input.requestContext,
            operation: input.operation,
            modelName: input.model,
            errorCode: cutoffError.code,
            extra: {
              ...successExtra,
              retry_attempts: attempt,
              truncated_success_reason: suspiciousSuccess.reason,
              ...suspiciousSuccess.details,
            },
          });
          throw cutoffError;
        }

        this.logSuccess({
          context: input.requestContext,
          operation: input.operation,
          modelName: response.modelVersion ?? input.model,
          usage,
          extra: successExtra,
        });

        return {
          responseText,
          requestedModelName: input.model,
          modelName: response.modelVersion ?? input.model,
          fallbackModelName: null,
          usage,
        };
      } catch (error) {
        const canRetry =
          attempt < 2 &&
          (shouldRetryProviderFailure(error) || shouldRetryOutputIssue(error));

        if (canRetry) {
          await sleep(450 * (attempt + 1));
          continue;
        }

        const fallbackModel =
          input.fallbackModel && input.fallbackModel !== input.model
            ? input.fallbackModel
            : null;

        if (fallbackModel) {
          try {
            const fallbackResponse = await this.generateTextResponse({
              ...input,
              model: fallbackModel,
              fallbackModel: null,
            });

            logRuntimeInfo({
              message: "Gemini provider fell back to a secondary model",
              requestId: input.requestContext.requestId,
              route: input.requestContext.route,
              method: "POST",
              actorUserId: input.requestContext.actorUserId,
              actorRole: input.requestContext.actorRole,
              provider: GEMINI_PROVIDER_NAME,
              targetStudentUserId: input.requestContext.studentUserId,
              details: {
                conversationId: input.requestContext.conversationId,
                attachmentId: input.requestContext.attachmentId,
                operation: input.operation,
                requested_model: input.model,
                effective_model: fallbackResponse.modelName,
                fallback_model: fallbackModel,
              },
            });

            return {
              ...fallbackResponse,
              requestedModelName: input.model,
              fallbackModelName: fallbackResponse.modelName,
            };
          } catch (fallbackError) {
            const fallbackFailure = extractProviderFailureDetails(fallbackError);
            this.logFailure({
              context: input.requestContext,
              operation: input.operation,
              modelName: fallbackModel,
              errorCode: fallbackFailure.appErrorCode,
              extra: {
                ...input.extraLogDetails,
                fallback_from_model: input.model,
                ...fallbackFailure.logDetails,
              },
            });
          }
        }

        const failure = extractProviderFailureDetails(error);
        this.logFailure({
          context: input.requestContext,
          operation: input.operation,
          modelName: input.model,
          errorCode: failure.appErrorCode,
          extra: {
            ...input.extraLogDetails,
            retry_attempts: attempt,
            ...failure.logDetails,
          },
        });
        throw toProviderError(error);
      }
    }

    throw new AppError({
      code: "provider_error",
      message: "The AI provider request failed.",
      status: 502,
      retryable: true,
    });
  }

  private async uploadFileToGemini(input: {
    mimeType: string;
    originalFilename: string;
    fileBlob: Blob;
  }) {
    const uploaded = await this.client.files.upload({
      file: input.fileBlob,
      config: {
        mimeType: input.mimeType,
        displayName: input.originalFilename,
      },
    });

    if (!uploaded.name) {
      throw new Error("Gemini file upload returned no resource name.");
    }

    for (let attempt = 0; attempt < GEMINI_UPLOAD_POLL_ATTEMPTS; attempt += 1) {
      const current = await this.client.files.get({
        name: uploaded.name,
      });

      if (current.state === "ACTIVE") {
        return current;
      }

      if (current.state && current.state !== "PROCESSING") {
        throw new Error(`Gemini file state ${current.state} is not usable.`);
      }

      await sleep(GEMINI_UPLOAD_POLL_DELAY_MS);
    }

    throw new Error("Gemini file processing timed out.");
  }

  async generateCoachReply(
    input: GenerateCoachReplyInput,
  ): Promise<GenerateCoachReplyResult> {
    const prompt = buildStudentCoachSystemPrompt(input);
    const attachmentParts = buildAttachmentParts(input.attachments);
    const response = await this.generateTextResponse({
      model: GEMINI_COACH_MODEL,
      systemInstruction: prompt.instruction,
      contents: createUserContent([
        `Message eleve: ${input.studentMessageText}`,
        `Intent: ${input.intent}`,
        ...attachmentParts,
      ]),
      requestContext: input.requestContext,
      operation: "coach_reply",
      maxOutputTokens: AI_OUTPUT_TOKEN_LIMITS.coachReply,
      extraLogDetails: {
        intent: input.intent,
        reply_mode: input.replyMode,
      },
      fallbackModel: GEMINI_COACH_MODEL === "gemini-2.5-pro" ? "gemini-2.5-flash" : null,
    });

    const replyText = asString(response.responseText);

    if (!replyText) {
      throw new AppError({
        code: "provider_error",
        message: "The AI provider returned an invalid coach reply.",
        status: 502,
        retryable: true,
      });
    }

    return {
      replyText,
      rawOutputText: response.responseText,
      coachingMode:
        input.replyMode === "interactive"
          ? "attempt_probe"
          : input.replyMode === "fast"
            ? "feedback_refinement"
            : "hint_scaffold",
      asksForAttempt:
        input.replyMode === "interactive" || input.intent !== "summarize",
      requestedModelName: response.requestedModelName,
      generatedModelName: response.modelName,
      fallbackModelName: response.fallbackModelName,
      promptVersion: prompt.version,
      usage: response.usage,
    };
  }

  async generateConversationTitle(
    input: GenerateConversationTitleInput,
  ): Promise<GenerateConversationTitleResult> {
    const prompt = buildConversationTitlePrompt(input);
    const response = await this.generateTextResponse({
      model: GEMINI_TITLE_MODEL,
      systemInstruction: prompt.instruction,
      contents: createUserContent([
        `Matiere: ${input.conversation.subject_tag}`,
        `Premier message eleve: ${input.firstStudentMessageText}`,
        `Premiere reponse banban: ${input.firstAssistantReplyText}`,
      ]),
      requestContext: input.requestContext,
      operation: "conversation_title",
      maxOutputTokens: 40,
      extraLogDetails: {
        subject_tag: input.conversation.subject_tag,
        conversation_id: input.conversation.id,
      },
    });

    const titleText = asString(response.responseText);

    if (!titleText) {
      throw new AppError({
        code: "provider_error",
        message: "The AI provider returned an invalid conversation title.",
        status: 502,
        retryable: true,
      });
    }

    return {
      titleText,
      rawOutputText: response.responseText,
      generatedModelName: response.modelName,
      promptVersion: prompt.version,
      usage: response.usage,
    };
  }

  async extractAttachmentText(
    input: ExtractAttachmentTextInput,
  ): Promise<ExtractAttachmentTextResult> {
    const prompt = buildAttachmentExtractionPrompt({
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
    });
    let uploadedFileName: string | null = null;

    try {
      const uploadedFile = await this.uploadFileToGemini({
        mimeType: input.mimeType,
        originalFilename: input.originalFilename,
        fileBlob: input.fileBlob,
      });
      uploadedFileName = uploadedFile.name ?? null;

      if (!uploadedFile.uri || !uploadedFile.mimeType) {
        throw new Error("Gemini file upload did not produce a usable URI.");
      }

      const response = await this.generateJsonResponse<{
        extractedText?: string;
        detectedLanguage?: string | null;
        confidenceScore?: number | null;
        needsManualReview?: boolean | null;
        pageCountEstimate?: number | null;
        sourceSummary?: string | null;
      }>({
        model: GEMINI_EXTRACTION_MODEL,
        systemInstruction: prompt.instruction,
        contents: createUserContent([
          "Lis la piece jointe et extrais le texte de maniere fidele.",
          createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
        ]),
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedText: { type: Type.STRING },
            detectedLanguage: {
              type: Type.STRING,
              enum: ["fr", "en", "zh"],
            },
            confidenceScore: { type: Type.NUMBER },
            needsManualReview: { type: Type.BOOLEAN },
            pageCountEstimate: { type: Type.INTEGER },
            sourceSummary: { type: Type.STRING },
          },
          required: ["extractedText", "confidenceScore", "needsManualReview"],
        },
        requestContext: input.requestContext,
        operation: "attachment_extraction",
        extraLogDetails: {
          mime_type: input.mimeType,
          byte_size: input.byteSize,
          original_filename: input.originalFilename,
        },
      });

      return {
        extractedText: asString(response.extractedText),
        detectedLanguage: normalizeUiLanguage(response.detectedLanguage),
        confidenceScore: asNumber(response.confidenceScore),
        needsManualReview: asBoolean(response.needsManualReview) ?? true,
        pageCountEstimate: asNumber(response.pageCountEstimate),
        sourceSummary: asString(response.sourceSummary),
        generatedModelName: response.modelName,
        promptVersion: prompt.version,
        usage: response.usage,
      };
    } catch (error) {
      const failure = extractProviderFailureDetails(error);
      this.logFailure({
        context: input.requestContext,
        operation: "attachment_extraction",
        modelName: GEMINI_EXTRACTION_MODEL,
        errorCode: failure.appErrorCode,
        extra: {
          mime_type: input.mimeType,
          attachment_id: input.attachmentId,
          ...failure.logDetails,
        },
      });
      throw toProviderError(error);
    } finally {
      if (uploadedFileName) {
        try {
          await this.client.files.delete({
            name: uploadedFileName,
          });
        } catch {
          // Best-effort cleanup only.
        }
      }
    }
  }

  async generateSummary(
    input: GenerateSummaryInput,
  ): Promise<GenerateSummaryResult> {
    const prompt = buildSummaryPrompt(input);
    const response = await this.generateJsonResponse<{
      summaryText?: string;
      weaknessTags?: string[];
      nextStepRecommendation?: string | null;
    }>({
      model: GEMINI_SUMMARY_MODEL,
      systemInstruction: prompt.instruction,
      contents: createUserContent([
        `Audience: ${input.audience}`,
        `Langue cible: ${input.languageCode}`,
      ]),
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summaryText: { type: Type.STRING },
          weaknessTags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          nextStepRecommendation: { type: Type.STRING },
        },
        required: ["summaryText", "weaknessTags"],
      },
      requestContext: input.requestContext,
      operation: "summary",
      maxOutputTokens: AI_OUTPUT_TOKEN_LIMITS.summary,
      extraLogDetails: {
        audience: input.audience,
        language_code: input.languageCode,
      },
    });

    const summaryText = asString(response.summaryText);

    if (!summaryText) {
      throw new AppError({
        code: "provider_error",
        message: "The AI provider returned an invalid summary.",
        status: 502,
        retryable: true,
      });
    }

    return {
      language_code: input.languageCode,
      summary_text: summaryText,
      weakness_tags: Array.isArray(response.weaknessTags)
        ? response.weaknessTags.filter(
            (tag): tag is string =>
              typeof tag === "string" && tag.trim().length > 0,
          )
        : [],
      next_step_recommendation: asString(response.nextStepRecommendation),
      generated_model_name: response.modelName,
      promptVersion: prompt.version,
      usage: response.usage,
    };
  }

  async generateMemoryProfile(
    input: GenerateMemoryProfileInput,
  ): Promise<GenerateMemoryProfileResult> {
    const prompt = buildMemoryProfilePrompt(input);
    const response = await this.generateJsonResponse<{
      items?: Array<{
        category?: string;
        title?: string;
        detail?: string | null;
        confidence?: number | null;
      }>;
    }>({
      model: GEMINI_SUMMARY_MODEL,
      systemInstruction: prompt.instruction,
      contents: createUserContent([
        `Langue cible: ${input.languageCode}`,
        `Conversation: ${input.conversation.id}`,
      ]),
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  enum: ["strength", "weakness", "preference", "topic"],
                },
                title: { type: Type.STRING },
                detail: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
              },
              required: ["category", "title"],
            },
          },
        },
        required: ["items"],
      },
      requestContext: input.requestContext,
      operation: "memory_profile",
      maxOutputTokens: AI_OUTPUT_TOKEN_LIMITS.memoryProfile,
      extraLogDetails: {
        language_code: input.languageCode,
        summary_count: input.summaries.length,
      },
    });

    return {
      items: Array.isArray(response.items)
        ? response.items
            .map(
              (item): MemoryGenerationItem => ({
              category:
                item.category === "strength"
                  ? "strength"
                  : item.category === "weakness"
                    ? "weakness"
                    : item.category === "preference"
                      ? "preference"
                      : "topic",
              title: asString(item.title) ?? "",
              detail: asString(item.detail),
              confidence: asNumber(item.confidence),
            }),
            )
            .filter((item) => item.title.length > 0)
        : [],
      generatedModelName: response.modelName,
      promptVersion: prompt.version,
      usage: response.usage,
    };
  }

  async translateText(input: TranslateTextInput): Promise<TranslateTextResult> {
    const prompt = buildTranslationPrompt(input);

    try {
      const response = await this.client.models.generateContent({
        model: GEMINI_TRANSLATION_MODEL,
        contents: prompt.instruction,
        config: {
          temperature: 0.1,
          safetySettings: GEMINI_DEFAULT_SAFETY_SETTINGS,
          maxOutputTokens: AI_OUTPUT_TOKEN_LIMITS.translation,
        },
      });

      const translatedText = response.text?.trim();

      if (!translatedText) {
        throw new Error("Gemini returned an empty translation.");
      }

      const usageResult = await this.buildUsageFromGeminiResponse({
        response,
        modelName: response.modelVersion ?? GEMINI_TRANSLATION_MODEL,
        fallbackInputTokens: () =>
          this.countTextTokens(GEMINI_TRANSLATION_MODEL, prompt.instruction),
        fallbackOutputTokens: () =>
          this.countTextTokens(GEMINI_TRANSLATION_MODEL, translatedText),
      });
      const usage = usageResult.usage;

      this.logSuccess({
        context: input.requestContext,
        operation: "translation",
        modelName: response.modelVersion ?? GEMINI_TRANSLATION_MODEL,
        usage,
        extra: {
          source_language: input.sourceLanguage,
          target_language: input.targetLanguage,
          ...usageResult.logDetails,
        },
      });

      return {
        translatedText,
        generatedModelName: response.modelVersion ?? GEMINI_TRANSLATION_MODEL,
        promptVersion: prompt.version,
        usage,
      };
    } catch (error) {
      const failure = extractProviderFailureDetails(error);
      this.logFailure({
        context: input.requestContext,
        operation: "translation",
        modelName: GEMINI_TRANSLATION_MODEL,
        errorCode: failure.appErrorCode,
        extra: failure.logDetails,
      });
      throw toProviderError(error);
    }
  }
}
