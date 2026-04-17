import "server-only";

import type {
  ConversationActionIntent,
  ConversationMessageRecord,
  ConversationRecord,
  SessionSummaryRecord,
  StudentReplyMode,
  SummaryAudience,
  WorkspaceStateRecord,
} from "@/lib/server/conversations/types";
import type { AiLanguageCode, UiLanguageCode } from "@/lib/server/auth/types";
import type { MemoryCategory } from "@/lib/server/memory/types";

export type AiProviderName = "gemini";

export type AiUsageSnapshot = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: number | null;
};

export type AiProviderLogContext = {
  requestId: string;
  route: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  conversationId?: string | null;
  attachmentId?: string | null;
  studentUserId?: string | null;
};

export type ConversationAttachmentRecord = {
  id: string;
  conversation_id: string;
  uploaded_by_user_id: string;
  storage_bucket: string;
  storage_path: string;
  attachment_kind: "image" | "screenshot" | "pdf" | "document";
  mime_type: string;
  original_filename: string;
  byte_size: number;
  page_count: number | null;
  extraction_status: "pending" | "ready" | "failed";
  raw_extracted_text: string | null;
  source_language: UiLanguageCode | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type GenerateCoachReplyInput = {
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord | null;
  messages: ConversationMessageRecord[];
  attachments: ConversationAttachmentRecord[];
  studentMessageText: string;
  intent: ConversationActionIntent;
  replyMode: StudentReplyMode;
  languageCode: AiLanguageCode;
  requestContext: AiProviderLogContext;
};

export type GenerateCoachReplyResult = {
  replyText: string;
  rawOutputText: string;
  coachingMode:
    | "attempt_probe"
    | "hint_scaffold"
    | "feedback_refinement"
    | "summary_reflection"
    | "boundary_redirect";
  asksForAttempt: boolean;
  requestedModelName: string;
  generatedModelName: string;
  fallbackModelName: string | null;
  promptVersion: string;
  usage: AiUsageSnapshot;
};

export type GenerateConversationTitleInput = {
  conversation: ConversationRecord;
  firstStudentMessageText: string;
  firstAssistantReplyText: string;
  languageCode: AiLanguageCode;
  requestContext: AiProviderLogContext;
};

export type GenerateConversationTitleResult = {
  titleText: string;
  rawOutputText: string;
  generatedModelName: string;
  promptVersion: string;
  usage: AiUsageSnapshot;
};

export type ExtractAttachmentTextInput = {
  attachmentId: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  fileBlob: Blob;
  requestContext: AiProviderLogContext;
};

export type ExtractAttachmentTextResult = {
  extractedText: string | null;
  detectedLanguage: UiLanguageCode | null;
  confidenceScore: number | null;
  needsManualReview: boolean;
  pageCountEstimate: number | null;
  sourceSummary: string | null;
  generatedModelName: string;
  promptVersion: string;
  usage: AiUsageSnapshot;
};

export type GenerateSummaryInput = {
  audience: SummaryAudience;
  languageCode: UiLanguageCode;
  aiHelpLanguage: AiLanguageCode;
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord | null;
  messages: ConversationMessageRecord[];
  attachments: ConversationAttachmentRecord[];
  requestContext: AiProviderLogContext;
};

export type GenerateSummaryResult = Pick<
  SessionSummaryRecord,
  | "language_code"
  | "summary_text"
  | "weakness_tags"
  | "next_step_recommendation"
  | "generated_model_name"
> & {
  promptVersion: string;
  usage: AiUsageSnapshot;
};

export type MemoryGenerationItem = {
  category: MemoryCategory;
  title: string;
  detail: string | null;
  confidence: number | null;
};

export type GenerateMemoryProfileInput = {
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord | null;
  messages: ConversationMessageRecord[];
  attachments: ConversationAttachmentRecord[];
  summaries: SessionSummaryRecord[];
  languageCode: UiLanguageCode;
  requestContext: AiProviderLogContext;
};

export type GenerateMemoryProfileResult = {
  items: MemoryGenerationItem[];
  generatedModelName: string;
  promptVersion: string;
  usage: AiUsageSnapshot;
};

export type TranslateTextInput = {
  sourceText: string;
  sourceLanguage: UiLanguageCode;
  targetLanguage: UiLanguageCode;
  requestContext: AiProviderLogContext;
};

export type TranslateTextResult = {
  translatedText: string;
  generatedModelName: string;
  promptVersion: string;
  usage: AiUsageSnapshot;
};

export interface AiProvider {
  readonly name: AiProviderName;
  generateCoachReply(
    input: GenerateCoachReplyInput,
  ): Promise<GenerateCoachReplyResult>;
  generateConversationTitle(
    input: GenerateConversationTitleInput,
  ): Promise<GenerateConversationTitleResult>;
  extractAttachmentText(
    input: ExtractAttachmentTextInput,
  ): Promise<ExtractAttachmentTextResult>;
  generateSummary(input: GenerateSummaryInput): Promise<GenerateSummaryResult>;
  generateMemoryProfile(
    input: GenerateMemoryProfileInput,
  ): Promise<GenerateMemoryProfileResult>;
  translateText(input: TranslateTextInput): Promise<TranslateTextResult>;
}
