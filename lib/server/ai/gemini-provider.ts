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
  GEMINI_TRANSLATION_MODEL,
  GEMINI_UPLOAD_POLL_ATTEMPTS,
  GEMINI_UPLOAD_POLL_DELAY_MS,
} from "@/lib/server/ai/config";
import { buildAttachmentExtractionPrompt } from "@/lib/server/ai/prompts/attachment-extraction";
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
  return value === "fr" || value === "en" || value === "zh" ? value : null;
}

function toProviderError(message: string, cause: unknown) {
  return new AppError({
    code: "provider_error",
    message,
    status: 502,
    retryable: true,
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
      const extractedText = attachment.raw_extracted_text?.trim() ?? "";

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
  }): Promise<T & GeneratedUsageResult> {
    const inputTokens = await this.countContentTokens(input.model, input.contents);

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
        },
      });
      const responseText = response.text?.trim();

      if (!responseText) {
        throw new Error("Gemini returned an empty JSON payload.");
      }

      const parsed = JSON.parse(responseText) as T;
      const outputTokens = await this.countTextTokens(input.model, responseText);
      const usage = buildUsageSnapshot({
        modelName: response.modelVersion ?? input.model,
        inputTokens,
        outputTokens,
      });

      this.logSuccess({
        context: input.requestContext,
        operation: input.operation,
        modelName: response.modelVersion ?? input.model,
        usage,
        extra: input.extraLogDetails,
      });

      return {
        ...parsed,
        responseText,
        modelName: response.modelVersion ?? input.model,
        usage,
      };
    } catch (error) {
      this.logFailure({
        context: input.requestContext,
        operation: input.operation,
        modelName: input.model,
        errorCode: "provider_error",
      });
      throw toProviderError("The AI provider request failed.", error);
    }
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
    const response = await this.generateJsonResponse<{
      replyText?: string;
      coachingMode?: GenerateCoachReplyResult["coachingMode"];
      asksForAttempt?: boolean;
    }>({
      model: GEMINI_COACH_MODEL,
      systemInstruction: prompt.instruction,
      contents: createUserContent([
        `Message eleve: ${input.studentMessageText}`,
        `Intent: ${input.intent}`,
        ...attachmentParts,
      ]),
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          replyText: { type: Type.STRING },
          coachingMode: {
            type: Type.STRING,
            enum: [
              "attempt_probe",
              "hint_scaffold",
              "feedback_refinement",
              "summary_reflection",
              "boundary_redirect",
            ],
          },
          asksForAttempt: { type: Type.BOOLEAN },
        },
        required: ["replyText", "coachingMode", "asksForAttempt"],
      },
      requestContext: input.requestContext,
      operation: "coach_reply",
      extraLogDetails: {
        intent: input.intent,
      },
    });

    const replyText = asString(response.replyText);

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
      coachingMode: response.coachingMode ?? "feedback_refinement",
      asksForAttempt: response.asksForAttempt ?? false,
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
      this.logFailure({
        context: input.requestContext,
        operation: "attachment_extraction",
        modelName: GEMINI_EXTRACTION_MODEL,
        errorCode: "provider_error",
        extra: {
          mime_type: input.mimeType,
          attachment_id: input.attachmentId,
        },
      });
      throw toProviderError("Unable to extract text from the uploaded attachment.", error);
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
        required: ["summaryText", "weaknessTags", "nextStepRecommendation"],
      },
      requestContext: input.requestContext,
      operation: "summary",
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
    const inputTokens = await this.countTextTokens(
      GEMINI_TRANSLATION_MODEL,
      prompt.instruction,
    );

    try {
      const response = await this.client.models.generateContent({
        model: GEMINI_TRANSLATION_MODEL,
        contents: prompt.instruction,
        config: {
          temperature: 0.1,
          safetySettings: GEMINI_DEFAULT_SAFETY_SETTINGS,
        },
      });

      const translatedText = response.text?.trim();

      if (!translatedText) {
        throw new Error("Gemini returned an empty translation.");
      }

      const outputTokens = await this.countTextTokens(
        GEMINI_TRANSLATION_MODEL,
        translatedText,
      );
      const usage = buildUsageSnapshot({
        modelName: response.modelVersion ?? GEMINI_TRANSLATION_MODEL,
        inputTokens,
        outputTokens,
      });

      this.logSuccess({
        context: input.requestContext,
        operation: "translation",
        modelName: response.modelVersion ?? GEMINI_TRANSLATION_MODEL,
        usage,
        extra: {
          source_language: input.sourceLanguage,
          target_language: input.targetLanguage,
        },
      });

      return {
        translatedText,
        generatedModelName: response.modelVersion ?? GEMINI_TRANSLATION_MODEL,
        promptVersion: prompt.version,
        usage,
      };
    } catch (error) {
      this.logFailure({
        context: input.requestContext,
        operation: "translation",
        modelName: GEMINI_TRANSLATION_MODEL,
        errorCode: "provider_error",
      });
      throw toProviderError("Unable to translate the summary text.", error);
    }
  }
}
