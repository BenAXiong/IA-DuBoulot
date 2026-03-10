import "server-only";

import { AppError } from "@/lib/server/errors/app-error";
import { logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import { recordAuditEvent } from "@/lib/server/audit/audit-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthenticatedUserContext } from "@/lib/server/auth/types";
import {
  requireAppUserContext,
  requireAppUserRole,
} from "@/lib/server/auth/authorization";
import type {
  ConversationDetail,
  ConversationMessageRecord,
  ConversationRecord,
  ConversationViewer,
  CreateConversationDraftInput,
  CreateConversationDraftResult,
  DraftAttachmentReferenceInput,
  ListConversationSummary,
  WorkspaceStateRecord,
} from "@/lib/server/conversations/types";

const CONVERSATION_SELECT =
  "id, student_user_id, created_by_user_id, title, subject_tag, status, graded_homework, assignment_text, edited_extracted_text, source_language, last_message_at, completed_at, created_at, updated_at";
const WORKSPACE_SELECT =
  "conversation_id, assignment_text, edited_extracted_text, plan_text, draft_answer_text, student_notes, updated_at";
const MESSAGE_SELECT =
  "id, conversation_id, author_user_id, role, content_text, content_language, created_at";

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
): Promise<CreateConversationDraftInput> {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    throw new AppError({
      code: "bad_request",
      message: "Invalid JSON body.",
      status: 400,
      cause: error,
    });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError({
      code: "bad_request",
      message: "Expected a JSON object body.",
      status: 400,
    });
  }

  const payload = body as Partial<{
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
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        title: "Title is required and must be 120 characters or fewer.",
      },
    });
  }

  if (!subjectTag || subjectTag.length > 60) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        subjectTag: "Subject is required and must be 60 characters or fewer.",
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
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        editedExtractedText:
          "Provide pasted text, attachment references, or edited extracted text before creating a session.",
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

function buildAttachmentReferenceLines(references: DraftAttachmentReferenceInput[]) {
  if (references.length === 0) {
    return null;
  }

  return references.map((reference) => {
    const kindLabel = reference.category === "pdf" ? "PDF" : "image/capture";
    const sizeInKb = Math.max(1, Math.round(reference.byteSize / 1024));
    return `- ${reference.name} (${kindLabel}, ${sizeInKb} KB)`;
  });
}

function buildInitialStudentMessageContent(input: CreateConversationDraftInput) {
  const lines = [
    `Titre: ${input.title}`,
    `Matiere: ${input.subjectTag}`,
    `Devoir note: ${input.gradedHomework ? "oui" : "non"}`,
  ];
  const attachmentLines = buildAttachmentReferenceLines(input.attachmentReferences);
  const pastedText = normalizeText(input.pastedText);
  const editedExtractedText = normalizeText(input.editedExtractedText);

  if (attachmentLines) {
    lines.push("", "Pieces referencees:", ...attachmentLines);
  }

  if (pastedText) {
    lines.push("", "Texte fourni:", pastedText);
  }

  if (editedExtractedText && editedExtractedText !== pastedText) {
    lines.push("", "Texte relu:", editedExtractedText);
  }

  return lines.join("\n");
}

function buildWorkspaceNotes(input: CreateConversationDraftInput) {
  const attachmentLines = buildAttachmentReferenceLines(input.attachmentReferences);

  if (!attachmentLines) {
    return null;
  }

  return ["Pieces referencees pour cette session:", ...attachmentLines].join("\n");
}

async function deleteConversationBestEffort(conversationId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from("conversations").delete().eq("id", conversationId);
  } catch {
    // Best-effort cleanup only.
  }
}

export async function createConversationDraft(input: {
  context: AuthenticatedUserContext;
  payload: CreateConversationDraftInput;
  requestId: string;
  route: string;
}): Promise<CreateConversationDraftResult> {
  const appUser = requireAppUserContext(input.context);
  requireAppUserRole(appUser, ["student"]);

  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const assignmentText = normalizeText(input.payload.pastedText);
  const editedExtractedText = normalizeText(input.payload.editedExtractedText);

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert({
      student_user_id: appUser.id,
      created_by_user_id: appUser.id,
      title: input.payload.title,
      subject_tag: input.payload.subjectTag,
      graded_homework: input.payload.gradedHomework,
      assignment_text: assignmentText,
      edited_extracted_text: editedExtractedText,
      source_language: appUser.preferred_ui_language,
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
      student_notes: buildWorkspaceNotes(input.payload),
      last_saved_by_user_id: appUser.id,
    })
    .select(WORKSPACE_SELECT)
    .single<WorkspaceStateRecord>();

  if (workspaceError) {
    await deleteConversationBestEffort(conversation.id);
    throw toServiceError("Unable to create the workspace draft.", workspaceError);
  }

  const { data: initialMessage, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      author_user_id: appUser.id,
      role: "student",
      content_text: buildInitialStudentMessageContent(input.payload),
      content_language: appUser.preferred_ui_language,
    })
    .select(MESSAGE_SELECT)
    .single<ConversationMessageRecord>();

  if (messageError) {
    await deleteConversationBestEffort(conversation.id);
    throw toServiceError("Unable to persist the intake message.", messageError);
  }

  logRuntimeInfo({
    message: "Created conversation draft",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: appUser.id,
    actorRole: appUser.role,
    targetStudentUserId: appUser.id,
    details: {
      conversationId: conversation.id,
      attachmentReferenceCount: input.payload.attachmentReferences.length,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: appUser.id,
      actorRole: appUser.role,
      action: "conversation_create",
      targetTable: "conversations",
      targetId: conversation.id,
      studentUserId: appUser.id,
      conversationId: conversation.id,
      metadata: {
        request_id: input.requestId,
        route: input.route,
        attachment_reference_count: input.payload.attachmentReferences.length,
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block the student flow.
  }

  return {
    conversation,
    workspace,
    initialMessage,
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
}): Promise<ConversationDetail> {
  const supabase = await createSupabaseServerClient();
  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", input.conversationId)
    .maybeSingle<ConversationRecord>();

  if (conversationError) {
    throw toServiceError("Unable to load the conversation.", conversationError);
  }

  if (!conversation) {
    throw new AppError({
      code: "not_found",
      message: "Conversation not found.",
      status: 404,
    });
  }

  const [workspaceResult, messagesResult] = await Promise.all([
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
  ]);

  if (workspaceResult.error) {
    throw toServiceError("Unable to load the workspace draft.", workspaceResult.error);
  }

  if (messagesResult.error) {
    throw toServiceError("Unable to load the conversation history.", messagesResult.error);
  }

  return {
    conversation,
    workspace: workspaceResult.data ?? null,
    messages: (messagesResult.data ?? []) as ConversationMessageRecord[],
  };
}
