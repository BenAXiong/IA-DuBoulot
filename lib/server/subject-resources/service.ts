import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import type { ConversationRecord } from "@/lib/server/conversations/types";
import type {
  ConversationResourceLinkRecord,
  SubjectResourceRecord,
  SubjectResourceReuseResult,
} from "@/lib/server/subject-resources/types";

const SUBJECT_RESOURCE_SELECT =
  "id, student_user_id, created_by_user_id, subject_tag, source_attachment_id, source_conversation_id, source_storage_bucket, source_storage_path, attachment_kind, mime_type, original_filename, byte_size, page_count, extraction_status, raw_extracted_text, source_language, sha256, metadata, created_at, updated_at";
const CONVERSATION_RESOURCE_LINK_SELECT =
  "id, conversation_id, resource_id, created_by_user_id, selected, created_at, updated_at";

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

  return {
    resource: resource as SubjectResourceRecord,
    link,
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
