import type { UiLanguageCode } from "@/lib/server/auth/types";

export type SubjectResourceRecord = {
  id: string;
  student_user_id: string;
  created_by_user_id: string | null;
  subject_tag: string;
  source_attachment_id: string | null;
  source_conversation_id: string | null;
  source_storage_bucket: string | null;
  source_storage_path: string | null;
  attachment_kind: "image" | "screenshot" | "pdf" | "document";
  mime_type: string;
  original_filename: string;
  byte_size: number;
  page_count: number | null;
  extraction_status: "pending" | "ready" | "failed";
  raw_extracted_text: string | null;
  source_language: UiLanguageCode | null;
  sha256: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ConversationResourceLinkRecord = {
  id: string;
  conversation_id: string;
  resource_id: string;
  created_by_user_id: string | null;
  selected: boolean;
  created_at: string;
  updated_at: string;
};

export type SubjectResourceChunkRecord = {
  id: string;
  resource_id: string;
  student_user_id: string;
  subject_tag: string;
  chunk_index: number;
  stable_chunk_id: string;
  page_start: number | null;
  page_end: number | null;
  section_title: string | null;
  content: string;
  char_count: number;
  token_estimate: number;
  extraction_confidence: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SubjectResourceReuseResult = {
  resource: SubjectResourceRecord;
  link: ConversationResourceLinkRecord;
  chunks: SubjectResourceChunkRecord[];
};

export type SubjectResourceLibraryItem = SubjectResourceRecord & {
  selected: boolean;
  link: ConversationResourceLinkRecord | null;
  chunk_count: number;
};

export type SubjectResourceRetrievalChunk = SubjectResourceChunkRecord & {
  resource_filename: string;
  resource_summary: string | null;
  score: number;
};

export type SubjectResourceRetrievalResult = {
  contextText: string | null;
  chunks: SubjectResourceRetrievalChunk[];
  selectedResourceCount: number;
};
