import "server-only";

import { AppError } from "@/lib/server/errors/app-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUserRecord } from "@/lib/server/auth/types";
import type {
  ConversationRecord,
  ConversationViewer,
} from "@/lib/server/conversations/types";

const CONVERSATION_SELECT =
  "id, student_user_id, created_by_user_id, title, subject_tag, status, graded_homework, assignment_text, edited_extracted_text, source_language, last_message_at, completed_at, created_at, updated_at";

function toServiceError(message: string, cause: unknown) {
  return new AppError({
    code: "service_unavailable",
    message,
    status: 503,
    retryable: true,
    cause,
  });
}

function notFoundError() {
  return new AppError({
    code: "not_found",
    message: "Resource not found.",
    status: 404,
  });
}

async function requireActiveParentLink(parentUserId: string, studentUserId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("parent_student_links")
    .select("student_user_id")
    .eq("parent_user_id", parentUserId)
    .eq("student_user_id", studentUserId)
    .eq("link_status", "active")
    .maybeSingle<{ student_user_id: string }>();

  if (error) {
    throw toServiceError("Unable to verify the parent link.", error);
  }

  if (!data) {
    throw notFoundError();
  }
}

async function requireActiveTutorLink(tutorUserId: string, studentUserId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tutor_student_links")
    .select("student_user_id")
    .eq("tutor_user_id", tutorUserId)
    .eq("student_user_id", studentUserId)
    .eq("link_status", "active")
    .maybeSingle<{ student_user_id: string }>();

  if (error) {
    throw toServiceError("Unable to verify the tutor link.", error);
  }

  if (!data) {
    throw notFoundError();
  }
}

export async function loadActiveLinkedStudentIdsForParent(parentUserId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("parent_student_links")
    .select("student_user_id")
    .eq("parent_user_id", parentUserId)
    .eq("link_status", "active");

  if (error) {
    throw toServiceError("Unable to load linked students.", error);
  }

  return (data ?? []).map((row) => row.student_user_id);
}

export async function loadActiveLinkedStudentIdsForTutor(tutorUserId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tutor_student_links")
    .select("student_user_id")
    .eq("tutor_user_id", tutorUserId)
    .eq("link_status", "active");

  if (error) {
    throw toServiceError("Unable to load linked students.", error);
  }

  return (data ?? []).map((row) => row.student_user_id);
}

export async function requireViewerCanAccessStudent(
  viewer: Pick<AppUserRecord, "id" | "role">,
  studentUserId: string,
) {
  if (viewer.role === "admin") {
    return;
  }

  if (viewer.role === "student") {
    if (viewer.id !== studentUserId) {
      throw notFoundError();
    }
    return;
  }

  if (viewer.role === "parent") {
    await requireActiveParentLink(viewer.id, studentUserId);
    return;
  }

  if (viewer.role === "tutor") {
    await requireActiveTutorLink(viewer.id, studentUserId);
    return;
  }

  throw notFoundError();
}

export async function loadAuthorizedConversationForViewer(input: {
  viewer: ConversationViewer;
  conversationId: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", input.conversationId)
    .maybeSingle<ConversationRecord>();

  if (error) {
    throw toServiceError("Unable to load the conversation.", error);
  }

  if (!conversation) {
    throw notFoundError();
  }

  await requireViewerCanAccessStudent(input.viewer, conversation.student_user_id);

  return {
    supabase,
    conversation,
  };
}
