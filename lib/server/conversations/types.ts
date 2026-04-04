import "server-only";

import type { IntakeAttachmentCategory } from "@/lib/intake/intake-config";
import type { ConversationAttachmentRecord } from "@/lib/server/ai/types";
import type { AppUserRecord, UiLanguageCode } from "@/lib/server/auth/types";

export type ConversationActionIntent =
  | "student_message"
  | "hint"
  | "summarize";

export type SummaryAudience = "student" | "parent" | "tutor";

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

export type CreateConversationShellInput = {
  title: string;
  subjectTag: string;
  gradedHomework: boolean;
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

export type SessionSummaryRecord = {
  id: string;
  conversation_id: string;
  audience: SummaryAudience;
  language_code: UiLanguageCode;
  summary_text: string;
  weakness_tags: string[];
  next_step_recommendation: string | null;
  generated_model_name: string | null;
  created_at: string;
  updated_at: string;
};

export type AppendConversationMessageInput = {
  contentText: string;
  intent: ConversationActionIntent;
};

export type AppendConversationMessageResult = {
  studentMessage: ConversationMessageRecord;
  assistantMessage: ConversationMessageRecord;
};

export type UpdateWorkspaceInput = {
  assignmentText: string;
  editedExtractedText: string;
  planText: string;
  draftAnswerText: string;
  studentNotes: string;
};

export type ConversationDetail = {
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord | null;
  messages: ConversationMessageRecord[];
  attachments: ConversationAttachmentRecord[];
  summaries: SessionSummaryRecord[];
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

export type CreateConversationShellResult = {
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord;
};

export type CompleteConversationResult = {
  conversation: ConversationRecord;
  summaries: SessionSummaryRecord[];
};

export type ConversationViewer = Pick<
  AppUserRecord,
  "id" | "role" | "preferred_ui_language"
>;
