import "server-only";

import { requireAppUserRole } from "@/lib/server/auth/authorization";
import type { AppUserRecord, UiLanguageCode } from "@/lib/server/auth/types";
import { AppError } from "@/lib/server/errors/app-error";
import { loadConversationDetail } from "@/lib/server/conversations/conversation-service";
import type { SessionSummaryRecord } from "@/lib/server/conversations/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireViewerCanAccessStudent } from "@/lib/server/oversight/access";
import type {
  OversightConversationPreview,
  TutorConversationReview,
  TutorDashboardSnapshot,
  TutorDashboardStudentSnapshot,
  TutorNoteRecord,
  TutorStudentDetail,
  TutorStudentInsight,
} from "@/lib/server/oversight/types";

type StudentRow = {
  id: string;
  display_name: string;
  preferred_ui_language: UiLanguageCode;
  age_band: AppUserRecord["age_band"];
  is_under_13: boolean;
  account_status: AppUserRecord["account_status"];
};

type ConversationRow = {
  id: string;
  student_user_id: string;
  title: string;
  subject_tag: string;
  status: "active" | "completed" | "archived";
  graded_homework: boolean;
  last_message_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type SummaryRow = Pick<
  SessionSummaryRecord,
  | "conversation_id"
  | "language_code"
  | "summary_text"
  | "next_step_recommendation"
  | "weakness_tags"
  | "generated_model_name"
  | "updated_at"
>;

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

function toServiceError(message: string, cause: unknown) {
  return new AppError({
    code: "service_unavailable",
    message,
    status: 503,
    retryable: true,
    cause,
  });
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

function buildSummaryMap(rows: SummaryRow[]) {
  return rows.reduce<Map<string, SummaryRow[]>>((map, row) => {
    const existing = map.get(row.conversation_id) ?? [];
    existing.push(row);
    map.set(row.conversation_id, existing);
    return map;
  }, new Map<string, SummaryRow[]>());
}

function buildNotesByStudent(rows: TutorNoteRow[]) {
  return rows.reduce<Map<string, TutorNoteRow[]>>((map, row) => {
    const existing = map.get(row.student_user_id) ?? [];
    existing.push(row);
    map.set(row.student_user_id, existing);
    return map;
  }, new Map<string, TutorNoteRow[]>());
}

function buildTopWeaknessTags(summaries: SummaryRow[]) {
  const counts = new Map<string, number>();

  for (const summary of summaries) {
    for (const tag of summary.weakness_tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, 4)
    .map(([tag]) => tag);
}

function buildRecommendedNextTopics(summaries: SummaryRow[]) {
  const seen = new Set<string>();
  const topics: string[] = [];

  for (const summary of summaries.sort((left, right) =>
    right.updated_at.localeCompare(left.updated_at),
  )) {
    const recommendation = summary.next_step_recommendation?.trim();

    if (!recommendation || seen.has(recommendation)) {
      continue;
    }

    seen.add(recommendation);
    topics.push(recommendation);

    if (topics.length === 4) {
      break;
    }
  }

  return topics;
}

function buildConversationPreviews(input: {
  conversations: ConversationRow[];
  studentsById: Map<string, StudentRow>;
  summariesByConversation: Map<string, SummaryRow[]>;
}): OversightConversationPreview[] {
  return input.conversations
    .map((conversation): OversightConversationPreview | null => {
      const student = input.studentsById.get(conversation.student_user_id);

      if (!student) {
        return null;
      }

      const summaries = input.summariesByConversation.get(conversation.id) ?? [];
      const selectedSummary = summaries[0] ?? null;

      return {
        id: conversation.id,
        studentUserId: conversation.student_user_id,
        studentDisplayName: student.display_name,
        title: conversation.title,
        subjectTag: conversation.subject_tag,
        status: conversation.status,
        gradedHomework: conversation.graded_homework,
        lastMessageAt: conversation.last_message_at,
        completedAt: conversation.completed_at,
        createdAt: conversation.created_at,
        summaryText: selectedSummary?.summary_text ?? null,
        nextStepRecommendation:
          selectedSummary?.next_step_recommendation ?? null,
        weaknessTags: selectedSummary?.weakness_tags ?? [],
        summaryLanguage: selectedSummary?.language_code ?? null,
        availableSummaryLanguages: summaries.map((summary) => summary.language_code),
      };
    })
    .filter((preview): preview is OversightConversationPreview => preview !== null);
}

function buildTutorStudentSnapshot(input: {
  student: StudentRow;
  notes: TutorNoteRow[];
  conversations: ConversationRow[];
  summaries: SummaryRow[];
}): TutorDashboardStudentSnapshot {
  return {
    id: input.student.id,
    displayName: input.student.display_name,
    preferredUiLanguage: input.student.preferred_ui_language,
    ageBand: input.student.age_band,
    isUnder13: input.student.is_under_13,
    accountStatus: input.student.account_status,
    pinnedNoteCount: input.notes.filter((note) => note.is_pinned).length,
    recentSessionCount: input.conversations.length,
    topWeaknessTags: buildTopWeaknessTags(input.summaries),
  };
}

function buildTutorStudentInsight(summaryRows: SummaryRow[]): TutorStudentInsight {
  return {
    topWeaknessTags: buildTopWeaknessTags(summaryRows),
    recommendedNextTopics: buildRecommendedNextTopics(summaryRows),
  };
}

async function loadTutorLinkedStudents(tutorUserId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: links, error: linkError } = await supabase
    .from("tutor_student_links")
    .select("student_user_id")
    .eq("tutor_user_id", tutorUserId)
    .eq("link_status", "active");

  if (linkError) {
    throw toServiceError("Unable to load linked students.", linkError);
  }

  const studentIds = (links ?? []).map((link) => link.student_user_id);

  if (studentIds.length === 0) {
    return [] as StudentRow[];
  }

  const { data: students, error: studentError } = await supabase
    .from("users")
    .select(
      "id, display_name, preferred_ui_language, age_band, is_under_13, account_status",
    )
    .in("id", studentIds);

  if (studentError) {
    throw toServiceError("Unable to load linked student profiles.", studentError);
  }

  return (students ?? []) as StudentRow[];
}

async function loadConversationRows(studentIds: string[], limit: number) {
  if (studentIds.length === 0) {
    return [] as ConversationRow[];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id, student_user_id, title, subject_tag, status, graded_homework, last_message_at, completed_at, created_at",
    )
    .in("student_user_id", studentIds)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw toServiceError("Unable to load linked conversations.", error);
  }

  return (data ?? []) as ConversationRow[];
}

async function loadTutorSummaryRows(conversationIds: string[]) {
  if (conversationIds.length === 0) {
    return [] as SummaryRow[];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("session_summaries")
    .select(
      "conversation_id, language_code, summary_text, next_step_recommendation, weakness_tags, generated_model_name, updated_at",
    )
    .eq("audience", "tutor")
    .in("conversation_id", conversationIds)
    .order("updated_at", { ascending: false });

  if (error) {
    throw toServiceError("Unable to load tutor summaries.", error);
  }

  return (data ?? []) as SummaryRow[];
}

async function loadTutorNotes(tutorUserId: string, studentIds: string[]) {
  if (studentIds.length === 0) {
    return [] as TutorNoteRow[];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tutor_notes")
    .select(
      "id, tutor_user_id, student_user_id, conversation_id, note_text, is_pinned, created_at, updated_at",
    )
    .eq("tutor_user_id", tutorUserId)
    .in("student_user_id", studentIds)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw toServiceError("Unable to load tutor notes.", error);
  }

  return (data ?? []) as TutorNoteRow[];
}

export async function loadTutorDashboardSnapshot(
  appUser: AppUserRecord,
): Promise<TutorDashboardSnapshot> {
  requireAppUserRole(appUser, ["tutor"]);

  const students = await loadTutorLinkedStudents(appUser.id);
  const studentIds = students.map((student) => student.id);
  const [conversations, notes] = await Promise.all([
    loadConversationRows(studentIds, 12),
    loadTutorNotes(appUser.id, studentIds),
  ]);
  const summaries = await loadTutorSummaryRows(
    conversations.map((conversation) => conversation.id),
  );
  const studentsById = new Map(students.map((student) => [student.id, student]));
  const summariesByConversation = buildSummaryMap(summaries);
  const summariesByStudent = summaries.reduce<Map<string, SummaryRow[]>>((map, row) => {
    const conversation = conversations.find(
      (candidate) => candidate.id === row.conversation_id,
    );

    if (!conversation) {
      return map;
    }

    const existing = map.get(conversation.student_user_id) ?? [];
    existing.push(row);
    map.set(conversation.student_user_id, existing);
    return map;
  }, new Map<string, SummaryRow[]>());
  const notesByStudent = buildNotesByStudent(notes);

  return {
    linkedStudents: students
      .map((student) =>
        buildTutorStudentSnapshot({
          student,
          notes: notesByStudent.get(student.id) ?? [],
          conversations: conversations.filter(
            (conversation) => conversation.student_user_id === student.id,
          ),
          summaries: summariesByStudent.get(student.id) ?? [],
        }),
      )
      .sort((left, right) => left.displayName.localeCompare(right.displayName)),
    recentSessions: buildConversationPreviews({
      conversations,
      studentsById,
      summariesByConversation,
    }),
  };
}

export async function loadTutorStudentDetail(input: {
  appUser: AppUserRecord;
  studentUserId: string;
}): Promise<TutorStudentDetail> {
  requireAppUserRole(input.appUser, ["tutor"]);
  await requireViewerCanAccessStudent(input.appUser, input.studentUserId);

  const students = await loadTutorLinkedStudents(input.appUser.id);
  const student =
    students.find((candidate) => candidate.id === input.studentUserId) ?? null;

  if (!student) {
    throw new AppError({
      code: "not_found",
      message: "Student not found.",
      status: 404,
    });
  }

  const conversations = await loadConversationRows([input.studentUserId], 12);
  const summaries = await loadTutorSummaryRows(
    conversations.map((conversation) => conversation.id),
  );
  const notes = await loadTutorNotes(input.appUser.id, [input.studentUserId]);
  const studentsById = new Map([[student.id, student]]);

  return {
    student: buildTutorStudentSnapshot({
      student,
      notes,
      conversations,
      summaries,
    }),
    recentSessions: buildConversationPreviews({
      conversations,
      studentsById,
      summariesByConversation: buildSummaryMap(summaries),
    }),
    notes: notes.map(toTutorNoteRecord),
    insight: buildTutorStudentInsight(summaries),
  };
}

export async function loadTutorConversationReview(input: {
  appUser: AppUserRecord;
  conversationId: string;
}): Promise<TutorConversationReview> {
  requireAppUserRole(input.appUser, ["tutor"]);

  const detail = await loadConversationDetail({
    viewer: input.appUser,
    conversationId: input.conversationId,
    auditContext: {
      action: "tutor_session_review_view",
      route: "/app/review/[conversationId]",
    },
  });

  await requireViewerCanAccessStudent(
    input.appUser,
    detail.conversation.student_user_id,
  );

  const studentDetail = await loadTutorStudentDetail({
    appUser: input.appUser,
    studentUserId: detail.conversation.student_user_id,
  });

  return {
    student: studentDetail.student,
    detail,
    notes: studentDetail.notes
      .filter(
        (note) =>
          note.conversationId === null ||
          note.conversationId === detail.conversation.id,
      )
      .sort((left, right) => {
        if (left.isPinned !== right.isPinned) {
          return left.isPinned ? -1 : 1;
        }

        return right.updatedAt.localeCompare(left.updatedAt);
      }),
    insight: studentDetail.insight,
  };
}
