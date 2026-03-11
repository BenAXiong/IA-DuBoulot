import "server-only";

import {
  requireAppUserContext,
  requireAppUserRole,
} from "@/lib/server/auth/authorization";
import type { AuthenticatedUserContext } from "@/lib/server/auth/types";
import { recordAuditEvent } from "@/lib/server/audit/audit-service";
import { logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import { AppError } from "@/lib/server/errors/app-error";
import { requireViewerCanAccessStudent } from "@/lib/server/oversight/access";
import type { TutorNoteRecord } from "@/lib/server/oversight/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TutorNoteRow = {
  id: string;
  tutor_user_id: string;
  student_user_id: string;
  conversation_id: string | null;
  note_text: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateTutorNoteInput = {
  studentUserId: string;
  conversationId: string | null;
  noteText: string;
  isPinned: boolean;
};

export type UpdateTutorNoteInput = {
  noteText: string;
  isPinned: boolean;
};

function toServiceError(message: string, cause: unknown) {
  return new AppError({
    code: "service_unavailable",
    message,
    status: 503,
    retryable: true,
    cause,
  });
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

function parseUuid(
  value: unknown,
  fieldName: "studentUserId" | "conversationId",
  allowNull = false,
) {
  if ((value === null || value === "" || typeof value === "undefined") && allowNull) {
    return null;
  }

  if (typeof value !== "string" || !/^[0-9a-fA-F-]{36}$/.test(value)) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        [fieldName]: "Expected a valid UUID.",
      },
    });
  }

  return value;
}

function parseNoteText(value: unknown) {
  if (typeof value !== "string") {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        noteText: "Note text is required.",
      },
    });
  }

  const normalized = value.trim();

  if (!normalized || normalized.length > 4000) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        noteText: "Note text is required and must be 4000 characters or fewer.",
      },
    });
  }

  return normalized;
}

function toTutorNoteRecord(note: TutorNoteRow): TutorNoteRecord {
  return {
    id: note.id,
    tutorUserId: note.tutor_user_id,
    studentUserId: note.student_user_id,
    conversationId: note.conversation_id,
    noteText: note.note_text,
    isPinned: note.is_pinned,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

async function requireConversationOwnership(input: {
  tutorUserId: string;
  studentUserId: string;
  conversationId: string | null;
}) {
  if (!input.conversationId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, student_user_id")
    .eq("id", input.conversationId)
    .maybeSingle<{ id: string; student_user_id: string }>();

  if (error) {
    throw toServiceError("Unable to validate the linked conversation.", error);
  }

  if (!data || data.student_user_id !== input.studentUserId) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        conversationId: "Conversation must belong to the linked student.",
      },
    });
  }
}

async function loadOwnedTutorNote(tutorUserId: string, noteId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tutor_notes")
    .select(
      "id, tutor_user_id, student_user_id, conversation_id, note_text, is_pinned, created_at, updated_at",
    )
    .eq("id", noteId)
    .eq("tutor_user_id", tutorUserId)
    .maybeSingle<TutorNoteRow>();

  if (error) {
    throw toServiceError("Unable to load the tutor note.", error);
  }

  if (!data) {
    throw new AppError({
      code: "not_found",
      message: "Tutor note not found.",
      status: 404,
    });
  }

  return data;
}

export async function parseCreateTutorNoteInput(
  request: Request,
): Promise<CreateTutorNoteInput> {
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

  return {
    studentUserId: parseUuid(payload.studentUserId, "studentUserId") as string,
    conversationId: parseUuid(payload.conversationId, "conversationId", true),
    noteText: parseNoteText(payload.noteText),
    isPinned: payload.isPinned === true,
  };
}

export async function parseUpdateTutorNoteInput(
  request: Request,
): Promise<UpdateTutorNoteInput> {
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

  return {
    noteText: parseNoteText(payload.noteText),
    isPinned: payload.isPinned === true,
  };
}

export async function createTutorNote(input: {
  context: AuthenticatedUserContext;
  payload: CreateTutorNoteInput;
  requestId: string;
  route: string;
}): Promise<TutorNoteRecord> {
  const appUser = requireAppUserContext(input.context);
  requireAppUserRole(appUser, ["tutor"]);
  await requireViewerCanAccessStudent(appUser, input.payload.studentUserId);
  await requireConversationOwnership({
    tutorUserId: appUser.id,
    studentUserId: input.payload.studentUserId,
    conversationId: input.payload.conversationId,
  });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tutor_notes")
    .insert({
      tutor_user_id: appUser.id,
      student_user_id: input.payload.studentUserId,
      conversation_id: input.payload.conversationId,
      note_text: input.payload.noteText,
      is_pinned: input.payload.isPinned,
    })
    .select(
      "id, tutor_user_id, student_user_id, conversation_id, note_text, is_pinned, created_at, updated_at",
    )
    .single<TutorNoteRow>();

  if (error) {
    throw toServiceError("Unable to create the tutor note.", error);
  }

  logRuntimeInfo({
    message: "Created tutor note",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: appUser.id,
    actorRole: appUser.role,
    targetStudentUserId: input.payload.studentUserId,
    details: {
      noteId: data.id,
      conversationId: input.payload.conversationId,
      isPinned: input.payload.isPinned,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: appUser.id,
      actorRole: appUser.role,
      action: "tutor_note_create",
      targetTable: "tutor_notes",
      targetId: data.id,
      studentUserId: input.payload.studentUserId,
      conversationId: input.payload.conversationId,
      metadata: {
        request_id: input.requestId,
        route: input.route,
        is_pinned: input.payload.isPinned,
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block note creation.
  }

  return toTutorNoteRecord(data);
}

export async function updateTutorNote(input: {
  context: AuthenticatedUserContext;
  noteId: string;
  payload: UpdateTutorNoteInput;
  requestId: string;
  route: string;
}): Promise<TutorNoteRecord> {
  const appUser = requireAppUserContext(input.context);
  requireAppUserRole(appUser, ["tutor"]);
  const note = await loadOwnedTutorNote(appUser.id, input.noteId);
  await requireViewerCanAccessStudent(appUser, note.student_user_id);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tutor_notes")
    .update({
      note_text: input.payload.noteText,
      is_pinned: input.payload.isPinned,
    })
    .eq("id", input.noteId)
    .eq("tutor_user_id", appUser.id)
    .select(
      "id, tutor_user_id, student_user_id, conversation_id, note_text, is_pinned, created_at, updated_at",
    )
    .single<TutorNoteRow>();

  if (error) {
    throw toServiceError("Unable to update the tutor note.", error);
  }

  logRuntimeInfo({
    message: "Updated tutor note",
    requestId: input.requestId,
    route: input.route,
    method: "PATCH",
    actorUserId: appUser.id,
    actorRole: appUser.role,
    targetStudentUserId: note.student_user_id,
    details: {
      noteId: input.noteId,
      conversationId: note.conversation_id,
      isPinned: input.payload.isPinned,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: appUser.id,
      actorRole: appUser.role,
      action: "tutor_note_update",
      targetTable: "tutor_notes",
      targetId: data.id,
      studentUserId: note.student_user_id,
      conversationId: note.conversation_id,
      metadata: {
        request_id: input.requestId,
        route: input.route,
        is_pinned: input.payload.isPinned,
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block note updates.
  }

  return toTutorNoteRecord(data);
}

export async function deleteTutorNote(input: {
  context: AuthenticatedUserContext;
  noteId: string;
  requestId: string;
  route: string;
}): Promise<void> {
  const appUser = requireAppUserContext(input.context);
  requireAppUserRole(appUser, ["tutor"]);
  const note = await loadOwnedTutorNote(appUser.id, input.noteId);
  await requireViewerCanAccessStudent(appUser, note.student_user_id);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("tutor_notes")
    .delete()
    .eq("id", input.noteId)
    .eq("tutor_user_id", appUser.id);

  if (error) {
    throw toServiceError("Unable to delete the tutor note.", error);
  }

  logRuntimeInfo({
    message: "Deleted tutor note",
    requestId: input.requestId,
    route: input.route,
    method: "DELETE",
    actorUserId: appUser.id,
    actorRole: appUser.role,
    targetStudentUserId: note.student_user_id,
    details: {
      noteId: note.id,
      conversationId: note.conversation_id,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: appUser.id,
      actorRole: appUser.role,
      action: "tutor_note_delete",
      targetTable: "tutor_notes",
      targetId: note.id,
      studentUserId: note.student_user_id,
      conversationId: note.conversation_id,
      metadata: {
        request_id: input.requestId,
        route: input.route,
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block note deletion.
  }
}
