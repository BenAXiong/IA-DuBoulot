import "server-only";

import {
  getStudentConversationServerCopy,
  getStudentDraftCoachCopy,
} from "@/lib/i18n/student-flow-copy";
import { recordSuccessfulCoachReplyDebugCaptureBestEffort } from "@/lib/server/ai/debug-capture-service";
import { AppError, isAppError } from "@/lib/server/errors/app-error";
import { logRuntimeError, logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import { recordAuditEvent } from "@/lib/server/audit/audit-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AuthenticatedUserContext,
  UiLanguageCode,
} from "@/lib/server/auth/types";
import {
  requireActiveAppUser,
  requireAppUserContext,
  requireAppUserRole,
} from "@/lib/server/auth/authorization";
import {
  buildInitialWorkspaceFromDraft,
  buildStudentIntentMessage,
} from "@/lib/server/conversations/draft-coach";
import type {
  AiUsageSnapshot,
  ConversationAttachmentRecord,
  GenerateCoachReplyResult,
} from "@/lib/server/ai/types";
import { getAiProvider } from "@/lib/server/ai/provider";
import { refreshStudentMemoryFromConversationCompletion } from "@/lib/server/memory/service";
import { generateConversationSummaries } from "@/lib/server/summaries/service";
import {
  moderateAssistantOutput,
  moderateUserInput,
  recordModerationEvent,
} from "@/lib/server/moderation/service";
import {
  assertStudentUsageActionAllowed,
  recordStudentAiUsageBestEffort,
  recordStudentUsageDeltaBestEffort,
} from "@/lib/server/usage/service";
import type {
  AppendConversationMessageInput,
  AppendConversationMessageResult,
  CompleteConversationResult,
  ConversationDetail,
  ConversationMessageRecord,
  ConversationRecord,
  ConversationViewer,
  CreateConversationDraftInput,
  CreateConversationDraftResult,
  CreateConversationShellInput,
  CreateConversationShellResult,
  DraftAttachmentReferenceInput,
  ListConversationSummary,
  SessionSummaryRecord,
  UpdateWorkspaceInput,
  WorkspaceStateRecord,
} from "@/lib/server/conversations/types";
import { loadAuthorizedConversationForViewer } from "@/lib/server/oversight/access";

const CONVERSATION_SELECT =
  "id, student_user_id, created_by_user_id, title, subject_tag, status, graded_homework, assignment_text, edited_extracted_text, source_language, last_message_at, completed_at, created_at, updated_at";
const WORKSPACE_SELECT =
  "conversation_id, assignment_text, edited_extracted_text, plan_text, draft_answer_text, student_notes, updated_at";
const MESSAGE_SELECT =
  "id, conversation_id, author_user_id, role, content_text, content_language, model_provider, model_name, input_tokens, output_tokens, created_at";
const ATTACHMENT_SELECT =
  "id, conversation_id, uploaded_by_user_id, storage_bucket, storage_path, attachment_kind, mime_type, original_filename, byte_size, page_count, extraction_status, raw_extracted_text, source_language, metadata, created_at, updated_at";
const SUMMARY_SELECT =
  "id, conversation_id, audience, language_code, summary_text, weakness_tags, next_step_recommendation, generated_model_name, created_at, updated_at";
const MAX_CONVERSATION_SOURCE_TEXT_CHARS = 12_000;
const MAX_WORKSPACE_SUPPORT_TEXT_CHARS = 8_000;
const MAX_STUDENT_MESSAGE_CHARS = 4_000;

function toServiceError(message: string, cause: unknown) {
  return new AppError({
    code: "service_unavailable",
    message,
    status: 503,
    retryable: true,
    cause,
  });
}

function normalizeText(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeConversationTitle(value: string | null | undefined) {
  const normalized = value?.trim().replace(/\s+/g, " ") ?? "";
  const withoutQuotes = normalized.replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, "");

  if (!withoutQuotes) {
    return null;
  }

  return withoutQuotes.length > 120
    ? withoutQuotes.slice(0, 117).trimEnd() + "..."
    : withoutQuotes;
}

function buildModerationSafeReply(languageCode: UiLanguageCode) {
  return getStudentDraftCoachCopy(languageCode).moderationSafeReply;
}

function buildMaskedStudentMessage(languageCode: UiLanguageCode) {
  return getStudentConversationServerCopy(languageCode).appendMessage.maskedStudentMessage;
}

function buildProviderLimitFallbackCode(error: AppError | null) {
  if (!error || error.code !== "rate_limited") {
    return null;
  }

  const details = error.details ?? {};
  const providerBodyMessage =
    typeof details.provider_body_message === "string"
      ? details.provider_body_message
      : "";
  const providerErrorMessage =
    typeof details.provider_error_message === "string"
      ? details.provider_error_message
      : "";
  const providerDetails =
    typeof details.provider_details === "string" ? details.provider_details : "";
  const providerStatus =
    typeof details.provider_status === "string" ? details.provider_status : "";
  const providerText = [
    providerStatus,
    providerBodyMessage,
    providerErrorMessage,
    providerDetails,
  ]
    .join(" ")
    .trim();

  if (
    /GenerateRequestsPerDayPerProjectPerModel-FreeTier|generate_content_free_tier_requests/i.test(
      providerText,
    ) &&
    /\b20\b/.test(providerText)
  ) {
    return "rpd_f7k2";
  }

  return "rpm_v3m8";
}

function buildProviderFailureFallbackCode(
  error: AppError | null,
  languageCode: UiLanguageCode,
) {
  const copy = getStudentConversationServerCopy(languageCode);

  if (!error) {
    return copy.appendMessage.providerGenericCode;
  }

  if (error.code === "rate_limited") {
    return buildProviderLimitFallbackCode(error) ?? copy.appendMessage.providerGenericCode;
  }

  const details = error.details ?? {};
  const providerStatus =
    typeof details.provider_status === "string" ? details.provider_status : "";
  const providerHttpStatus =
    typeof details.provider_http_status === "number"
      ? details.provider_http_status
      : null;
  const providerBodyMessage =
    typeof details.provider_body_message === "string"
      ? details.provider_body_message
      : "";
  const providerErrorMessage =
    typeof details.provider_error_message === "string"
      ? details.provider_error_message
      : "";
  const providerDetails =
    typeof details.provider_details === "string" ? details.provider_details : "";
  const providerText = [
    providerStatus,
    providerBodyMessage,
    providerErrorMessage,
    providerDetails,
  ]
    .join(" ")
    .trim();

  if (
    providerHttpStatus === 503 ||
    providerStatus === "UNAVAILABLE" ||
    /high demand|temporar/i.test(providerText)
  ) {
    return copy.appendMessage.providerHighDemandCode;
  }

  return copy.appendMessage.providerGenericCode;
}

function isLearnerFacingProviderFallbackText(
  value: string,
  languageCode: UiLanguageCode,
) {
  const normalized = value.trim();
  const copy = getStudentConversationServerCopy(languageCode);

  return [
    copy.appendMessage.providerFallback,
    copy.appendMessage.providerGenericCode,
    copy.appendMessage.providerHighDemandCode,
    "rpd_f7k2",
    "rpm_v3m8",
  ].includes(normalized);
}

function requireBodyObject(
  body: unknown,
  languageCode: UiLanguageCode,
) {
  const copy = getStudentConversationServerCopy(languageCode);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError({
      code: "bad_request",
      message: copy.requestErrors.expectedObject,
      status: 400,
    });
  }

  return body as Record<string, unknown>;
}

function validateAttachmentReferences(references: DraftAttachmentReferenceInput[]) {
  return references
    .map((reference) => ({
      name: reference.name.trim(),
      category: reference.category,
      byteSize: reference.byteSize,
    }))
    .filter((reference) => reference.name.length > 0 && reference.byteSize > 0);
}

export async function parseCreateConversationDraftInput(
  request: Request,
  languageCode: UiLanguageCode = "fr",
): Promise<CreateConversationDraftInput> {
  const copy = getStudentConversationServerCopy(languageCode);
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    throw new AppError({
      code: "bad_request",
      message: copy.requestErrors.invalidJson,
      status: 400,
      cause: error,
    });
  }

  const payload = requireBodyObject(body, languageCode) as Partial<{
    title: string;
    subjectTag: string;
    gradedHomework: boolean;
    pastedText: string;
    editedExtractedText: string;
    attachmentReferences: DraftAttachmentReferenceInput[];
  }>;

  const title = payload.title?.trim() ?? "";
  const subjectTag = payload.subjectTag?.trim() ?? "";
  const pastedText = payload.pastedText ?? "";
  const editedExtractedText = payload.editedExtractedText ?? "";
  const attachmentReferences = validateAttachmentReferences(
    Array.isArray(payload.attachmentReferences)
      ? payload.attachmentReferences
      : [],
  );

  if (!title || title.length > 120) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        title: copy.createDraft.titleInvalid,
      },
    });
  }

  if (!subjectTag || subjectTag.length > 60) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        subjectTag: copy.createDraft.subjectInvalid,
      },
    });
  }

  if (
    pastedText.length > MAX_CONVERSATION_SOURCE_TEXT_CHARS ||
    editedExtractedText.length > MAX_CONVERSATION_SOURCE_TEXT_CHARS
  ) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        pastedText: copy.createDraft.sourceTextTooLong,
      },
    });
  }

  if (
    !normalizeText(pastedText) &&
    !normalizeText(editedExtractedText) &&
    attachmentReferences.length === 0
  ) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        editedExtractedText: copy.createDraft.missingSource,
      },
    });
  }

  return {
    title,
    subjectTag,
    gradedHomework: payload.gradedHomework ?? true,
    pastedText,
    editedExtractedText,
    attachmentReferences,
  };
}

export async function parseCreateConversationShellInput(
  request: Request,
  languageCode: UiLanguageCode = "fr",
): Promise<CreateConversationShellInput> {
  const copy = getStudentConversationServerCopy(languageCode);
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    throw new AppError({
      code: "bad_request",
      message: copy.requestErrors.invalidJson,
      status: 400,
      cause: error,
    });
  }

  const payload = requireBodyObject(body, languageCode) as Partial<{
    title: string;
    subjectTag: string;
    gradedHomework: boolean;
    attachmentReferences: DraftAttachmentReferenceInput[];
  }>;

  const title = payload.title?.trim() ?? "";
  const subjectTag = payload.subjectTag?.trim() ?? "";
  const attachmentReferences = validateAttachmentReferences(
    Array.isArray(payload.attachmentReferences)
      ? payload.attachmentReferences
      : [],
  );

  if (!title || title.length > 120) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        title: copy.createDraft.titleInvalid,
      },
    });
  }

  if (!subjectTag || subjectTag.length > 60) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        subjectTag: copy.createDraft.subjectInvalid,
      },
    });
  }

  return {
    title,
    subjectTag,
    gradedHomework: payload.gradedHomework ?? false,
    attachmentReferences,
  };
}

export async function parseAppendConversationMessageInput(
  request: Request,
  languageCode: UiLanguageCode = "fr",
): Promise<AppendConversationMessageInput> {
  const copy = getStudentConversationServerCopy(languageCode);
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    throw new AppError({
      code: "bad_request",
      message: copy.requestErrors.invalidJson,
      status: 400,
      cause: error,
    });
  }

  const payload = requireBodyObject(body, languageCode);
  const intent =
    payload.intent === "hint" || payload.intent === "summarize"
      ? payload.intent
      : "student_message";
  const contentText =
    typeof payload.contentText === "string" ? payload.contentText : "";
  const replyMode =
    payload.replyMode === "fast" ||
    payload.replyMode === "interactive" ||
    payload.replyMode === "thinking"
      ? payload.replyMode
      : "thinking";

  if (intent === "student_message" && contentText.trim().length === 0) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        contentText: copy.appendMessage.messageRequired,
      },
    });
  }

  if (contentText.trim().length > MAX_STUDENT_MESSAGE_CHARS) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        contentText: copy.appendMessage.messageTooLong,
      },
    });
  }

  return {
    contentText,
    intent,
    replyMode,
  };
}

export async function parseUpdateWorkspaceInput(
  request: Request,
  languageCode: UiLanguageCode = "fr",
): Promise<UpdateWorkspaceInput> {
  const copy = getStudentConversationServerCopy(languageCode);
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    throw new AppError({
      code: "bad_request",
      message: copy.requestErrors.invalidJson,
      status: 400,
      cause: error,
    });
  }

  const payload = requireBodyObject(body, languageCode);

  const assignmentText =
    typeof payload.assignmentText === "string" ? payload.assignmentText : "";
  const editedExtractedText =
    typeof payload.editedExtractedText === "string"
      ? payload.editedExtractedText
      : "";
  const planText = typeof payload.planText === "string" ? payload.planText : "";
  const draftAnswerText =
    typeof payload.draftAnswerText === "string" ? payload.draftAnswerText : "";
  const studentNotes =
    typeof payload.studentNotes === "string" ? payload.studentNotes : "";

  if (
    assignmentText.length > MAX_CONVERSATION_SOURCE_TEXT_CHARS ||
    editedExtractedText.length > MAX_CONVERSATION_SOURCE_TEXT_CHARS
  ) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        assignmentText: copy.workspace.sourceTextTooLong,
      },
    });
  }

  if (
    planText.length > MAX_WORKSPACE_SUPPORT_TEXT_CHARS ||
    draftAnswerText.length > MAX_WORKSPACE_SUPPORT_TEXT_CHARS ||
    studentNotes.length > MAX_WORKSPACE_SUPPORT_TEXT_CHARS
  ) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        planText: copy.workspace.supportTextTooLong,
      },
    });
  }

  return {
    assignmentText,
    editedExtractedText,
    planText,
    draftAnswerText,
    studentNotes,
  };
}

function buildAttachmentReferenceLines(
  references: DraftAttachmentReferenceInput[],
  languageCode: UiLanguageCode,
) {
  const copy = getStudentConversationServerCopy(languageCode);

  if (references.length === 0) {
    return null;
  }

  return references.map((reference) => {
    const kindLabel =
      reference.category === "pdf"
        ? copy.createDraft.pdfLabel
        : copy.createDraft.imageLabel;
    const sizeInKb = Math.max(1, Math.round(reference.byteSize / 1024));
    return `- ${reference.name} (${kindLabel}, ${sizeInKb} KB)`;
  });
}

function buildInitialStudentMessageContent(
  input: CreateConversationDraftInput,
  languageCode: UiLanguageCode,
) {
  const copy = getStudentConversationServerCopy(languageCode);
  const lines = [
    `${copy.createDraft.titleLabel}: ${input.title}`,
    `${copy.createDraft.subjectLabel}: ${input.subjectTag}`,
    `${copy.createDraft.gradedLabel}: ${
      input.gradedHomework
        ? copy.createDraft.gradedYes
        : copy.createDraft.gradedNo
    }`,
  ];
  const attachmentLines = buildAttachmentReferenceLines(
    input.attachmentReferences,
    languageCode,
  );
  const pastedText = normalizeText(input.pastedText);
  const editedExtractedText = normalizeText(input.editedExtractedText);

  if (attachmentLines) {
    lines.push("", `${copy.createDraft.attachmentsLabel}:`, ...attachmentLines);
  }

  if (pastedText) {
    lines.push("", `${copy.createDraft.pastedTextLabel}:`, pastedText);
  }

  if (editedExtractedText && editedExtractedText !== pastedText) {
    lines.push("", `${copy.createDraft.reviewedTextLabel}:`, editedExtractedText);
  }

  return lines.join("\n");
}

function buildWorkspaceNotes(
  input: CreateConversationDraftInput,
  languageCode: UiLanguageCode,
) {
  const copy = getStudentConversationServerCopy(languageCode);
  const attachmentLines = buildAttachmentReferenceLines(
    input.attachmentReferences,
    languageCode,
  );

  if (!attachmentLines) {
    return null;
  }

  return [
    `${copy.createDraft.workspaceAttachmentsLabel}:`,
    ...attachmentLines,
  ].join("\n");
}

async function deleteConversationBestEffort(conversationId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from("conversations").delete().eq("id", conversationId);
  } catch {
    // Best-effort cleanup only.
  }
}

async function insertConversationShell(input: {
  appUser: ReturnType<typeof requireAppUserContext>;
  payload: {
    title: string;
    subjectTag: string;
    gradedHomework: boolean;
    assignmentText?: string;
    editedExtractedText?: string;
    workspaceNotes?: string | null;
  };
}) {
  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const assignmentText = normalizeText(input.payload.assignmentText ?? "");
  const editedExtractedText = normalizeText(
    input.payload.editedExtractedText ?? "",
  );

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      student_user_id: input.appUser.id,
      created_by_user_id: input.appUser.id,
      title: input.payload.title,
      subject_tag: input.payload.subjectTag,
      graded_homework: input.payload.gradedHomework,
      assignment_text: assignmentText,
      edited_extracted_text: editedExtractedText,
      source_language: input.appUser.preferred_ui_language,
      last_message_at: now,
    })
    .select(CONVERSATION_SELECT)
    .single<ConversationRecord>();

  if (conversationError) {
    throw toServiceError("Unable to create the conversation draft.", conversationError);
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspace_states")
    .insert({
      conversation_id: conversation.id,
      assignment_text: assignmentText,
      edited_extracted_text: editedExtractedText,
      student_notes: normalizeText(input.payload.workspaceNotes ?? ""),
      last_saved_by_user_id: input.appUser.id,
    })
    .select(WORKSPACE_SELECT)
    .single<WorkspaceStateRecord>();

  if (workspaceError) {
    await deleteConversationBestEffort(conversation.id);
    throw toServiceError("Unable to create the workspace draft.", workspaceError);
  }

  return {
    conversation,
    workspace,
  };
}

async function recordConversationCreated(input: {
  appUser: ReturnType<typeof requireAppUserContext>;
  conversationId: string;
  attachmentReferenceCount: number;
  requestId: string;
  route: string;
}) {
  logRuntimeInfo({
    message: "Created conversation draft",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: input.appUser.id,
    actorRole: input.appUser.role,
    targetStudentUserId: input.appUser.id,
    details: {
      conversationId: input.conversationId,
      attachmentReferenceCount: input.attachmentReferenceCount,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: input.appUser.id,
      actorRole: input.appUser.role,
      action: "conversation_create",
      targetTable: "conversations",
      targetId: input.conversationId,
      studentUserId: input.appUser.id,
      conversationId: input.conversationId,
      metadata: {
        request_id: input.requestId,
        route: input.route,
        attachment_reference_count: input.attachmentReferenceCount,
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block the student flow.
  }

  await recordStudentUsageDeltaBestEffort({
    studentUserId: input.appUser.id,
    delta: {
      sessions: 1,
    },
  });
}

export async function createConversationDraft(input: {
  context: AuthenticatedUserContext;
  payload: CreateConversationDraftInput;
  requestId: string;
  route: string;
}): Promise<CreateConversationDraftResult> {
  const appUser = requireAppUserContext(input.context);
  requireAppUserRole(appUser, ["student"]);
  requireActiveAppUser(appUser);
  await assertStudentUsageActionAllowed({
    studentUserId: appUser.id,
    action: "create_conversation",
    languageCode: appUser.preferred_ui_language,
  });

  const initialWorkspace = buildInitialWorkspaceFromDraft(input.payload);
  const shell = await insertConversationShell({
    appUser,
    payload: {
      title: input.payload.title,
      subjectTag: input.payload.subjectTag,
      gradedHomework: input.payload.gradedHomework,
      assignmentText: initialWorkspace.assignmentText,
      editedExtractedText: initialWorkspace.editedExtractedText,
      workspaceNotes: buildWorkspaceNotes(
        input.payload,
        appUser.preferred_ui_language,
      ),
    },
  });

  const supabase = await createSupabaseServerClient();
  const { data: initialMessage, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: shell.conversation.id,
      author_user_id: appUser.id,
      role: "student",
      content_text: buildInitialStudentMessageContent(
        input.payload,
        appUser.preferred_ui_language,
      ),
      content_language: appUser.preferred_ui_language,
    })
    .select(MESSAGE_SELECT)
    .single<ConversationMessageRecord>();

  if (messageError) {
    await deleteConversationBestEffort(shell.conversation.id);
    throw toServiceError("Unable to persist the intake message.", messageError);
  }

  await recordConversationCreated({
    appUser,
    conversationId: shell.conversation.id,
    attachmentReferenceCount: input.payload.attachmentReferences.length,
    requestId: input.requestId,
    route: input.route,
  });

  return {
    conversation: shell.conversation,
    workspace: shell.workspace,
    initialMessage,
  };
}

export async function createConversationShell(input: {
  context: AuthenticatedUserContext;
  payload: CreateConversationShellInput;
  requestId: string;
  route: string;
}): Promise<CreateConversationShellResult> {
  const appUser = requireAppUserContext(input.context);
  requireAppUserRole(appUser, ["student"]);
  requireActiveAppUser(appUser);
  await assertStudentUsageActionAllowed({
    studentUserId: appUser.id,
    action: "create_conversation",
    languageCode: appUser.preferred_ui_language,
  });

  const shell = await insertConversationShell({
    appUser,
    payload: {
      title: input.payload.title,
      subjectTag: input.payload.subjectTag,
      gradedHomework: input.payload.gradedHomework,
      workspaceNotes: buildWorkspaceNotes(
        {
          ...input.payload,
          pastedText: "",
          editedExtractedText: "",
        },
        appUser.preferred_ui_language,
      ),
    },
  });

  await recordConversationCreated({
    appUser,
    conversationId: shell.conversation.id,
    attachmentReferenceCount: input.payload.attachmentReferences.length,
    requestId: input.requestId,
    route: input.route,
  });

  return shell;
}

async function requireWritableStudentConversation(input: {
  context: AuthenticatedUserContext;
  conversationId: string;
}) {
  const appUser = requireAppUserContext(input.context);
  const copy = getStudentConversationServerCopy(appUser.preferred_ui_language);
  requireAppUserRole(appUser, ["student"]);
  requireActiveAppUser(appUser);

  const supabase = await createSupabaseServerClient();
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", input.conversationId)
    .maybeSingle<ConversationRecord>();

  if (error) {
    throw toServiceError("Unable to load the writable conversation.", error);
  }

  if (!conversation) {
    throw new AppError({
      code: "not_found",
      message: copy.access.conversationNotFound,
      status: 404,
    });
  }

  if (conversation.student_user_id !== appUser.id) {
    throw new AppError({
      code: "forbidden",
      message: copy.access.conversationForbidden,
      status: 403,
    });
  }

  return {
    appUser,
    conversation,
    supabase,
  };
}

export async function listVisibleConversations(input: {
  context: AuthenticatedUserContext;
}): Promise<ListConversationSummary[]> {
  const appUser = requireAppUserContext(input.context);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, title, subject_tag, status, graded_homework, last_message_at, completed_at, created_at",
    )
    .order("last_message_at", {
      ascending: false,
      nullsFirst: false,
    })
    .order("created_at", { ascending: false });

  if (error) {
    throw toServiceError("Unable to list visible conversations.", error);
  }

  if (appUser.role === "student") {
    return (data ?? []) as ListConversationSummary[];
  }

  return (data ?? []) as ListConversationSummary[];
}

export async function loadConversationDetail(input: {
  viewer: ConversationViewer;
  conversationId: string;
  auditContext?: {
    action: string;
    route: string;
    requestId?: string;
  };
}): Promise<ConversationDetail> {
  const { supabase, conversation } = await loadAuthorizedConversationForViewer({
    viewer: input.viewer,
    conversationId: input.conversationId,
  });

  const [workspaceResult, messagesResult, attachmentsResult, summariesResult] =
    await Promise.all([
    supabase
      .from("workspace_states")
      .select(WORKSPACE_SELECT)
      .eq("conversation_id", input.conversationId)
      .maybeSingle<WorkspaceStateRecord>(),
    supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("conversation_id", input.conversationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("attachments")
      .select(ATTACHMENT_SELECT)
      .eq("conversation_id", input.conversationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("session_summaries")
      .select(SUMMARY_SELECT)
      .eq("conversation_id", input.conversationId)
      .order("created_at", { ascending: false }),
  ]);

  if (workspaceResult.error) {
    throw toServiceError("Unable to load the workspace draft.", workspaceResult.error);
  }

  if (messagesResult.error) {
    throw toServiceError("Unable to load the conversation history.", messagesResult.error);
  }

  if (attachmentsResult.error) {
    throw toServiceError("Unable to load the conversation attachments.", attachmentsResult.error);
  }

  if (summariesResult.error) {
    throw toServiceError("Unable to load the visible summaries.", summariesResult.error);
  }

  if (
    input.auditContext &&
    (input.viewer.role === "parent" || input.viewer.role === "tutor")
  ) {
    try {
      await recordAuditEvent({
        actorUserId: input.viewer.id,
        actorRole: input.viewer.role,
        action: input.auditContext.action,
        targetTable: "conversations",
        targetId: conversation.id,
        studentUserId: conversation.student_user_id,
        conversationId: conversation.id,
        metadata: {
          request_id: input.auditContext.requestId ?? null,
          route: input.auditContext.route,
        },
        requestId: input.auditContext.requestId,
      });
    } catch {
      // Audit failures should not block review reads.
    }
  }

  return {
    conversation,
    workspace: workspaceResult.data ?? null,
    messages: (messagesResult.data ?? []) as ConversationMessageRecord[],
    attachments: (attachmentsResult.data ?? []) as ConversationAttachmentRecord[],
    summaries: (summariesResult.data ?? []) as SessionSummaryRecord[],
  };
}

export async function appendConversationTurn(input: {
  context: AuthenticatedUserContext;
  conversationId: string;
  payload: AppendConversationMessageInput;
  requestId: string;
  route: string;
}): Promise<AppendConversationMessageResult> {
  const { appUser, conversation, supabase } =
    await requireWritableStudentConversation({
      context: input.context,
      conversationId: input.conversationId,
    });
  const copy = getStudentConversationServerCopy(appUser.preferred_ui_language);

  if (conversation.status !== "active") {
    throw new AppError({
      code: "conflict",
      message: copy.access.sessionReadOnly,
      status: 409,
    });
  }

  await assertStudentUsageActionAllowed({
    studentUserId: appUser.id,
    action: "append_message",
    languageCode: appUser.preferred_ui_language,
  });

  const [
    { data: workspace, error: workspaceError },
    { data: messages, error: messagesError },
    { data: attachments, error: attachmentsError },
  ] = await Promise.all([
    supabase
      .from("workspace_states")
      .select(WORKSPACE_SELECT)
      .eq("conversation_id", input.conversationId)
      .maybeSingle<WorkspaceStateRecord>(),
    supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("conversation_id", input.conversationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("attachments")
      .select(ATTACHMENT_SELECT)
      .eq("conversation_id", input.conversationId)
      .order("created_at", { ascending: true }),
  ]);

  if (workspaceError) {
    throw toServiceError(
      "Unable to load the workspace before appending a message.",
      workspaceError,
    );
  }

  if (messagesError) {
    throw toServiceError(
      "Unable to load the message history before appending a message.",
      messagesError,
    );
  }

  if (attachmentsError) {
    throw toServiceError(
      "Unable to load the attachments before appending a message.",
      attachmentsError,
    );
  }

  const studentMessageText = buildStudentIntentMessage({
    intent: input.payload.intent,
    contentText: input.payload.contentText,
    languageCode: appUser.ai_help_language,
  });
  const inputModeration = moderateUserInput(studentMessageText);

  await recordModerationEvent({
    source: "user_input",
    result: inputModeration,
    actorUserId: appUser.id,
    actorRole: appUser.role,
    conversationId: input.conversationId,
    requestContext: {
      requestId: input.requestId,
      route: input.route,
      actorUserId: appUser.id,
      actorRole: appUser.role,
      conversationId: input.conversationId,
      studentUserId: appUser.id,
    },
    textPreview: studentMessageText.slice(0, 200),
  });

  const aiProvider = getAiProvider();
  const persistedStudentMessageText =
    inputModeration.status === "blocked"
      ? buildMaskedStudentMessage(appUser.ai_help_language)
      : studentMessageText;
  let assistantMessageText = buildModerationSafeReply(appUser.ai_help_language);
  let providerUsage: AiUsageSnapshot | null = null;
  let titleUsage: AiUsageSnapshot | null = null;
  let successfulAiReply: GenerateCoachReplyResult | null = null;
  let nextConversationTitle = conversation.title;
  const hasSuccessfulAssistantReply = ((messages ?? []) as ConversationMessageRecord[]).some(
    (message) =>
      message.role === "assistant" &&
      !isLearnerFacingProviderFallbackText(
        message.content_text,
        appUser.ai_help_language,
      ),
  );

  if (inputModeration.status !== "blocked") {
    try {
      const aiReply = await aiProvider.generateCoachReply({
        conversation,
        workspace: workspace ?? null,
        messages: (messages ?? []) as ConversationMessageRecord[],
        attachments: (attachments ?? []) as ConversationAttachmentRecord[],
        studentMessageText,
        intent: input.payload.intent,
        replyMode: input.payload.replyMode,
        languageCode: appUser.ai_help_language,
        requestContext: {
          requestId: input.requestId,
          route: input.route,
          actorUserId: appUser.id,
          actorRole: appUser.role,
          conversationId: input.conversationId,
          studentUserId: appUser.id,
        },
      });
      successfulAiReply = aiReply;
      providerUsage = aiReply.usage;
      const outputModeration = moderateAssistantOutput(aiReply.replyText);

      await recordModerationEvent({
        source: "assistant_output",
        result: outputModeration,
        actorUserId: appUser.id,
        actorRole: appUser.role,
        conversationId: input.conversationId,
        requestContext: {
          requestId: input.requestId,
          route: input.route,
          actorUserId: appUser.id,
          actorRole: appUser.role,
          conversationId: input.conversationId,
          studentUserId: appUser.id,
        },
        textPreview: aiReply.replyText.slice(0, 200),
      });

      assistantMessageText =
        outputModeration.status === "blocked"
          ? buildModerationSafeReply(appUser.ai_help_language)
          : aiReply.replyText;

      if (
        input.payload.intent === "student_message" &&
        !hasSuccessfulAssistantReply &&
        outputModeration.status !== "blocked"
      ) {
        try {
          const titleResult = await aiProvider.generateConversationTitle({
            conversation,
            firstStudentMessageText: studentMessageText,
            firstAssistantReplyText: assistantMessageText,
            languageCode: appUser.ai_help_language,
            requestContext: {
              requestId: input.requestId,
              route: input.route,
              actorUserId: appUser.id,
              actorRole: appUser.role,
              conversationId: input.conversationId,
              studentUserId: appUser.id,
            },
          });
          const summarizedTitle = normalizeConversationTitle(
            titleResult.titleText,
          );

          if (summarizedTitle) {
            nextConversationTitle = summarizedTitle;
            titleUsage = titleResult.usage;
          }
        } catch {
          // Best-effort polish only. Provider logs already capture the failure.
        }
      }
    } catch (error) {
      const fallbackError = isAppError(error) ? error : null;
      assistantMessageText =
        buildProviderFailureFallbackCode(
          fallbackError,
          appUser.ai_help_language,
        ) ?? copy.appendMessage.providerFallback;

      logRuntimeInfo({
        message: "Fell back to learner-facing provider retry reply",
        requestId: input.requestId,
        route: input.route,
        method: "POST",
        actorUserId: appUser.id,
        actorRole: appUser.role,
        targetStudentUserId: appUser.id,
        details: {
          conversationId: input.conversationId,
          intent: input.payload.intent,
          error_code: fallbackError?.code ?? null,
          error_status: fallbackError?.status ?? null,
          fallback_message: assistantMessageText,
          reason:
            error instanceof Error
              ? error.message
              : "coach_provider_failure",
        },
      });
    }
  }
  const studentCreatedAt = new Date();
  const assistantCreatedAt = new Date(studentCreatedAt.getTime() + 1);
  const admin = createSupabaseAdminClient();

  const { data: insertedMessages, error: insertError } = await admin
    .from("messages")
    .insert([
      {
        conversation_id: input.conversationId,
        author_user_id: appUser.id,
        role: "student",
        content_text: persistedStudentMessageText,
        content_language: appUser.ai_help_language,
        model_provider: null,
        model_name: null,
        input_tokens: null,
        output_tokens: null,
        created_at: studentCreatedAt.toISOString(),
      },
      {
        conversation_id: input.conversationId,
        author_user_id: null,
        role: "assistant",
        content_text: assistantMessageText,
        content_language: appUser.ai_help_language,
        model_provider: successfulAiReply ? aiProvider.name : null,
        model_name: successfulAiReply?.generatedModelName ?? null,
        input_tokens: providerUsage?.inputTokens ?? null,
        output_tokens: providerUsage?.outputTokens ?? null,
        created_at: assistantCreatedAt.toISOString(),
      },
    ])
    .select(MESSAGE_SELECT);

  if (insertError) {
    throw toServiceError("Unable to append the conversation turn.", insertError);
  }

  const studentMessage = (insertedMessages ?? []).find(
    (message) => message.role === "student",
  ) as ConversationMessageRecord | undefined;
  const assistantMessage = (insertedMessages ?? []).find(
    (message) => message.role === "assistant",
  ) as ConversationMessageRecord | undefined;

  if (!studentMessage || !assistantMessage) {
    throw new AppError({
      code: "internal_error",
      message: "Conversation messages were created in an unexpected shape.",
      status: 500,
    });
  }

  const { error: conversationUpdateError } = await admin
    .from("conversations")
    .update({
      last_message_at: assistantCreatedAt.toISOString(),
      title: nextConversationTitle,
    })
    .eq("id", input.conversationId);

  if (conversationUpdateError) {
    throw toServiceError(
      "Unable to update the conversation activity timestamp.",
      conversationUpdateError,
    );
  }

  logRuntimeInfo({
    message: "Appended conversation turn",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: appUser.id,
    actorRole: appUser.role,
    targetStudentUserId: appUser.id,
    details: {
      conversationId: input.conversationId,
      intent: input.payload.intent,
    },
  });

  await recordStudentUsageDeltaBestEffort({
    studentUserId: appUser.id,
    delta: {
      assistantMessages: 1,
    },
  });
  await recordStudentAiUsageBestEffort({
    studentUserId: appUser.id,
    usage: providerUsage,
  });
  await recordStudentAiUsageBestEffort({
    studentUserId: appUser.id,
    usage: titleUsage,
  });

  if (successfulAiReply) {
    await recordSuccessfulCoachReplyDebugCaptureBestEffort({
      requestId: input.requestId,
      route: input.route,
      conversationId: input.conversationId,
      studentUserId: appUser.id,
      studentMessageId: studentMessage.id,
      assistantMessageId: assistantMessage.id,
      provider: aiProvider.name,
      requestedModelName: successfulAiReply.requestedModelName,
      modelName: successfulAiReply.generatedModelName,
      fallbackModelName: successfulAiReply.fallbackModelName,
      promptVersion: successfulAiReply.promptVersion,
      replyMode: input.payload.replyMode,
      rawOutputText: successfulAiReply.rawOutputText,
      finalOutputText: assistantMessageText,
      coachingMode: successfulAiReply.coachingMode,
      asksForAttempt: successfulAiReply.asksForAttempt,
      usage: successfulAiReply.usage,
    });
  }

  return {
    conversation: {
      ...conversation,
      title: nextConversationTitle,
      last_message_at: assistantCreatedAt.toISOString(),
    },
    studentMessage,
    assistantMessage,
  };
}

export async function updateWorkspaceState(input: {
  context: AuthenticatedUserContext;
  conversationId: string;
  payload: UpdateWorkspaceInput;
  requestId: string;
  route: string;
}): Promise<WorkspaceStateRecord> {
  const { appUser, conversation, supabase } =
    await requireWritableStudentConversation({
      context: input.context,
      conversationId: input.conversationId,
    });

  if (conversation.status !== "active") {
    const copy = getStudentConversationServerCopy(appUser.preferred_ui_language);
    throw new AppError({
      code: "conflict",
      message: copy.access.sessionReadOnly,
      status: 409,
    });
  }

  const assignmentText = normalizeText(input.payload.assignmentText);
  const editedExtractedText = normalizeText(input.payload.editedExtractedText);
  const planText = normalizeText(input.payload.planText);
  const draftAnswerText = normalizeText(input.payload.draftAnswerText);
  const studentNotes = normalizeText(input.payload.studentNotes);

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspace_states")
    .update({
      assignment_text: assignmentText,
      edited_extracted_text: editedExtractedText,
      plan_text: planText,
      draft_answer_text: draftAnswerText,
      student_notes: studentNotes,
      last_saved_by_user_id: appUser.id,
    })
    .eq("conversation_id", input.conversationId)
    .select(WORKSPACE_SELECT)
    .single<WorkspaceStateRecord>();

  if (workspaceError) {
    throw toServiceError("Unable to save the workspace draft.", workspaceError);
  }

  const { error: conversationError } = await supabase
    .from("conversations")
    .update({
      assignment_text: assignmentText,
      edited_extracted_text: editedExtractedText,
    })
    .eq("id", conversation.id);

  if (conversationError) {
    throw toServiceError("Unable to sync conversation text fields.", conversationError);
  }

  logRuntimeInfo({
    message: "Saved workspace draft",
    requestId: input.requestId,
    route: input.route,
    method: "PATCH",
    actorUserId: appUser.id,
    actorRole: appUser.role,
    targetStudentUserId: appUser.id,
    details: {
      conversationId: input.conversationId,
    },
  });

  return workspace;
}

export async function completeConversation(input: {
  context: AuthenticatedUserContext;
  conversationId: string;
  requestId: string;
  route: string;
}): Promise<CompleteConversationResult> {
  const { appUser, conversation, supabase } =
    await requireWritableStudentConversation({
      context: input.context,
      conversationId: input.conversationId,
    });

  if (conversation.status === "archived") {
    const copy = getStudentConversationServerCopy(appUser.preferred_ui_language);
    throw new AppError({
      code: "conflict",
      message: copy.access.archivedCannotComplete,
      status: 409,
    });
  }

  const [workspaceResult, messagesResult, attachmentsResult, summariesResult] = await Promise.all([
    supabase
      .from("workspace_states")
      .select(WORKSPACE_SELECT)
      .eq("conversation_id", input.conversationId)
      .maybeSingle<WorkspaceStateRecord>(),
    supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("conversation_id", input.conversationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("attachments")
      .select(ATTACHMENT_SELECT)
      .eq("conversation_id", input.conversationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("session_summaries")
      .select(SUMMARY_SELECT)
      .eq("conversation_id", input.conversationId)
      .order("created_at", { ascending: false }),
  ]);

  if (workspaceResult.error) {
    throw toServiceError("Unable to load the workspace before completion.", workspaceResult.error);
  }

  if (messagesResult.error) {
    throw toServiceError("Unable to load conversation messages before completion.", messagesResult.error);
  }

  if (attachmentsResult.error) {
    throw toServiceError(
      "Unable to load existing attachments before completion.",
      attachmentsResult.error,
    );
  }

  if (summariesResult.error) {
    throw toServiceError("Unable to load existing summaries before completion.", summariesResult.error);
  }

  const existingVisibleSummaries =
    (summariesResult.data ?? []) as SessionSummaryRecord[];
  const existingStudentSummary =
    existingVisibleSummaries.find((summary) => summary.audience === "student") ?? null;

  if (conversation.status === "completed" && existingStudentSummary) {
    logRuntimeInfo({
      message: "Reused existing completion artifacts",
      requestId: input.requestId,
      route: input.route,
      method: "POST",
      actorUserId: appUser.id,
      actorRole: appUser.role,
      targetStudentUserId: appUser.id,
      details: {
        conversationId: input.conversationId,
        summaryCount: existingVisibleSummaries.length,
      },
    });

    return {
      conversation,
      summaries: [existingStudentSummary],
    };
  }

  const now = new Date().toISOString();
  let completedConversation = conversation;

  if (conversation.status !== "completed") {
    const { data, error } = await supabase
      .from("conversations")
      .update({
        status: "completed",
        completed_at: now,
        last_message_at: now,
      })
      .eq("id", input.conversationId)
      .select(CONVERSATION_SELECT)
      .single<ConversationRecord>();

    if (error) {
      throw toServiceError("Unable to mark the conversation complete.", error);
    }

    completedConversation = data;
  }

  const summaries = await generateConversationSummaries({
    requestId: input.requestId,
    route: input.route,
    appUser,
    conversation: completedConversation,
    workspace: workspaceResult.data ?? null,
    messages: (messagesResult.data ?? []) as ConversationMessageRecord[],
    attachments: (attachmentsResult.data ?? []) as ConversationAttachmentRecord[],
  });
  try {
    await refreshStudentMemoryFromConversationCompletion({
      appUser,
      conversation: completedConversation,
      workspace: workspaceResult.data ?? null,
      messages: (messagesResult.data ?? []) as ConversationMessageRecord[],
      attachments: (attachmentsResult.data ?? []) as ConversationAttachmentRecord[],
      summaries,
      requestId: input.requestId,
      route: input.route,
    });
  } catch (error) {
    logRuntimeError({
      message: "Student memory refresh failed",
      requestId: input.requestId,
      route: input.route,
      method: "POST",
      actorUserId: appUser.id,
      actorRole: appUser.role,
      targetStudentUserId: appUser.id,
      errorCode: "memory_refresh_failed",
      details: {
        conversationId: input.conversationId,
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
  const studentSummary =
    summaries.find((summary) => summary.audience === "student") ?? null;
  const visibleSummaries = studentSummary ? [studentSummary] : [];

  logRuntimeInfo({
    message: "Completed conversation",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: appUser.id,
    actorRole: appUser.role,
    targetStudentUserId: appUser.id,
    details: {
      conversationId: input.conversationId,
      summaryAudience: studentSummary?.audience ?? "student",
      summaryCount: summaries.length,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: appUser.id,
      actorRole: appUser.role,
      action: "conversation_complete",
      targetTable: "conversations",
      targetId: input.conversationId,
      studentUserId: appUser.id,
      conversationId: input.conversationId,
      metadata: {
        request_id: input.requestId,
        route: input.route,
        summary_audience: studentSummary?.audience ?? "student",
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block the student flow.
  }

  return {
    conversation: completedConversation,
    summaries: visibleSummaries,
  };
}
