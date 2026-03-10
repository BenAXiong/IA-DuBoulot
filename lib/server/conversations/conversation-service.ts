import "server-only";

import { AppError } from "@/lib/server/errors/app-error";
import { logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import { recordAuditEvent } from "@/lib/server/audit/audit-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthenticatedUserContext } from "@/lib/server/auth/types";
import {
  requireAppUserContext,
  requireAppUserRole,
} from "@/lib/server/auth/authorization";
import {
  buildDraftAssistantReply,
  buildInitialWorkspaceFromDraft,
  buildStudentIntentMessage,
} from "@/lib/server/conversations/draft-coach";
import { buildDeterministicStudentSessionSummary } from "@/lib/server/conversations/draft-summary";
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
  DraftAttachmentReferenceInput,
  ListConversationSummary,
  SessionSummaryRecord,
  UpdateWorkspaceInput,
  WorkspaceStateRecord,
} from "@/lib/server/conversations/types";

const CONVERSATION_SELECT =
  "id, student_user_id, created_by_user_id, title, subject_tag, status, graded_homework, assignment_text, edited_extracted_text, source_language, last_message_at, completed_at, created_at, updated_at";
const WORKSPACE_SELECT =
  "conversation_id, assignment_text, edited_extracted_text, plan_text, draft_answer_text, student_notes, updated_at";
const MESSAGE_SELECT =
  "id, conversation_id, author_user_id, role, content_text, content_language, created_at";
const SUMMARY_SELECT =
  "id, conversation_id, audience, language_code, summary_text, weakness_tags, next_step_recommendation, generated_model_name, created_at, updated_at";

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

function requireBodyObject(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError({
      code: "bad_request",
      message: "Expected a JSON object body.",
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

export async function parseAppendConversationMessageInput(
  request: Request,
): Promise<AppendConversationMessageInput> {
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

  const payload = requireBodyObject(body);
  const intent =
    payload.intent === "hint" || payload.intent === "summarize"
      ? payload.intent
      : "student_message";
  const contentText =
    typeof payload.contentText === "string" ? payload.contentText : "";

  if (intent === "student_message" && contentText.trim().length === 0) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        contentText: "Message text is required.",
      },
    });
  }

  if (contentText.trim().length > 4000) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        contentText: "Message text must be 4000 characters or fewer.",
      },
    });
  }

  return {
    contentText,
    intent,
  };
}

export async function parseUpdateWorkspaceInput(
  request: Request,
): Promise<UpdateWorkspaceInput> {
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

  const payload = requireBodyObject(body);

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

  if (assignmentText.length > 12000 || editedExtractedText.length > 12000) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        assignmentText: "Assignment and extracted text fields must stay under 12000 characters.",
      },
    });
  }

  if (planText.length > 8000 || draftAnswerText.length > 8000 || studentNotes.length > 8000) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        planText: "Workspace fields must stay under 8000 characters.",
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
  const initialWorkspace = buildInitialWorkspaceFromDraft(input.payload);
  const assignmentText = normalizeText(initialWorkspace.assignmentText);
  const editedExtractedText = normalizeText(initialWorkspace.editedExtractedText);

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

async function requireWritableStudentConversation(input: {
  context: AuthenticatedUserContext;
  conversationId: string;
}) {
  const appUser = requireAppUserContext(input.context);
  requireAppUserRole(appUser, ["student"]);

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
      message: "Conversation not found.",
      status: 404,
    });
  }

  if (conversation.student_user_id !== appUser.id) {
    throw new AppError({
      code: "forbidden",
      message: "You do not have access to this conversation.",
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

  const [workspaceResult, messagesResult, summariesResult] = await Promise.all([
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

  if (summariesResult.error) {
    throw toServiceError("Unable to load the visible summaries.", summariesResult.error);
  }

  return {
    conversation,
    workspace: workspaceResult.data ?? null,
    messages: (messagesResult.data ?? []) as ConversationMessageRecord[],
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

  if (conversation.status !== "active") {
    throw new AppError({
      code: "conflict",
      message: "Completed sessions are read-only.",
      status: 409,
    });
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspace_states")
    .select(WORKSPACE_SELECT)
    .eq("conversation_id", input.conversationId)
    .maybeSingle<WorkspaceStateRecord>();

  if (workspaceError) {
    throw toServiceError("Unable to load the workspace before appending a message.", workspaceError);
  }

  const studentMessageText = buildStudentIntentMessage({
    intent: input.payload.intent,
    contentText: input.payload.contentText,
  });
  const assistantMessageText = buildDraftAssistantReply({
    conversation,
    workspace: workspace ?? null,
    intent: input.payload.intent,
    studentMessageText,
  });
  const studentCreatedAt = new Date();
  const assistantCreatedAt = new Date(studentCreatedAt.getTime() + 1);

  const { data: insertedMessages, error: insertError } = await supabase
    .from("messages")
    .insert([
      {
        conversation_id: input.conversationId,
        author_user_id: appUser.id,
        role: "student",
        content_text: studentMessageText,
        content_language: appUser.preferred_ui_language,
        created_at: studentCreatedAt.toISOString(),
      },
      {
        conversation_id: input.conversationId,
        author_user_id: null,
        role: "assistant",
        content_text: assistantMessageText,
        content_language: appUser.preferred_ui_language,
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

  const { error: conversationUpdateError } = await supabase
    .from("conversations")
    .update({
      last_message_at: assistantCreatedAt.toISOString(),
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

  return {
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
    throw new AppError({
      code: "conflict",
      message: "Completed sessions are read-only.",
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

async function upsertStudentSummary(input: {
  conversation: ConversationRecord;
  workspace: WorkspaceStateRecord | null;
  messages: ConversationMessageRecord[];
  languageCode: ConversationViewer["preferred_ui_language"];
}) {
  const supabase = createSupabaseAdminClient();
  const summaryPayload = buildDeterministicStudentSessionSummary({
    conversation: input.conversation,
    workspace: input.workspace,
    messages: input.messages,
    languageCode: input.languageCode,
  });

  const { data, error } = await supabase
    .from("session_summaries")
    .upsert(
      {
        conversation_id: input.conversation.id,
        audience: "student",
        ...summaryPayload,
      },
      {
        onConflict: "conversation_id,audience,language_code",
      },
    )
    .select(SUMMARY_SELECT)
    .single<SessionSummaryRecord>();

  if (error) {
    throw toServiceError("Unable to persist the student summary.", error);
  }

  return data;
}

function mergeSummaryRecord(
  summaries: SessionSummaryRecord[],
  nextSummary: SessionSummaryRecord,
) {
  const remaining = summaries.filter(
    (summary) =>
      !(
        summary.audience === nextSummary.audience &&
        summary.language_code === nextSummary.language_code
      ),
  );

  return [nextSummary, ...remaining].sort((left, right) =>
    right.created_at.localeCompare(left.created_at),
  );
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
    throw new AppError({
      code: "conflict",
      message: "Archived sessions cannot be completed again.",
      status: 409,
    });
  }

  const [workspaceResult, messagesResult, summariesResult] = await Promise.all([
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

  if (summariesResult.error) {
    throw toServiceError("Unable to load existing summaries before completion.", summariesResult.error);
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

  const studentSummary = await upsertStudentSummary({
    conversation: completedConversation,
    workspace: workspaceResult.data ?? null,
    messages: (messagesResult.data ?? []) as ConversationMessageRecord[],
    languageCode: appUser.preferred_ui_language,
  });
  const summaries = mergeSummaryRecord(
    (summariesResult.data ?? []) as SessionSummaryRecord[],
    studentSummary,
  );

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
      summaryAudience: studentSummary.audience,
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
        summary_audience: studentSummary.audience,
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block the student flow.
  }

  return {
    conversation: completedConversation,
    summaries,
  };
}
