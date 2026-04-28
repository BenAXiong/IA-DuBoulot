import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import type { ConversationRecord } from "@/lib/server/conversations/types";
import type {
  ConversationResourceLinkRecord,
  SubjectResourceChunkRecord,
  SubjectResourceRecord,
  SubjectResourceReuseResult,
} from "@/lib/server/subject-resources/types";

const SUBJECT_RESOURCE_SELECT =
  "id, student_user_id, created_by_user_id, subject_tag, source_attachment_id, source_conversation_id, source_storage_bucket, source_storage_path, attachment_kind, mime_type, original_filename, byte_size, page_count, extraction_status, raw_extracted_text, source_language, sha256, metadata, created_at, updated_at";
const CONVERSATION_RESOURCE_LINK_SELECT =
  "id, conversation_id, resource_id, created_by_user_id, selected, created_at, updated_at";
const SUBJECT_RESOURCE_CHUNK_SELECT =
  "id, resource_id, student_user_id, subject_tag, chunk_index, stable_chunk_id, page_start, page_end, section_title, content, char_count, token_estimate, extraction_confidence, metadata, created_at, updated_at";
const CHUNKER_VERSION = "subject-resource-chunker-v1";
const MAX_CHUNK_CHARS = 3200;
const CHUNK_OVERLAP_CHARS = 240;

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

function normalizeText(text: string) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
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
