import "server-only";

import type { IntakeAttachmentCategory } from "@/lib/intake/intake-config";
import type { AppUserRecord, UiLanguageCode } from "@/lib/server/auth/types";

export type DraftAttachmentReferenceInput = {
  name: string;
  category: IntakeAttachmentCategory;
  byteSize: number;
};

export type CreateConversationDraftInput = {
  title: string;
  subjectTag: string;
  gradedHomework: boolean;
  pastedText: string;
  editedExtractedText: string;
  attachmentReferences: DraftAttachmentReferenceInput[];
};

export type ConversationRecord = {
  id: string;
  student_user_id: string;
  created_by_user_id: string;
  title: string;
  subject_tag: string;
  status: "active" | "completed" | "archived";
  graded_homework: boolean;
  assignment_text: string | null;
  edited_extracted_text: string | null;
  source_language: UiLanguageCode | null;
  last_message_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceStateRecord = {
  conversation_id: string;
  assignment_text: string | null;
  edited_extracted_text: string | null;
  plan_text: string | null;
  draft_answer_text: string | null;
  student_notes: string | null;
  updated_at: string;
};

export type ConversationMessageRecord = {
  id: string;
  conversation_id: string;
  author_user_id: string | null;
  role: "student" | "assistant" | "system";
  content_text: string;
  content_language: UiLanguageCode | null;
  created_at: string;
};

export type ConversationDetail = {
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord | null;
  messages: ConversationMessageRecord[];
};

export type ListConversationSummary = Pick<
  ConversationRecord,
  | "id"
  | "title"
  | "subject_tag"
  | "status"
  | "graded_homework"
  | "last_message_at"
  | "completed_at"
  | "created_at"
>;

export type CreateConversationDraftResult = {
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord;
  initialMessage: ConversationMessageRecord;
};

export type ConversationViewer = Pick<
  AppUserRecord,
  "id" | "role" | "preferred_ui_language"
>;
