import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import type { ConversationRecord } from "@/lib/server/conversations/types";
import type {
  ConversationResourceLinkRecord,
  SubjectResourceChunkRecord,
  SubjectResourceRetrievalChunk,
  SubjectResourceRetrievalResult,
  SubjectResourceRecord,
  SubjectResourceReuseResult,
} from "@/lib/server/subject-resources/types";
import {
  AI_CONTEXT_LIMITS,
  truncateForAiContext,
} from "@/lib/server/ai/guardrails";

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

function metadataBoolean(metadata: Record<string, unknown>, key: string) {
  return metadata[key] === true;
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
