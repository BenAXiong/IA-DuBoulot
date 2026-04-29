import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getStudentUploadServerCopy } from "@/lib/i18n/student-flow-copy";
import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import { getAiProvider } from "@/lib/server/ai/provider";
import { logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import {
  requireActiveAppUser,
  requireAppUserContext,
  requireAppUserRole,
} from "@/lib/server/auth/authorization";
import type { AuthenticatedUserContext, UiLanguageCode } from "@/lib/server/auth/types";
import type { ConversationRecord } from "@/lib/server/conversations/types";
import { AppError } from "@/lib/server/errors/app-error";
import {
  moderateExtraction,
  recordModerationEvent,
} from "@/lib/server/moderation/service";
import {
  assertStudentUsageActionAllowed,
  recordStudentAiUsageBestEffort,
  recordStudentUsageDeltaBestEffort,
} from "@/lib/server/usage/service";
import {
  ALLOWED_ATTACHMENT_RULES,
  HOMEWORK_ATTACHMENTS_BUCKET,
} from "@/lib/server/uploads/constants";
import {
  SUBJECT_RESOURCE_ALLOWED_MIME_TYPES,
  SUBJECT_RESOURCE_POLICY_BY_MIME,
  resolveSubjectResourcePolicyInput,
  type SubjectResourceMimeType,
} from "@/lib/subject-resources/subject-resource-policy";
import type {
  ConversationResourceLinkRecord,
  SubjectResourceChunkRecord,
  SubjectResourceLibraryItem,
  SubjectResourceRetrievalChunk,
  SubjectResourceRetrievalResult,
  SubjectResourceRecord,
  SubjectResourceReuseResult,
} from "@/lib/server/subject-resources/types";
import {
  AI_CONTEXT_LIMITS,
  truncateForAiContext,
} from "@/lib/server/ai/guardrails";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SUBJECT_RESOURCE_SELECT =
  "id, student_user_id, created_by_user_id, subject_tag, source_attachment_id, source_conversation_id, source_storage_bucket, source_storage_path, attachment_kind, mime_type, original_filename, byte_size, page_count, extraction_status, raw_extracted_text, source_language, sha256, metadata, created_at, updated_at";
const CONVERSATION_RESOURCE_LINK_SELECT =
  "id, conversation_id, resource_id, created_by_user_id, selected, created_at, updated_at";
const SUBJECT_RESOURCE_CHUNK_SELECT =
  "id, resource_id, student_user_id, subject_tag, chunk_index, stable_chunk_id, page_start, page_end, section_title, content, char_count, token_estimate, extraction_confidence, metadata, created_at, updated_at";
const CONVERSATION_SELECT =
  "id, student_user_id, created_by_user_id, title, subject_tag, status, graded_homework, assignment_text, edited_extracted_text, source_language, last_message_at, completed_at, created_at, updated_at";
const CHUNKER_VERSION = "subject-resource-chunker-v1";
const MAX_CHUNK_CHARS = 3200;
const CHUNK_OVERLAP_CHARS = 240;
const MAX_SUBJECT_TAG_LENGTH = 60;
const SUBJECT_RESOURCE_BUCKET_ALLOWED_MIME_TYPES = Array.from(
  new Set([
    ...Object.keys(ALLOWED_ATTACHMENT_RULES),
    ...SUBJECT_RESOURCE_ALLOWED_MIME_TYPES,
  ]),
);

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

function normalizeMetadata(metadata: unknown): Record<string, unknown> {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {};
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function metadataNumber(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function metadataBoolean(metadata: Record<string, unknown>, key: string) {
  return metadata[key] === true;
}

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function normalizeSubjectTag(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function buildStoragePath(input: {
  studentUserId: string;
  subjectTag: string;
  resourceId: string;
  mimeType: SubjectResourceMimeType;
}) {
  const extension = SUBJECT_RESOURCE_POLICY_BY_MIME[input.mimeType].extension;
  const normalizedSubject = input.subjectTag
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "subject";

  return [
    "student",
    input.studentUserId,
    "subject",
    normalizedSubject,
    "resource",
    input.resourceId,
    `source.${extension}`,
  ].join("/");
}

async function sha256Hex(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function buildDirectTextSummary(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 280) : null;
}

function buildDirectTextOutline(text: string) {
  const headings = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || line.length > 140) {
        return false;
      }

      return (
        /^#{1,6}\s+\S/.test(line) ||
        /^(chapitre|partie|section|exercice|activit[eé]|m[eé]thode)\b/i.test(line) ||
        /^\d+(?:[.)]|\s+-)\s+\S/.test(line)
      );
    })
    .slice(0, 12)
    .map((line) => line.replace(/^#{1,6}\s+/, ""));

  return headings.length > 0 ? headings.join("\n") : null;
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function makeStableChunkId(input: {
  pageStart: number | null;
  pageEnd: number | null;
  chunkIndex: number;
}) {
  const pagePart =
    input.pageStart && input.pageEnd
      ? `p${input.pageStart}-${input.pageEnd}`
      : "punknown";
  return `v1:${pagePart}:c${input.chunkIndex}`;
}

function splitNearBoundary(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return [text.trim()];
  }

  const parts: string[] = [];
  let start = 0;

  while (start < text.length) {
    const hardEnd = Math.min(text.length, start + maxChars);
    const window = text.slice(start, hardEnd);
    const paragraphBreak = window.lastIndexOf("\n\n");
    const lineBreak = window.lastIndexOf("\n");
    const sentenceBreak = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("? "),
      window.lastIndexOf("! "),
    );
    const candidateBreak = Math.max(paragraphBreak, lineBreak, sentenceBreak);
    const end =
      candidateBreak > Math.floor(maxChars * 0.55)
        ? start + candidateBreak + 1
        : hardEnd;
    const part = text.slice(start, end).trim();

    if (part) {
      parts.push(part);
    }

    if (end >= text.length) {
      break;
    }

    start = Math.max(end - CHUNK_OVERLAP_CHARS, start + 1);
  }

  return parts;
}

function splitEvenlyByPageEstimate(text: string, pageCount: number) {
  const pages: Array<{ pageStart: number; pageEnd: number; content: string }> = [];
  const targetLength = Math.ceil(text.length / pageCount);
  let start = 0;

  for (let page = 1; page <= pageCount; page += 1) {
    const isLastPage = page === pageCount;
    const hardEnd = isLastPage ? text.length : Math.min(text.length, start + targetLength);
    const window = text.slice(start, hardEnd);
    const boundary = window.lastIndexOf("\n\n");
    const end =
      !isLastPage && boundary > Math.floor(targetLength * 0.55)
        ? start + boundary
        : hardEnd;
    const content = text.slice(start, end).trim();

    if (content) {
      pages.push({
        pageStart: page,
        pageEnd: page,
        content,
      });
    }

    start = end;
  }

  return pages;
}

function splitByPageMarkers(text: string) {
  const markerPattern =
    /(^|\n)\s*(?:-{2,}\s*)?(?:page|p\.?|page\s+numero|page\s+n[°o]?|página)\s+(\d{1,4})(?:\s*(?:\/|sur)\s*\d{1,4})?\s*(?:-{2,})?\s*(?=\n|$)/giu;
  const markers = Array.from(text.matchAll(markerPattern))
    .map((match) => ({
      index: match.index ?? 0,
      markerLength: match[0].length,
      pageNumber: Number(match[2]),
    }))
    .filter((marker) => Number.isInteger(marker.pageNumber) && marker.pageNumber > 0);

  if (markers.length < 2) {
    return null;
  }

  return markers
    .map((marker, index) => {
      const nextMarker = markers[index + 1] ?? null;
      const contentStart = marker.index + marker.markerLength;
      const contentEnd = nextMarker?.index ?? text.length;
      return {
        pageStart: marker.pageNumber,
        pageEnd: marker.pageNumber,
        content: text.slice(contentStart, contentEnd).trim(),
      };
    })
    .filter((page) => page.content);
}

function inferSectionTitle(content: string) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const title = lines.find((line) => {
    if (line.length > 120) {
      return false;
    }

    return (
      /^(chapitre|partie|section|exercice|activit[eé]|r[eé]sum[eé]|m[eé]thode)\b/i.test(line) ||
      /^[IVX]+\.\s+\S/.test(line) ||
      /^\d+(?:[.)]|\s+-)\s+\S/.test(line)
    );
  });

  return title ?? null;
}

function buildResourceChunks(resource: SubjectResourceRecord) {
  const text = normalizeText(resource.raw_extracted_text ?? "");
  if (!text) {
    return [];
  }

  const explicitPages = splitByPageMarkers(text);
  const pageCount =
    typeof resource.page_count === "number" && resource.page_count > 1
      ? resource.page_count
      : null;
  const pageSegments =
    explicitPages ??
    (pageCount ? splitEvenlyByPageEstimate(text, pageCount) : [
      {
        pageStart: null,
        pageEnd: null,
        content: text,
      },
    ]);
  const chunkingStrategy = explicitPages
    ? "explicit_page_markers"
    : pageCount
      ? "estimated_page_split"
      : "single_document_split";
  const resourceMetadata = normalizeMetadata(resource.metadata);
  const extractionConfidence = metadataNumber(resourceMetadata, "ocr_confidence");
  const chunks: Array<Omit<SubjectResourceChunkRecord, "id" | "created_at" | "updated_at">> = [];

  for (const page of pageSegments) {
    const parts = splitNearBoundary(page.content, MAX_CHUNK_CHARS);

    for (const [partIndex, part] of parts.entries()) {
      const chunkIndex = chunks.length;
      const pageStart = page.pageStart;
      const pageEnd = page.pageEnd;

      chunks.push({
        resource_id: resource.id,
        student_user_id: resource.student_user_id,
        subject_tag: resource.subject_tag,
        chunk_index: chunkIndex,
        stable_chunk_id: makeStableChunkId({
          pageStart,
          pageEnd,
          chunkIndex,
        }),
        page_start: pageStart,
        page_end: pageEnd,
        section_title: inferSectionTitle(part),
        content: part,
        char_count: part.length,
        token_estimate: estimateTokens(part),
        extraction_confidence: extractionConfidence,
        metadata: {
          chunker_version: CHUNKER_VERSION,
          chunking_strategy: chunkingStrategy,
          overlap_chars: partIndex === 0 ? 0 : CHUNK_OVERLAP_CHARS,
        },
      });
    }
  }

  return chunks;
}

async function replaceSubjectResourceChunks(input: {
  supabase: SupabaseClient;
  resource: SubjectResourceRecord;
}) {
  const chunks = buildResourceChunks(input.resource);

  const { error: deleteError } = await input.supabase
    .from("subject_resource_chunks")
    .delete()
    .eq("resource_id", input.resource.id);

  if (deleteError) {
    throw deleteError;
  }

  if (!chunks.length) {
    return [];
  }

  const { data, error } = await input.supabase
    .from("subject_resource_chunks")
    .insert(chunks)
    .select(SUBJECT_RESOURCE_CHUNK_SELECT);

  if (error) {
    throw error;
  }

  return (data as SubjectResourceChunkRecord[] | null) ?? [];
}

export async function ensureSubjectResourceChunks(input: {
  supabase: SupabaseClient;
  resource: SubjectResourceRecord;
}) {
  const { count, error } = await input.supabase
    .from("subject_resource_chunks")
    .select("id", { count: "exact", head: true })
    .eq("resource_id", input.resource.id);

  if (error) {
    throw error;
  }

  if ((count ?? 0) > 0) {
    const { data, error: selectError } = await input.supabase
      .from("subject_resource_chunks")
      .select(SUBJECT_RESOURCE_CHUNK_SELECT)
      .eq("resource_id", input.resource.id)
      .order("chunk_index", { ascending: true });

    if (selectError) {
      throw selectError;
    }

    return (data as SubjectResourceChunkRecord[] | null) ?? [];
  }

  return replaceSubjectResourceChunks(input);
}

export async function parseCreateSubjectResourceTargetRequest(
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
  const subjectTag = typeof payload.subjectTag === "string" ? payload.subjectTag : "";
  const originalFilename =
    typeof payload.originalFilename === "string" ? payload.originalFilename : "";
  const mimeType = typeof payload.mimeType === "string" ? payload.mimeType : "";
  const byteSize =
    typeof payload.byteSize === "number" ? payload.byteSize : Number.NaN;

  if (!normalizeSubjectTag(subjectTag) || subjectTag.length > MAX_SUBJECT_TAG_LENGTH) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        subjectTag: "Subject is required.",
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
    subjectTag: subjectTag.trim(),
    originalFilename: originalFilename.trim(),
    mimeType: mimeType.trim(),
    byteSize,
  };
}

export async function parseConfirmSubjectResourceRequest(
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
  const resourceId =
    typeof payload.resourceId === "string" ? payload.resourceId.trim() : "";
  const conversationId =
    typeof payload.conversationId === "string" ? payload.conversationId.trim() : null;
  const selected = payload.selected === false ? false : true;

  if (!resourceId) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        resourceId: "Resource id is required.",
      },
    });
  }

  return {
    resourceId,
    conversationId,
    selected,
  };
}

export async function parseSubjectResourceSelectionRequest(
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
    typeof payload.conversationId === "string" ? payload.conversationId.trim() : "";
  const resourceId =
    typeof payload.resourceId === "string" ? payload.resourceId.trim() : "";
  const selected = payload.selected === true;

  if (!conversationId || !resourceId) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        resourceId: "Conversation and resource ids are required.",
      },
    });
  }

  return {
    conversationId,
    resourceId,
    selected,
  };
}

async function ensureSubjectResourceBucket() {
  const supabase = createSupabaseAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw toServiceError("Unable to list storage buckets.", listError);
  }

  const exists = (buckets ?? []).some(
    (bucket) => bucket.name === HOMEWORK_ATTACHMENTS_BUCKET,
  );

  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(
      HOMEWORK_ATTACHMENTS_BUCKET,
      {
        public: false,
        allowedMimeTypes: SUBJECT_RESOURCE_BUCKET_ALLOWED_MIME_TYPES,
      },
    );

    if (createError) {
      throw toServiceError("Unable to create the subject resource bucket.", createError);
    }

    return;
  }

  await supabase.storage
    .updateBucket(HOMEWORK_ATTACHMENTS_BUCKET, {
      public: false,
      allowedMimeTypes: SUBJECT_RESOURCE_BUCKET_ALLOWED_MIME_TYPES,
    })
    .catch(() => null);
}

async function requireStudentAppUser(context: AuthenticatedUserContext) {
  const appUser = requireAppUserContext(context);
  requireAppUserRole(appUser, ["student"]);
  requireActiveAppUser(appUser);
  return appUser;
}

async function loadOwnedConversation(input: {
  conversationId: string;
  studentUserId: string;
  subjectTag?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const { data: conversation, error } = await admin
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", input.conversationId)
    .maybeSingle<ConversationRecord>();

  if (error) {
    throw toServiceError("Unable to load the conversation.", error);
  }

  if (!conversation || conversation.student_user_id !== input.studentUserId) {
    throw new AppError({
      code: "not_found",
      message: "Conversation not found.",
      status: 404,
    });
  }

  if (input.subjectTag && conversation.subject_tag !== input.subjectTag) {
    throw new AppError({
      code: "validation_error",
      message: "This resource belongs to another subject.",
      status: 400,
    });
  }

  return conversation;
}

async function findSubjectResourceByHash(input: {
  supabase: SupabaseClient;
  studentUserId: string;
  subjectTag: string;
  sha256: string;
}) {
  const { data, error } = await input.supabase
    .from("subject_resources")
    .select(SUBJECT_RESOURCE_SELECT)
    .eq("student_user_id", input.studentUserId)
    .eq("subject_tag", input.subjectTag)
    .eq("sha256", input.sha256)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SubjectResourceRecord | null) ?? null;
}

async function maybeLinkResourceToConversation(input: {
  supabase: SupabaseClient;
  conversationId: string | null;
  resource: SubjectResourceRecord;
  createdByUserId: string;
  selected: boolean;
}) {
  if (!input.conversationId) {
    return null;
  }

  await loadOwnedConversation({
    conversationId: input.conversationId,
    studentUserId: input.resource.student_user_id,
    subjectTag: input.resource.subject_tag,
  });

  const { data, error } = await input.supabase
    .from("conversation_resource_links")
    .upsert(
      {
        conversation_id: input.conversationId,
        resource_id: input.resource.id,
        created_by_user_id: input.createdByUserId,
        selected: input.selected,
      },
      { onConflict: "conversation_id,resource_id" },
    )
    .select(CONVERSATION_RESOURCE_LINK_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as ConversationResourceLinkRecord;
}

function buildSubjectResourceWarningMessage(
  resource: SubjectResourceRecord,
  languageCode: UiLanguageCode,
) {
  const metadata = normalizeMetadata(resource.metadata);

  if (resource.extraction_status === "failed") {
    return getStudentUploadServerCopy(languageCode).warnings.extractionFailed;
  }

  if (
    metadata.needs_manual_review === true ||
    (typeof metadata.ocr_confidence === "number" && metadata.ocr_confidence < 0.55)
  ) {
    return getStudentUploadServerCopy(languageCode).warnings.extractionPartial;
  }

  return null;
}

export async function listSubjectResourceLibrary(input: {
  context: AuthenticatedUserContext;
  subjectTag: string;
  conversationId?: string | null;
}): Promise<SubjectResourceLibraryItem[]> {
  const appUser = await requireStudentAppUser(input.context);

  return listSubjectResourceLibraryForStudent({
    studentUserId: appUser.id,
    subjectTag: input.subjectTag,
    conversationId: input.conversationId,
  });
}

export async function listSubjectResourceLibraryForStudent(input: {
  studentUserId: string;
  subjectTag: string;
  conversationId?: string | null;
}): Promise<SubjectResourceLibraryItem[]> {
  const subjectTag = normalizeSubjectTag(input.subjectTag);

  if (!subjectTag) {
    return [];
  }

  if (input.conversationId) {
    await loadOwnedConversation({
      conversationId: input.conversationId,
      studentUserId: input.studentUserId,
      subjectTag,
    });
  }

  const supabase = await createSupabaseServerClient();
  const { data: resources, error: resourcesError } = await supabase
    .from("subject_resources")
    .select(SUBJECT_RESOURCE_SELECT)
    .eq("student_user_id", input.studentUserId)
    .eq("subject_tag", subjectTag)
    .order("updated_at", { ascending: false });

  if (resourcesError) {
    throw toServiceError("Unable to list subject resources.", resourcesError);
  }

  const subjectResources = (resources ?? []) as SubjectResourceRecord[];
  const resourceIds = subjectResources.map((resource) => resource.id);
  const [linksResult, chunksResult] =
    input.conversationId && resourceIds.length > 0
      ? await Promise.all([
          supabase
            .from("conversation_resource_links")
            .select(CONVERSATION_RESOURCE_LINK_SELECT)
            .eq("conversation_id", input.conversationId)
            .in("resource_id", resourceIds),
          supabase
            .from("subject_resource_chunks")
            .select("resource_id")
            .in("resource_id", resourceIds),
        ])
      : resourceIds.length > 0
        ? [
            { data: [], error: null },
            await supabase
              .from("subject_resource_chunks")
              .select("resource_id")
              .in("resource_id", resourceIds),
          ]
        : [
            { data: [], error: null },
            { data: [], error: null },
          ];

  if (linksResult.error) {
    throw toServiceError("Unable to list conversation resource links.", linksResult.error);
  }

  if (chunksResult.error) {
    throw toServiceError("Unable to count subject resource chunks.", chunksResult.error);
  }

  const linksByResourceId = new Map(
    ((linksResult.data ?? []) as ConversationResourceLinkRecord[]).map((link) => [
      link.resource_id,
      link,
    ]),
  );
  const chunkCounts = ((chunksResult.data ?? []) as Array<{ resource_id: string }>).reduce(
    (acc, chunk) => acc.set(chunk.resource_id, (acc.get(chunk.resource_id) ?? 0) + 1),
    new Map<string, number>(),
  );

  return subjectResources.map((resource) => {
    const link = linksByResourceId.get(resource.id) ?? null;
    return {
      ...resource,
      selected: link?.selected ?? false,
      link,
      chunk_count: chunkCounts.get(resource.id) ?? 0,
    };
  });
}

export async function createSubjectResourceUploadTarget(input: {
  context: AuthenticatedUserContext;
  requestId: string;
  route: string;
  subjectTag: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
}) {
  const appUser = await requireStudentAppUser(input.context);
  const copy = getStudentUploadServerCopy(appUser.preferred_ui_language);
  const subjectTag = normalizeSubjectTag(input.subjectTag);

  if (!subjectTag || subjectTag.length > MAX_SUBJECT_TAG_LENGTH) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        subjectTag: "Subject is required.",
      },
    });
  }

  await assertStudentUsageActionAllowed({
    studentUserId: appUser.id,
    action: "create_upload",
    languageCode: appUser.preferred_ui_language,
  });

  const resolvedInput = resolveSubjectResourcePolicyInput({
    mimeType: input.mimeType,
    originalFilename: input.originalFilename,
  });

  if (!resolvedInput) {
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

  if (input.byteSize > resolvedInput.policy.maxBytes) {
    throw new AppError({
      code: "validation_error",
      message: copy.requestErrors.invalidFields,
      status: 400,
      fieldErrors: {
        byteSize: copy.validation.fileTooLarge(
          Math.round(resolvedInput.policy.maxBytes / (1024 * 1024)),
        ),
      },
    });
  }

  await ensureSubjectResourceBucket();

  const admin = createSupabaseAdminClient();
  const resourceId = crypto.randomUUID();
  const storagePath = buildStoragePath({
    studentUserId: appUser.id,
    subjectTag,
    resourceId,
    mimeType: resolvedInput.resolvedMimeType,
  });
  const { data: resource, error: insertError } = await admin
    .from("subject_resources")
    .insert({
      id: resourceId,
      student_user_id: appUser.id,
      created_by_user_id: appUser.id,
      subject_tag: subjectTag,
      source_storage_bucket: HOMEWORK_ATTACHMENTS_BUCKET,
      source_storage_path: storagePath,
      attachment_kind: resolvedInput.policy.attachmentKind,
      mime_type: resolvedInput.resolvedMimeType,
      original_filename: input.originalFilename.trim(),
      byte_size: input.byteSize,
      extraction_status: "pending",
      sha256: `pending:${resourceId}`,
      metadata: {
        client_extension: input.originalFilename.includes(".")
          ? input.originalFilename.split(".").pop()?.toLowerCase() ?? ""
          : "",
        upload_context: "subject_resource",
      },
    })
    .select(SUBJECT_RESOURCE_SELECT)
    .single();

  if (insertError) {
    throw toServiceError("Unable to create the subject resource shell.", insertError);
  }

  const { data: signedUpload, error: signedUploadError } = await admin.storage
    .from(HOMEWORK_ATTACHMENTS_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (signedUploadError || !signedUpload?.token) {
    throw toServiceError(
      "Unable to create the signed subject resource upload target.",
      signedUploadError,
    );
  }

  await recordStudentUsageDeltaBestEffort({
    studentUserId: appUser.id,
    delta: {
      uploads: 1,
    },
  });

  logRuntimeInfo({
    message: "Created subject resource upload target",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: appUser.id,
    actorRole: "student",
    targetStudentUserId: appUser.id,
    details: {
      subjectResourceId: resourceId,
      subjectTag,
      mimeType: resolvedInput.resolvedMimeType,
    },
  });

  return {
    resource: resource as SubjectResourceRecord,
    uploadTarget: {
      bucket: HOMEWORK_ATTACHMENTS_BUCKET,
      path: storagePath,
      token: signedUpload.token,
    },
  };
}

export async function confirmSubjectResourceUpload(input: {
  context: AuthenticatedUserContext;
  requestId: string;
  route: string;
  resourceId: string;
  conversationId: string | null;
  selected: boolean;
}) {
  const appUser = await requireStudentAppUser(input.context);
  const admin = createSupabaseAdminClient();
  const { data: resourceRow, error: resourceError } = await admin
    .from("subject_resources")
    .select(SUBJECT_RESOURCE_SELECT)
    .eq("id", input.resourceId)
    .maybeSingle();

  if (resourceError) {
    throw toServiceError("Unable to load the subject resource.", resourceError);
  }

  const pendingResource = resourceRow as SubjectResourceRecord | null;

  if (!pendingResource || pendingResource.student_user_id !== appUser.id) {
    throw new AppError({
      code: "not_found",
      message: "Subject resource not found.",
      status: 404,
    });
  }

  if (pendingResource.extraction_status === "ready") {
    const link = await maybeLinkResourceToConversation({
      supabase: admin,
      conversationId: input.conversationId,
      resource: pendingResource,
      createdByUserId: appUser.id,
      selected: input.selected,
    });
    const chunks = await ensureSubjectResourceChunks({
      supabase: admin,
      resource: pendingResource,
    });

    return {
      resource: pendingResource,
      link,
      chunkCount: chunks.length,
      warningMessage: buildSubjectResourceWarningMessage(
        pendingResource,
        appUser.preferred_ui_language,
      ),
    };
  }

  if (!pendingResource.source_storage_bucket || !pendingResource.source_storage_path) {
    throw new AppError({
      code: "validation_error",
      message: "Subject resource storage metadata is missing.",
      status: 400,
    });
  }

  const { data: objectInfo, error: infoError } = await admin.storage
    .from(pendingResource.source_storage_bucket)
    .info(pendingResource.source_storage_path);

  if (infoError || !objectInfo) {
    throw toServiceError("Uploaded subject resource is not available yet.", infoError);
  }

  const objectSize =
    typeof objectInfo.size === "number"
      ? objectInfo.size
      : Number(objectInfo.size ?? 0);

  if (!objectSize || objectSize !== pendingResource.byte_size) {
    throw new AppError({
      code: "conflict",
      message: getStudentUploadServerCopy(appUser.preferred_ui_language).access
        .attachmentSizeMismatch,
      status: 409,
    });
  }

  const { data: fileBlob, error: downloadError } = await admin.storage
    .from(pendingResource.source_storage_bucket)
    .download(pendingResource.source_storage_path);

  if (downloadError || !fileBlob) {
    throw toServiceError("Unable to read the uploaded subject resource.", downloadError);
  }

  const sha256 = await sha256Hex(fileBlob);
  const existingResource = await findSubjectResourceByHash({
    supabase: admin,
    studentUserId: appUser.id,
    subjectTag: pendingResource.subject_tag,
    sha256,
  });

  if (existingResource && existingResource.id !== pendingResource.id) {
    await admin.storage
      .from(pendingResource.source_storage_bucket)
      .remove([pendingResource.source_storage_path])
      .catch(() => null);
    const { error: deletePendingError } = await admin
      .from("subject_resources")
      .delete()
      .eq("id", pendingResource.id);

    if (deletePendingError) {
      logRuntimeInfo({
        message: "Unable to delete duplicate pending subject resource",
        requestId: input.requestId,
        route: input.route,
        method: "POST",
        actorUserId: appUser.id,
        actorRole: "student",
        targetStudentUserId: appUser.id,
        details: {
          subjectResourceId: pendingResource.id,
          duplicateSubjectResourceId: existingResource.id,
          reason: deletePendingError.message,
        },
      });
    }

    const link = await maybeLinkResourceToConversation({
      supabase: admin,
      conversationId: input.conversationId,
      resource: existingResource,
      createdByUserId: appUser.id,
      selected: input.selected,
    });
    const chunks =
      existingResource.extraction_status === "ready"
        ? await ensureSubjectResourceChunks({
            supabase: admin,
            resource: existingResource,
          })
        : [];

    return {
      resource: existingResource,
      link,
      chunkCount: chunks.length,
      warningMessage: buildSubjectResourceWarningMessage(
        existingResource,
        appUser.preferred_ui_language,
      ),
    };
  }

  const policy = SUBJECT_RESOURCE_POLICY_BY_MIME[
    pendingResource.mime_type as SubjectResourceMimeType
  ];
  const baseMetadata = normalizeMetadata(pendingResource.metadata);
  let extractedText: string | null = null;
  let sourceLanguage: UiLanguageCode | null = appUser.ai_help_language;
  let pageCount: number | null = null;
  let extractionMetadata: Record<string, unknown> = {};

  if (policy?.extractionPath === "direct_text") {
    extractedText = normalizeText(await fileBlob.text());
    extractionMetadata = {
      extraction_engine: "direct_text",
      extraction_version: "direct-text-v1",
      ocr_confidence: 1,
      detected_language: sourceLanguage,
      needs_manual_review: false,
      source_summary: buildDirectTextSummary(extractedText),
      source_outline: buildDirectTextOutline(extractedText),
    };
  } else {
    const aiProvider = getAiProvider();

    try {
      const extraction = await aiProvider.extractAttachmentText({
        attachmentId: pendingResource.id,
        originalFilename: pendingResource.original_filename,
        mimeType: pendingResource.mime_type,
        byteSize: pendingResource.byte_size,
        fileBlob,
        requestContext: {
          requestId: input.requestId,
          route: input.route,
          actorUserId: appUser.id,
          actorRole: "student",
          conversationId: input.conversationId ?? undefined,
          attachmentId: pendingResource.id,
          studentUserId: appUser.id,
        },
      });

      extractedText = normalizeText(extraction.extractedText ?? "");
      sourceLanguage = extraction.detectedLanguage;
      pageCount = extraction.pageCountEstimate;
      extractionMetadata = {
        extraction_engine: "gemini_file_understanding",
        extraction_version: extraction.promptVersion,
        ocr_confidence: extraction.confidenceScore,
        detected_language: extraction.detectedLanguage,
        needs_manual_review: extraction.needsManualReview,
        source_summary: extraction.sourceSummary?.trim() || null,
        source_outline: extraction.sourceOutline?.trim() || null,
      };

      await recordStudentAiUsageBestEffort({
        studentUserId: appUser.id,
        usage: extraction.usage,
      });
    } catch (error) {
      const { data: failedResource, error: updateError } = await admin
        .from("subject_resources")
        .update({
          extraction_status: "failed",
          raw_extracted_text: null,
          sha256,
          metadata: {
            ...baseMetadata,
            sha256,
            extraction_engine: "gemini_file_understanding",
            extraction_error: "provider_failure",
            needs_manual_review: true,
          },
        })
        .eq("id", pendingResource.id)
        .select(SUBJECT_RESOURCE_SELECT)
        .single();

      if (updateError) {
        throw toServiceError("Unable to persist subject resource extraction failure.", updateError);
      }

      const failed = failedResource as SubjectResourceRecord;
      const link = await maybeLinkResourceToConversation({
        supabase: admin,
        conversationId: input.conversationId,
        resource: failed,
        createdByUserId: appUser.id,
        selected: false,
      });

      logRuntimeInfo({
        message: "Subject resource provider extraction failed",
        requestId: input.requestId,
        route: input.route,
        method: "POST",
        actorUserId: appUser.id,
        actorRole: "student",
        targetStudentUserId: appUser.id,
        details: {
          subjectResourceId: failed.id,
          subjectTag: failed.subject_tag,
          reason: error instanceof Error ? error.message : "provider_failure",
        },
      });

      return {
        resource: failed,
        link,
        chunkCount: 0,
        warningMessage: buildSubjectResourceWarningMessage(
          failed,
          appUser.preferred_ui_language,
        ),
      };
    }
  }

  const moderation = moderateExtraction(extractedText ?? "");
  await recordModerationEvent({
    source: "attachment_extraction",
    result: moderation,
    actorUserId: appUser.id,
    actorRole: "student",
    conversationId: input.conversationId,
    attachmentId: pendingResource.id,
    requestContext: {
      requestId: input.requestId,
      route: input.route,
      actorUserId: appUser.id,
      actorRole: "student",
      conversationId: input.conversationId ?? undefined,
      attachmentId: pendingResource.id,
      studentUserId: appUser.id,
    },
    textPreview: extractedText?.slice(0, 200) ?? null,
  });

  const shouldFailExtraction = !extractedText || moderation.status === "blocked";
  const { data: updatedResource, error: updateError } = await admin
    .from("subject_resources")
    .update({
      extraction_status: shouldFailExtraction ? "failed" : "ready",
      raw_extracted_text: shouldFailExtraction ? null : extractedText,
      source_language: sourceLanguage,
      page_count: pageCount,
      sha256,
      metadata: {
        ...baseMetadata,
        sha256,
        ...extractionMetadata,
        needs_manual_review:
          shouldFailExtraction || extractionMetadata.needs_manual_review === true,
      },
    })
    .eq("id", pendingResource.id)
    .select(SUBJECT_RESOURCE_SELECT)
    .single();

  if (updateError) {
    throw toServiceError("Unable to persist subject resource extraction.", updateError);
  }

  const resource = updatedResource as SubjectResourceRecord;
  const link = await maybeLinkResourceToConversation({
    supabase: admin,
    conversationId: input.conversationId,
    resource,
    createdByUserId: appUser.id,
    selected: input.selected && resource.extraction_status === "ready",
  });
  const chunks =
    resource.extraction_status === "ready"
      ? await replaceSubjectResourceChunks({
          supabase: admin,
          resource,
        })
      : [];

  logRuntimeInfo({
    message: "Confirmed subject resource upload",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: appUser.id,
    actorRole: "student",
    targetStudentUserId: appUser.id,
    details: {
      subjectResourceId: resource.id,
      subjectTag: resource.subject_tag,
      extractionStatus: resource.extraction_status,
      chunkCount: chunks.length,
      linkedConversationId: input.conversationId,
    },
  });

  return {
    resource,
    link,
    chunkCount: chunks.length,
    warningMessage: buildSubjectResourceWarningMessage(
      resource,
      appUser.preferred_ui_language,
    ),
  };
}

export async function setSubjectResourceConversationSelection(input: {
  context: AuthenticatedUserContext;
  requestId: string;
  route: string;
  conversationId: string;
  resourceId: string;
  selected: boolean;
}) {
  const appUser = await requireStudentAppUser(input.context);
  const admin = createSupabaseAdminClient();
  const { data: resource, error: resourceError } = await admin
    .from("subject_resources")
    .select(SUBJECT_RESOURCE_SELECT)
    .eq("id", input.resourceId)
    .maybeSingle();

  if (resourceError) {
    throw toServiceError("Unable to load subject resource for selection.", resourceError);
  }

  const subjectResource = resource as SubjectResourceRecord | null;

  if (!subjectResource || subjectResource.student_user_id !== appUser.id) {
    throw new AppError({
      code: "not_found",
      message: "Subject resource not found.",
      status: 404,
    });
  }

  await loadOwnedConversation({
    conversationId: input.conversationId,
    studentUserId: appUser.id,
    subjectTag: subjectResource.subject_tag,
  });

  const link = await maybeLinkResourceToConversation({
    supabase: admin,
    conversationId: input.conversationId,
    resource: subjectResource,
    createdByUserId: appUser.id,
    selected: input.selected && subjectResource.extraction_status === "ready",
  });

  logRuntimeInfo({
    message: "Updated subject resource selection",
    requestId: input.requestId,
    route: input.route,
    method: "PATCH",
    actorUserId: appUser.id,
    actorRole: "student",
    targetStudentUserId: appUser.id,
    details: {
      conversationId: input.conversationId,
      subjectResourceId: input.resourceId,
      selected: link?.selected ?? false,
    },
  });

  return {
    resource: subjectResource,
    link,
  };
}

const LEXICAL_STOPWORDS = new Set([
  "a",
  "ai",
  "au",
  "aux",
  "avec",
  "ce",
  "ces",
  "cette",
  "dans",
  "de",
  "des",
  "du",
  "elle",
  "en",
  "est",
  "et",
  "faire",
  "je",
  "la",
  "le",
  "les",
  "me",
  "mon",
  "ma",
  "mes",
  "nous",
  "on",
  "ou",
  "pour",
  "que",
  "qui",
  "sur",
  "tu",
  "un",
  "une",
  "the",
  "and",
  "for",
  "with",
  "what",
  "why",
  "how",
  "can",
  "you",
]);

function tokenizeForLexicalSearch(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  const tokens = normalized.match(/[\p{L}\p{N}]{3,}/gu) ?? [];

  return Array.from(
    new Set(tokens.filter((token) => !LEXICAL_STOPWORDS.has(token))),
  ).slice(0, 24);
}

function countOccurrences(haystack: string, needle: string) {
  let count = 0;
  let index = haystack.indexOf(needle);

  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }

  return count;
}

function scoreChunk(input: {
  chunk: SubjectResourceChunkRecord;
  resource: SubjectResourceRecord;
  tokens: string[];
  normalizedQuery: string;
}) {
  const chunkText = `${input.chunk.section_title ?? ""}\n${input.chunk.content}`
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  const filenameText = input.resource.original_filename
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  let score = 0;

  for (const token of input.tokens) {
    const contentHits = countOccurrences(chunkText, token);
    const filenameHits = countOccurrences(filenameText, token);
    score += contentHits * 3 + filenameHits;

    if (input.chunk.section_title?.toLowerCase().includes(token)) {
      score += 2;
    }
  }

  if (
    input.normalizedQuery.length >= 24 &&
    chunkText.includes(input.normalizedQuery.slice(0, 80))
  ) {
    score += 8;
  }

  const metadata = normalizeMetadata(input.chunk.metadata);
  if (metadataBoolean(metadata, "manual_pin")) {
    score += 3;
  }

  return score;
}

function formatPageRange(chunk: SubjectResourceChunkRecord) {
  if (chunk.page_start && chunk.page_end && chunk.page_start !== chunk.page_end) {
    return `pages ${chunk.page_start}-${chunk.page_end}`;
  }

  if (chunk.page_start) {
    return `page ${chunk.page_start}`;
  }

  return "page inconnue";
}

function formatRetrievedChunks(chunks: SubjectResourceRetrievalChunk[]) {
  if (chunks.length === 0) {
    return null;
  }

  return chunks
    .map((chunk, index) => {
      const excerpt =
        truncateForAiContext(
          chunk.content,
          AI_CONTEXT_LIMITS.subjectResourceChunkChars,
        ) ?? "";
      const section = chunk.section_title ? ` | ${chunk.section_title}` : "";
      const summary = chunk.resource_summary
        ? `\n  Résumé ressource: ${chunk.resource_summary}`
        : "";

      return [
        `[R${index + 1}] ${chunk.resource_filename} | ${formatPageRange(chunk)}${section}`,
        summary,
        `  Extrait: ${excerpt}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

export async function retrieveSubjectResourceContextForCoach(input: {
  supabase: SupabaseClient;
  conversationId: string;
  queryText: string;
}): Promise<SubjectResourceRetrievalResult> {
  const { data: links, error: linksError } = await input.supabase
    .from("conversation_resource_links")
    .select("resource_id")
    .eq("conversation_id", input.conversationId)
    .eq("selected", true);

  if (linksError) {
    throw linksError;
  }

  const resourceIds = Array.from(
    new Set(
      ((links ?? []) as Array<{ resource_id: string | null }>)
        .map((link) => link.resource_id)
        .filter((resourceId): resourceId is string => Boolean(resourceId)),
    ),
  );

  if (resourceIds.length === 0) {
    return {
      contextText: null,
      chunks: [],
      selectedResourceCount: 0,
    };
  }

  const [resourcesResult, chunksResult] = await Promise.all([
    input.supabase
      .from("subject_resources")
      .select(SUBJECT_RESOURCE_SELECT)
      .in("id", resourceIds),
    input.supabase
      .from("subject_resource_chunks")
      .select(SUBJECT_RESOURCE_CHUNK_SELECT)
      .in("resource_id", resourceIds)
      .order("chunk_index", { ascending: true }),
  ]);

  if (resourcesResult.error) {
    throw resourcesResult.error;
  }

  if (chunksResult.error) {
    throw chunksResult.error;
  }

  const resources = ((resourcesResult.data ?? []) as SubjectResourceRecord[]).reduce(
    (acc, resource) => acc.set(resource.id, resource),
    new Map<string, SubjectResourceRecord>(),
  );
  const existingChunks = (chunksResult.data ?? []) as SubjectResourceChunkRecord[];
  const resourceIdsWithChunks = new Set(
    existingChunks.map((chunk) => chunk.resource_id),
  );
  const resourcesMissingChunks = Array.from(resources.values()).filter(
    (resource) =>
      resource.extraction_status === "ready" &&
      resource.raw_extracted_text &&
      !resourceIdsWithChunks.has(resource.id),
  );
  const backfilledChunks =
    resourcesMissingChunks.length > 0
      ? (
          await Promise.all(
            resourcesMissingChunks.map((resource) =>
              ensureSubjectResourceChunks({
                supabase: input.supabase,
                resource,
              }),
            ),
          )
        ).flat()
      : [];
  const chunks = [...existingChunks, ...backfilledChunks];
  const tokens = tokenizeForLexicalSearch(input.queryText);
  const normalizedQuery = input.queryText
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
  const scoredChunks = chunks
    .map((chunk) => {
      const resource = resources.get(chunk.resource_id);

      if (!resource) {
        return null;
      }

      return {
        ...chunk,
        resource_filename: resource.original_filename,
        resource_summary: metadataString(
          normalizeMetadata(resource.metadata),
          "source_summary",
        ),
        score: scoreChunk({
          chunk,
          resource,
          tokens,
          normalizedQuery,
        }),
      } satisfies SubjectResourceRetrievalChunk;
    })
    .filter((chunk): chunk is SubjectResourceRetrievalChunk => Boolean(chunk))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (a.resource_id !== b.resource_id) {
        return a.resource_id.localeCompare(b.resource_id);
      }

      return a.chunk_index - b.chunk_index;
    });
  const selectedChunks =
    scoredChunks.some((chunk) => chunk.score > 0)
      ? scoredChunks
      : scoredChunks.slice().sort((a, b) => a.chunk_index - b.chunk_index);
  const topChunks = selectedChunks.slice(
    0,
    AI_CONTEXT_LIMITS.subjectResourceChunkCount,
  );

  return {
    contextText: formatRetrievedChunks(topChunks),
    chunks: topChunks,
    selectedResourceCount: resourceIds.length,
  };
}

async function upsertConversationResourceLink(input: {
  supabase: SupabaseClient;
  conversationId: string;
  resourceId: string;
  createdByUserId: string;
}) {
  const { data, error } = await input.supabase
    .from("conversation_resource_links")
    .upsert(
      {
        conversation_id: input.conversationId,
        resource_id: input.resourceId,
        created_by_user_id: input.createdByUserId,
        selected: true,
      },
      { onConflict: "conversation_id,resource_id" },
    )
    .select(CONVERSATION_RESOURCE_LINK_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data as ConversationResourceLinkRecord;
}

export async function findReadySubjectResourceByHash(input: {
  supabase: SupabaseClient;
  studentUserId: string;
  subjectTag: string;
  sha256: string;
}) {
  const { data, error } = await input.supabase
    .from("subject_resources")
    .select(SUBJECT_RESOURCE_SELECT)
    .eq("student_user_id", input.studentUserId)
    .eq("subject_tag", input.subjectTag)
    .eq("sha256", input.sha256)
    .eq("extraction_status", "ready")
    .not("raw_extracted_text", "is", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SubjectResourceRecord | null) ?? null;
}

export async function linkSubjectResourceToConversation(input: {
  supabase: SupabaseClient;
  conversationId: string;
  resourceId: string;
  createdByUserId: string;
}) {
  return upsertConversationResourceLink(input);
}

export async function upsertSubjectResourceFromReadyAttachment(input: {
  supabase: SupabaseClient;
  conversation: Pick<ConversationRecord, "id" | "student_user_id" | "subject_tag">;
  attachment: ConversationAttachmentRecord;
  sha256: string;
  createdByUserId: string;
}): Promise<SubjectResourceReuseResult | null> {
  if (
    input.attachment.attachment_kind !== "pdf" ||
    input.attachment.extraction_status !== "ready" ||
    !input.attachment.raw_extracted_text
  ) {
    return null;
  }

  const attachmentMetadata = normalizeMetadata(input.attachment.metadata);
  const { data: resource, error } = await input.supabase
    .from("subject_resources")
    .upsert(
      {
        student_user_id: input.conversation.student_user_id,
        created_by_user_id: input.createdByUserId,
        subject_tag: input.conversation.subject_tag,
        source_attachment_id: input.attachment.id,
        source_conversation_id: input.conversation.id,
        source_storage_bucket: input.attachment.storage_bucket,
        source_storage_path: input.attachment.storage_path,
        attachment_kind: input.attachment.attachment_kind,
        mime_type: input.attachment.mime_type,
        original_filename: input.attachment.original_filename,
        byte_size: input.attachment.byte_size,
        page_count: input.attachment.page_count,
        extraction_status: "ready",
        raw_extracted_text: input.attachment.raw_extracted_text,
        source_language: input.attachment.source_language,
        sha256: input.sha256,
        metadata: {
          ...attachmentMetadata,
          source_attachment_id: input.attachment.id,
          source_conversation_id: input.conversation.id,
        },
      },
      { onConflict: "student_user_id,subject_tag,sha256" },
    )
    .select(SUBJECT_RESOURCE_SELECT)
    .single();

  if (error) {
    throw error;
  }

  const link = await upsertConversationResourceLink({
    supabase: input.supabase,
    conversationId: input.conversation.id,
    resourceId: (resource as SubjectResourceRecord).id,
    createdByUserId: input.createdByUserId,
  });
  const chunks = await replaceSubjectResourceChunks({
    supabase: input.supabase,
    resource: resource as SubjectResourceRecord,
  });

  return {
    resource: resource as SubjectResourceRecord,
    link,
    chunks,
  };
}

export function buildAttachmentUpdateFromSubjectResource(input: {
  attachment: ConversationAttachmentRecord;
  resource: SubjectResourceRecord;
}) {
  const attachmentMetadata = normalizeMetadata(input.attachment.metadata);
  const resourceMetadata = normalizeMetadata(input.resource.metadata);

  return {
    extraction_status: "ready" as const,
    raw_extracted_text: input.resource.raw_extracted_text,
    source_language: input.resource.source_language,
    page_count: input.resource.page_count,
    metadata: {
      ...attachmentMetadata,
      sha256: input.resource.sha256,
      extraction_engine: "subject_resource_reuse",
      extraction_version: metadataString(resourceMetadata, "extraction_version"),
      ocr_confidence: metadataNumber(resourceMetadata, "ocr_confidence"),
      detected_language:
        metadataString(resourceMetadata, "detected_language") ??
        input.resource.source_language,
      needs_manual_review: resourceMetadata.needs_manual_review === true,
      source_summary: metadataString(resourceMetadata, "source_summary"),
      source_outline: metadataString(resourceMetadata, "source_outline"),
      subject_resource_id: input.resource.id,
      subject_resource_reused: true,
    },
  };
}
