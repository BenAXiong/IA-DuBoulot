import "server-only";

import { getStudentUploadServerCopy } from "@/lib/i18n/student-flow-copy";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAiProvider } from "@/lib/server/ai/provider";
import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import {
  requireActiveAppUser,
  requireAppUserContext,
  requireAppUserRole,
} from "@/lib/server/auth/authorization";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import { AppError } from "@/lib/server/errors/app-error";
import {
  moderateExtraction,
  recordModerationEvent,
} from "@/lib/server/moderation/service";
import { logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import {
  assertStudentUsageActionAllowed,
  recordStudentAiUsageBestEffort,
  recordStudentUsageDeltaBestEffort,
} from "@/lib/server/usage/service";
import {
  ALLOWED_ATTACHMENT_RULES,
  ATTACHMENT_MAX_PER_CONVERSATION,
  ATTACHMENT_MAX_OBJECT_UPLOAD_BYTES,
  ATTACHMENT_MAX_TOTAL_BYTES,
  ATTACHMENT_READ_URL_TTL_SECONDS,
  HOMEWORK_ATTACHMENTS_BUCKET,
  type AllowedAttachmentMimeType,
  type UploadSource,
} from "@/lib/server/uploads/constants";
import type {
  AttachmentAccessInput,
  AttachmentAccessResult,
  ConfirmUploadInput,
  ConfirmUploadResult,
  CreateUploadTargetInput,
  CreateUploadTargetResult,
  DeleteAttachmentInput,
  DeleteAttachmentResult,
  RetryAttachmentExtractionResult,
} from "@/lib/server/uploads/types";

const ATTACHMENT_SELECT =
  "id, conversation_id, uploaded_by_user_id, storage_bucket, storage_path, attachment_kind, mime_type, original_filename, byte_size, page_count, extraction_status, raw_extracted_text, source_language, metadata, created_at, updated_at";
const CONVERSATION_SELECT =
  "id, student_user_id, created_by_user_id, title, subject_tag, status, graded_homework, assignment_text, edited_extracted_text, source_language, last_message_at, completed_at, created_at, updated_at";

function toServiceError(message: string, cause: unknown) {
  return new AppError({
    code: "service_unavailable",
    message,
    status: 503,
    retryable: true,
    cause,
  });
}

function requireBodyObject(body: unknown, languageCode: UiLanguageCode) {
  const copy = getStudentUploadServerCopy(languageCode);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError({
      code: "bad_request",
      message: copy.requestErrors.expectedObject,
      status: 400,
    });
  }

  return body as Record<string, unknown>;
}

function isAllowedMimeType(value: string): value is AllowedAttachmentMimeType {
  return value in ALLOWED_ATTACHMENT_RULES;
}

function buildStoragePath(input: {
  studentUserId: string;
  conversationId: string;
  attachmentId: string;
  mimeType: AllowedAttachmentMimeType;
}) {
  const extension = ALLOWED_ATTACHMENT_RULES[input.mimeType].extension;

  return [
    "student",
    input.studentUserId,
    "conversation",
    input.conversationId,
    "attachment",
    input.attachmentId,
    `source.${extension}`,
  ].join("/");
}

function normalizeMetadata(
  metadata: unknown,
): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  return metadata as Record<string, unknown>;
}

function buildExtractedTextBlock(input: {
  filename: string;
  extractedText: string | null;
  languageCode: UiLanguageCode;
}) {
  const copy = getStudentUploadServerCopy(input.languageCode);
  const extractedText = input.extractedText?.trim() ?? "";

  if (!extractedText) {
    return null;
  }

  return [copy.warnings.sourceLabel(input.filename), extractedText].join("\n");
}

function buildExtractionWarningMessage(languageCode: UiLanguageCode) {
  return getStudentUploadServerCopy(languageCode).warnings.extractionFailed;
}

function buildPartialExtractionWarningMessage(languageCode: UiLanguageCode) {
  return getStudentUploadServerCopy(languageCode).warnings.extractionPartial;
}

function buildUploadProviderFailureCode(
  error: unknown,
  languageCode: UiLanguageCode,
) {
  const copy = getStudentUploadServerCopy(languageCode);
  const appError = error instanceof AppError ? error : null;
  const details = appError?.details ?? {};
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
    return copy.warnings.extractionProviderHighDemandCode;
  }

  return copy.warnings.extractionProviderGenericCode;
}

function buildStoredExtractionWarningMessage(
  attachment: ConversationAttachmentRecord,
  languageCode: UiLanguageCode,
) {
  if (attachment.extraction_status === "failed") {
    return buildExtractionWarningMessage(languageCode);
  }

  const metadata = normalizeMetadata(attachment.metadata);
  const needsManualReview = metadata.needs_manual_review === true;
  const confidence =
    typeof metadata.ocr_confidence === "number"
      ? metadata.ocr_confidence
      : null;

  if (needsManualReview || (confidence !== null && confidence < 0.55)) {
    return buildPartialExtractionWarningMessage(languageCode);
  }

  return null;
}

function buildExistingExtractionResult(
  attachment: ConversationAttachmentRecord,
  languageCode: UiLanguageCode,
): ConfirmUploadResult {
  return {
    attachment,
    extractedTextBlock:
      attachment.extraction_status === "ready"
        ? buildExtractedTextBlock({
            filename: attachment.original_filename,
            extractedText: attachment.raw_extracted_text,
            languageCode,
          })
        : null,
    warningMessage: buildStoredExtractionWarningMessage(
      attachment,
      languageCode,
    ),
  };
}

type ParsedCreateUploadTargetRequest = Pick<
  CreateUploadTargetInput,
  "conversationId" | "originalFilename" | "mimeType" | "byteSize" | "uploadSource"
>;

export async function parseCreateUploadTargetRequest(
  request: Request,
  languageCode: UiLanguageCode = "fr",
): Promise<ParsedCreateUploadTargetRequest> {
  const copy = getStudentUploadServerCopy(languageCode);
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
  const conversationId =
    typeof payload.conversationId === "string" ? payload.conversationId : "";
  const originalFilename =
    typeof payload.originalFilename === "string" ? payload.originalFilename : "";
  const mimeType = typeof payload.mimeType === "string" ? payload.mimeType : "";
  const byteSize =
    typeof payload.byteSize === "number" ? payload.byteSize : Number.NaN;
  const uploadSource: UploadSource =
    payload.uploadSource === "camera" ||
    payload.uploadSource === "paste" ||
    payload.uploadSource === "drag_drop"
      ? payload.uploadSource
      : "file_picker";

  if (!conversationId.trim()) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        conversationId: copy.validation.conversationIdRequired,
      },
    });
  }

  if (!originalFilename.trim()) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        originalFilename: copy.validation.originalFilenameRequired,
      },
    });
  }

  return {
    conversationId: conversationId.trim(),
    originalFilename: originalFilename.trim(),
    mimeType: mimeType.trim(),
    byteSize,
    uploadSource,
  };
}

export async function parseConfirmUploadRequest(
  request: Request,
  languageCode: UiLanguageCode = "fr",
) {
  const copy = getStudentUploadServerCopy(languageCode);
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
  const conversationId =
    typeof payload.conversationId === "string" ? payload.conversationId : "";
  const attachmentId =
    typeof payload.attachmentId === "string" ? payload.attachmentId : "";

  if (!conversationId.trim() || !attachmentId.trim()) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        attachmentId: copy.validation.attachmentIdsRequired,
      },
    });
  }

  return {
    conversationId: conversationId.trim(),
    attachmentId: attachmentId.trim(),
  };
}

async function sha256Hex(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function ensureAttachmentBucket() {
  const supabase = createSupabaseAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw toServiceError("Unable to list storage buckets.", listError);
  }

  const exists = (buckets ?? []).some(
    (bucket) => bucket.name === HOMEWORK_ATTACHMENTS_BUCKET,
  );

  if (exists) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(
    HOMEWORK_ATTACHMENTS_BUCKET,
    {
      public: false,
      fileSizeLimit: `${ATTACHMENT_MAX_OBJECT_UPLOAD_BYTES}`,
      allowedMimeTypes: Object.keys(ALLOWED_ATTACHMENT_RULES),
    },
  );

  if (createError) {
    throw toServiceError("Unable to create the attachment bucket.", createError);
  }
}

async function requireWritableConversation(input: {
  context: CreateUploadTargetInput["context"];
  conversationId: string;
}) {
  const appUser = requireAppUserContext(input.context);
  const copy = getStudentUploadServerCopy(appUser.preferred_ui_language);
  requireAppUserRole(appUser, ["student"]);
  requireActiveAppUser(appUser);

  const supabase = await createSupabaseServerClient();
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", input.conversationId)
    .maybeSingle();

  if (error) {
    throw toServiceError("Unable to load the conversation.", error);
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

  if (conversation.status !== "active") {
    throw new AppError({
      code: "conflict",
      message: copy.access.uploadsClosed,
      status: 409,
    });
  }

  return {
    appUser,
    conversation,
    supabase,
  };
}

async function loadAttachmentForOwner(input: {
  context: ConfirmUploadInput["context"];
  conversationId: string;
  attachmentId: string;
}) {
  const { appUser, conversation } = await requireWritableConversation({
    context: input.context,
    conversationId: input.conversationId,
  });
  const copy = getStudentUploadServerCopy(appUser.preferred_ui_language);
  const admin = createSupabaseAdminClient();
  const { data: attachment, error } = await admin
    .from("attachments")
    .select(ATTACHMENT_SELECT)
    .eq("id", input.attachmentId)
    .eq("conversation_id", input.conversationId)
    .maybeSingle();

  if (error) {
    throw toServiceError("Unable to load the attachment.", error);
  }

  if (!attachment) {
    throw new AppError({
      code: "not_found",
      message: copy.access.attachmentNotFound,
      status: 404,
    });
  }

  if (attachment.uploaded_by_user_id !== appUser.id) {
    throw new AppError({
      code: "forbidden",
      message: copy.access.attachmentForbidden,
      status: 403,
    });
  }

  return {
    appUser,
    conversation,
    attachment: attachment as ConversationAttachmentRecord,
  };
}

async function loadAttachmentForOwnerById(input: {
  context: DeleteAttachmentInput["context"];
  attachmentId: string;
}) {
  const appUser = requireAppUserContext(input.context);
  const copy = getStudentUploadServerCopy(appUser.preferred_ui_language);
  requireAppUserRole(appUser, ["student"]);
  requireActiveAppUser(appUser);
  const admin = createSupabaseAdminClient();
  const { data: attachment, error } = await admin
    .from("attachments")
    .select(ATTACHMENT_SELECT)
    .eq("id", input.attachmentId)
    .maybeSingle();

  if (error) {
    throw toServiceError("Unable to load the attachment.", error);
  }

  if (!attachment) {
    throw new AppError({
      code: "not_found",
      message: copy.access.attachmentNotFound,
      status: 404,
    });
  }

  const { appUser: ownerAppUser, conversation } = await requireWritableConversation({
    context: input.context,
    conversationId: attachment.conversation_id,
  });

  if (attachment.uploaded_by_user_id !== ownerAppUser.id) {
    throw new AppError({
      code: "forbidden",
      message: copy.access.attachmentForbidden,
      status: 403,
    });
  }

  return {
    appUser: ownerAppUser,
    conversation,
    attachment: attachment as ConversationAttachmentRecord,
  };
}

export async function createUploadTarget(
  input: CreateUploadTargetInput,
): Promise<CreateUploadTargetResult> {
  const { appUser, conversation, supabase } = await requireWritableConversation({
    context: input.context,
    conversationId: input.conversationId,
  });
  const copy = getStudentUploadServerCopy(appUser.preferred_ui_language);
  await assertStudentUsageActionAllowed({
    studentUserId: appUser.id,
    action: "create_upload",
    languageCode: appUser.preferred_ui_language,
  });

  if (!isAllowedMimeType(input.mimeType)) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        mimeType: copy.validation.unsupportedFileType,
      },
    });
  }

  if (!Number.isFinite(input.byteSize) || input.byteSize <= 0) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        byteSize: copy.validation.fileSizePositive,
      },
    });
  }

  const attachmentRule = ALLOWED_ATTACHMENT_RULES[input.mimeType];

  if (input.byteSize > attachmentRule.maxBytes) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        byteSize: copy.validation.fileTooLarge(
          Math.round(attachmentRule.maxBytes / (1024 * 1024)),
        ),
      },
    });
  }

  const { data: existingAttachments, error: listError } = await supabase
    .from("attachments")
    .select("id, byte_size")
    .eq("conversation_id", input.conversationId);

  if (listError) {
    throw toServiceError("Unable to inspect existing attachments.", listError);
  }

  if ((existingAttachments ?? []).length >= ATTACHMENT_MAX_PER_CONVERSATION) {
    throw new AppError({
      code: "conflict",
      message: copy.validation.attachmentLimit,
      status: 409,
    });
  }

  const currentBytes = (existingAttachments ?? []).reduce(
    (sum, attachment) => sum + Number(attachment.byte_size ?? 0),
    0,
  );

  if (currentBytes + input.byteSize > ATTACHMENT_MAX_TOTAL_BYTES) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        byteSize: copy.validation.uploadBudgetExceeded,
      },
    });
  }

  await ensureAttachmentBucket();

  const attachmentId = crypto.randomUUID();
  const storagePath = buildStoragePath({
    studentUserId: conversation.student_user_id,
    conversationId: input.conversationId,
    attachmentId,
    mimeType: input.mimeType,
  });
  const attachmentKind =
    input.uploadSource === "paste" &&
    attachmentRule.attachmentKind === "image"
      ? "screenshot"
      : attachmentRule.attachmentKind;
  const originalFilename =
    input.originalFilename.trim() || `${attachmentKind}-${attachmentId}`;

  const { data: insertedAttachment, error: insertError } = await supabase
    .from("attachments")
    .insert({
      id: attachmentId,
      conversation_id: input.conversationId,
      uploaded_by_user_id: appUser.id,
      storage_bucket: HOMEWORK_ATTACHMENTS_BUCKET,
      storage_path: storagePath,
      attachment_kind: attachmentKind,
      mime_type: input.mimeType,
      original_filename: originalFilename,
      byte_size: input.byteSize,
      metadata: {
        upload_source: input.uploadSource,
        client_extension: originalFilename.includes(".")
          ? originalFilename.split(".").pop()?.toLowerCase() ?? ""
          : "",
      },
    })
    .select(ATTACHMENT_SELECT)
    .single();

  if (insertError) {
    throw toServiceError("Unable to create the attachment shell.", insertError);
  }

  const admin = createSupabaseAdminClient();
  const { data: signedUpload, error: signedUploadError } = await admin.storage
    .from(HOMEWORK_ATTACHMENTS_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (signedUploadError || !signedUpload?.token) {
    throw toServiceError(
      "Unable to create the signed upload target.",
      signedUploadError,
    );
  }

  await recordStudentUsageDeltaBestEffort({
    studentUserId: appUser.id,
    delta: {
      uploads: 1,
    },
  });

  return {
    attachment: insertedAttachment as ConversationAttachmentRecord,
    uploadTarget: {
      bucket: HOMEWORK_ATTACHMENTS_BUCKET,
      path: storagePath,
      token: signedUpload.token,
    },
  };
}

async function runAttachmentExtraction(input: {
  appUserId: string;
  appUserRole: "student";
  languageCode: UiLanguageCode;
  conversationId: string;
  attachment: ConversationAttachmentRecord;
  requestId: string;
  route: string;
}) {
  const admin = createSupabaseAdminClient();
  const { data: fileBlob, error: downloadError } = await admin.storage
    .from(input.attachment.storage_bucket)
    .download(input.attachment.storage_path);

  if (downloadError || !fileBlob) {
    throw toServiceError("Unable to read the uploaded attachment.", downloadError);
  }

  const sha256 = await sha256Hex(fileBlob);
  const aiProvider = getAiProvider();
  const normalizedMetadata = normalizeMetadata(input.attachment.metadata);
  let extraction;

  try {
    extraction = await aiProvider.extractAttachmentText({
      attachmentId: input.attachment.id,
      originalFilename: input.attachment.original_filename,
      mimeType: input.attachment.mime_type,
      byteSize: input.attachment.byte_size,
      fileBlob,
      requestContext: {
        requestId: input.requestId,
        route: input.route,
        actorUserId: input.appUserId,
        actorRole: input.appUserRole,
        conversationId: input.conversationId,
        attachmentId: input.attachment.id,
        studentUserId: input.appUserId,
      },
    });
  } catch (error) {
    const { data: failedAttachment, error: updateError } = await admin
      .from("attachments")
      .update({
        extraction_status: "failed",
        raw_extracted_text: null,
        metadata: {
          ...normalizedMetadata,
          sha256,
          extraction_engine: "gemini_file_understanding",
          extraction_error: "provider_failure",
          needs_manual_review: true,
        },
      })
      .eq("id", input.attachment.id)
      .select(ATTACHMENT_SELECT)
      .single();

    if (updateError) {
      throw toServiceError("Unable to persist extraction failure metadata.", updateError);
    }

    return {
      attachment: failedAttachment as ConversationAttachmentRecord,
      extractedTextBlock: null,
      warningMessage: buildUploadProviderFailureCode(
        error,
        input.languageCode,
      ),
    };
  }

  const moderation = moderateExtraction(extraction.extractedText ?? "");
  await recordStudentAiUsageBestEffort({
    studentUserId: input.appUserId,
    usage: extraction.usage,
  });

  await recordModerationEvent({
    source: "attachment_extraction",
    result: moderation,
    actorUserId: input.appUserId,
    actorRole: input.appUserRole,
    conversationId: input.conversationId,
    attachmentId: input.attachment.id,
    requestContext: {
      requestId: input.requestId,
      route: input.route,
      actorUserId: input.appUserId,
      actorRole: input.appUserRole,
      conversationId: input.conversationId,
      attachmentId: input.attachment.id,
      studentUserId: input.appUserId,
    },
    textPreview: extraction.extractedText?.slice(0, 200) ?? null,
  });

  const shouldFailExtraction =
    !extraction.extractedText || moderation.status === "blocked";
  const warningMessage = shouldFailExtraction
    ? buildExtractionWarningMessage(input.languageCode)
    : extraction.needsManualReview || (extraction.confidenceScore ?? 0) < 0.55
      ? buildPartialExtractionWarningMessage(input.languageCode)
      : null;

  const { data: updatedAttachment, error: updateError } = await admin
    .from("attachments")
    .update({
      extraction_status: shouldFailExtraction ? "failed" : "ready",
      raw_extracted_text: shouldFailExtraction ? null : extraction.extractedText,
      source_language: extraction.detectedLanguage,
      page_count: extraction.pageCountEstimate,
      metadata: {
        ...normalizedMetadata,
        sha256,
        extraction_engine: "gemini_file_understanding",
        extraction_version: extraction.promptVersion,
        ocr_confidence: extraction.confidenceScore,
        detected_language: extraction.detectedLanguage,
        needs_manual_review: extraction.needsManualReview,
      },
    })
    .eq("id", input.attachment.id)
    .select(ATTACHMENT_SELECT)
    .single();

  if (updateError) {
    throw toServiceError("Unable to persist extraction metadata.", updateError);
  }

  return {
    attachment: updatedAttachment as ConversationAttachmentRecord,
    extractedTextBlock: buildExtractedTextBlock({
      filename: input.attachment.original_filename,
      extractedText: shouldFailExtraction ? null : extraction.extractedText,
      languageCode: input.languageCode,
    }),
    warningMessage,
  };
}

export async function confirmUpload(
  input: ConfirmUploadInput,
): Promise<ConfirmUploadResult> {
  const { appUser, conversation, attachment } = await loadAttachmentForOwner({
    context: input.context,
    conversationId: input.conversationId,
    attachmentId: input.attachmentId,
  });
  const copy = getStudentUploadServerCopy(appUser.preferred_ui_language);

  const admin = createSupabaseAdminClient();
  const { data: objectInfo, error: infoError } = await admin.storage
    .from(attachment.storage_bucket)
    .info(attachment.storage_path);

  if (infoError || !objectInfo) {
    throw toServiceError("Uploaded file is not available yet.", infoError);
  }

  const objectSize =
    typeof objectInfo.size === "number"
      ? objectInfo.size
      : Number(objectInfo.size ?? 0);

  if (!objectSize || objectSize !== attachment.byte_size) {
    throw new AppError({
      code: "conflict",
      message: copy.access.attachmentSizeMismatch,
      status: 409,
    });
  }

  const { data: currentAttachmentRow, error: currentAttachmentError } = await admin
    .from("attachments")
    .select(ATTACHMENT_SELECT)
    .eq("id", attachment.id)
    .single();

  if (currentAttachmentError || !currentAttachmentRow) {
    throw toServiceError("Unable to reload the attachment after upload.", currentAttachmentError);
  }

  const currentAttachment = currentAttachmentRow as ConversationAttachmentRecord;

  if (
    currentAttachment.extraction_status === "failed" ||
    (currentAttachment.extraction_status === "ready" &&
      typeof currentAttachment.raw_extracted_text === "string")
  ) {
    logRuntimeInfo({
      message: "Reused existing attachment extraction result",
      requestId: input.requestId,
      route: input.route,
      method: "POST",
      actorUserId: appUser.id,
      actorRole: "student",
      targetStudentUserId: appUser.id,
      details: {
        attachmentId: currentAttachment.id,
        conversationId: conversation.id,
        extractionStatus: currentAttachment.extraction_status,
      },
    });

    return buildExistingExtractionResult(
      currentAttachment,
      appUser.preferred_ui_language,
    );
  }

  return runAttachmentExtraction({
    appUserId: appUser.id,
    appUserRole: "student",
    languageCode: appUser.preferred_ui_language,
    conversationId: conversation.id,
    attachment: currentAttachment,
    requestId: input.requestId,
    route: input.route,
  });
}

export async function retryAttachmentExtraction(
  input: ConfirmUploadInput,
): Promise<RetryAttachmentExtractionResult> {
  const { appUser, conversation, attachment } = await loadAttachmentForOwner({
    context: input.context,
    conversationId: input.conversationId,
    attachmentId: input.attachmentId,
  });

  return runAttachmentExtraction({
    appUserId: appUser.id,
    appUserRole: "student",
    languageCode: appUser.preferred_ui_language,
    conversationId: conversation.id,
    attachment,
    requestId: input.requestId,
    route: input.route,
  });
}

export async function createAttachmentAccessUrl(
  input: AttachmentAccessInput,
): Promise<AttachmentAccessResult> {
  const appUser = requireAppUserContext(input.context);
  const copy = getStudentUploadServerCopy(appUser.preferred_ui_language);
  requireActiveAppUser(appUser);
  const supabase = await createSupabaseServerClient();
  const { data: attachment, error } = await supabase
    .from("attachments")
    .select(ATTACHMENT_SELECT)
    .eq("id", input.attachmentId)
    .maybeSingle();

  if (error) {
    throw toServiceError("Unable to load the attachment for access.", error);
  }

  if (!attachment) {
    throw new AppError({
      code: "not_found",
      message: copy.access.attachmentNotFound,
      status: 404,
    });
  }

  const admin = createSupabaseAdminClient();
  const { data: signedUrlData, error: signedUrlError } = await admin.storage
    .from(attachment.storage_bucket)
    .createSignedUrl(attachment.storage_path, ATTACHMENT_READ_URL_TTL_SECONDS);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw toServiceError("Unable to create attachment access.", signedUrlError);
  }

  return {
    signedUrl: signedUrlData.signedUrl,
  };
}

export async function deleteAttachment(
  input: DeleteAttachmentInput,
): Promise<DeleteAttachmentResult> {
  const { appUser, conversation, attachment } =
    await loadAttachmentForOwnerById({
      context: input.context,
      attachmentId: input.attachmentId,
    });

  const admin = createSupabaseAdminClient();
  await admin.storage
    .from(attachment.storage_bucket)
    .remove([attachment.storage_path])
    .catch(() => null);

  const { error: deleteError } = await admin
    .from("attachments")
    .delete()
    .eq("id", attachment.id);

  if (deleteError) {
    throw toServiceError("Unable to delete the attachment.", deleteError);
  }

  logRuntimeInfo({
    message: "Deleted conversation attachment",
    requestId: input.requestId,
    route: input.route,
    method: "DELETE",
    actorUserId: appUser.id,
    actorRole: "student",
    targetStudentUserId: appUser.id,
    details: {
      conversationId: conversation.id,
      attachmentId: attachment.id,
    },
  });

  return {
    attachmentId: attachment.id,
    conversationId: conversation.id,
  };
}
