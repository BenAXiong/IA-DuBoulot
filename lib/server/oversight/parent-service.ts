import "server-only";

import { requireAppUserRole } from "@/lib/server/auth/authorization";
import type { AppUserRecord, UiLanguageCode } from "@/lib/server/auth/types";
import { selectSummaryForLanguage } from "@/lib/oversight/summary-selection";
import { loadPayerBillingSnapshot } from "@/lib/server/billing/service";
import { AppError } from "@/lib/server/errors/app-error";
import { loadConversationDetail } from "@/lib/server/conversations/conversation-service";
import { loadVisibleStudentMemory } from "@/lib/server/memory/service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveStudentUsageSnapshot } from "@/lib/server/usage/service";
import type { SessionSummaryRecord } from "@/lib/server/conversations/types";
import {
  loadActiveLinkedStudentIdsForParent,
  requireViewerCanAccessStudent,
} from "@/lib/server/oversight/access";
import type {
  OversightConversationPreview,
  OversightStudentSnapshot,
  ParentConversationReview,
  ParentConversationSummaryVariant,
  ParentDashboardSnapshot,
  ParentLinkedStudentSnapshot,
  ParentPendingApprovalSnapshot,
  ParentStudentDetail,
  ParentWeeklyStudentSnapshot,
  ParentWeeklySummary,
} from "@/lib/server/oversight/types";

type StudentRow = {
  id: string;
  display_name: string;
  preferred_ui_language: UiLanguageCode;
  age_band: AppUserRecord["age_band"];
  is_under_13: boolean;
  account_status: AppUserRecord["account_status"];
};

type ParentLinkRow = {
  student_user_id: string;
  relationship_label: string | null;
};

type PendingParentApprovalRow = {
  id: string;
  invitation_kind: "parent_approval" | "parent_link";
  student_user_id: string;
  relationship_label: string | null;
  created_at: string;
  expires_at: string;
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

function toServiceError(message: string, cause: unknown) {
  return new AppError({
    code: "service_unavailable",
    message,
    status: 503,
    retryable: true,
    cause,
  });
}

function toStudentSnapshot(student: StudentRow): OversightStudentSnapshot {
  return {
    id: student.id,
    displayName: student.display_name,
    preferredUiLanguage: student.preferred_ui_language,
    ageBand: student.age_band,
    isUnder13: student.is_under_13,
    accountStatus: student.account_status,
  };
}

async function toParentLinkedStudentSnapshot(
  student: StudentRow,
): Promise<ParentLinkedStudentSnapshot> {
  return {
    ...toStudentSnapshot(student),
    usage: await resolveStudentUsageSnapshot({
      studentUserId: student.id,
    }),
  };
}

function byNewestActivity(
  left: Pick<ConversationRow, "last_message_at" | "created_at">,
  right: Pick<ConversationRow, "last_message_at" | "created_at">,
) {
  const leftKey = left.last_message_at ?? left.created_at;
  const rightKey = right.last_message_at ?? right.created_at;
  return rightKey.localeCompare(leftKey);
}

function buildSummaryMap(rows: SummaryRow[]) {
  return rows.reduce<Map<string, SummaryRow[]>>((map, row) => {
    const existing = map.get(row.conversation_id) ?? [];
    existing.push(row);
    map.set(row.conversation_id, existing);
    return map;
  }, new Map<string, SummaryRow[]>());
}

function buildConversationPreviews(input: {
  conversations: ConversationRow[];
  studentsById: Map<string, StudentRow>;
  summariesByConversation: Map<string, SummaryRow[]>;
  preferredLanguage: UiLanguageCode;
}): OversightConversationPreview[] {
  return input.conversations
    .map((conversation): OversightConversationPreview | null => {
      const student = input.studentsById.get(conversation.student_user_id);

      if (!student) {
        return null;
      }

      const summaries = input.summariesByConversation.get(conversation.id) ?? [];
      const selectedSummary = selectSummaryForLanguage(
        summaries,
        input.preferredLanguage,
      );

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

function buildWeeklySummary(input: {
  conversations: ConversationRow[];
  studentsById: Map<string, StudentRow>;
  summariesByConversation: Map<string, SummaryRow[]>;
  preferredLanguage: UiLanguageCode;
}): ParentWeeklySummary {
  const now = new Date();
  const windowEnd = now.toISOString();
  const windowStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const windowStart = windowStartDate.toISOString();
  const completed = input.conversations.filter(
    (conversation) =>
      conversation.completed_at &&
      conversation.completed_at >= windowStart &&
      conversation.completed_at <= windowEnd,
  );

  const grouped = completed.reduce<Map<string, ConversationRow[]>>((map, conversation) => {
    const rows = map.get(conversation.student_user_id) ?? [];
    rows.push(conversation);
    map.set(conversation.student_user_id, rows);
    return map;
  }, new Map<string, ConversationRow[]>());

  const studentSnapshots = Array.from(grouped.entries())
    .map(([studentUserId, conversations]): ParentWeeklyStudentSnapshot | null => {
      const student = input.studentsById.get(studentUserId);

      if (!student) {
        return null;
      }

      const latestConversation = [...conversations].sort(byNewestActivity)[0];
      const summaries =
        input.summariesByConversation.get(latestConversation.id) ?? [];
      const selectedSummary = selectSummaryForLanguage(
        summaries,
        input.preferredLanguage,
      );

      return {
        studentUserId,
        studentDisplayName: student.display_name,
        completedSessionCount: conversations.length,
        latestSummaryText: selectedSummary?.summary_text ?? null,
        nextStepRecommendation:
          selectedSummary?.next_step_recommendation ?? null,
      };
    })
    .filter((snapshot): snapshot is ParentWeeklyStudentSnapshot => snapshot !== null)
    .sort((left, right) => right.completedSessionCount - left.completedSessionCount);

  return {
    windowStart,
    windowEnd,
    completedSessionCount: completed.length,
    reviewedStudentCount: studentSnapshots.length,
    studentSnapshots,
  };
}

async function loadLinkedStudents(parentUserId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: links, error: linkError } = await supabase
    .from("parent_student_links")
    .select("student_user_id, relationship_label")
    .eq("parent_user_id", parentUserId)
    .eq("link_status", "active");

  if (linkError) {
    throw toServiceError("Unable to load linked students.", linkError);
  }

  const studentIds = ((links ?? []) as ParentLinkRow[]).map(
    (link) => link.student_user_id,
  );

  if (studentIds.length === 0) {
    return {
      links: [] as ParentLinkRow[],
      students: [] as StudentRow[],
    };
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

  return {
    links: (links ?? []) as ParentLinkRow[],
    students: (students ?? []) as StudentRow[],
  };
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

async function loadParentSummaryRows(conversationIds: string[]) {
  if (conversationIds.length === 0) {
    return [] as SummaryRow[];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("session_summaries")
    .select(
      "conversation_id, language_code, summary_text, next_step_recommendation, weakness_tags, generated_model_name, updated_at",
    )
    .eq("audience", "parent")
    .in("conversation_id", conversationIds);

  if (error) {
    throw toServiceError("Unable to load parent summaries.", error);
  }

  return (data ?? []) as SummaryRow[];
}

async function loadPendingParentApprovals(input: {
  parentEmail: string | null;
}) {
  if (!input.parentEmail) {
    return [] as ParentPendingApprovalSnapshot[];
  }

  const normalizedEmail = input.parentEmail.trim().toLowerCase();

  if (!normalizedEmail) {
    return [] as ParentPendingApprovalSnapshot[];
  }

  const supabase = createSupabaseAdminClient();
  const { data: invitations, error: invitationError } = await supabase
    .from("account_link_invitations")
    .select(
      "id, invitation_kind, student_user_id, relationship_label, created_at, expires_at",
    )
    .eq("target_role", "parent")
    .eq("target_email", normalizedEmail)
    .eq("invitation_status", "pending")
    .in("invitation_kind", ["parent_approval", "parent_link"])
    .order("created_at", { ascending: false });

  if (invitationError) {
    throw toServiceError(
      "Unable to load pending parent approvals.",
      invitationError,
    );
  }

  const activeRows = ((invitations ?? []) as PendingParentApprovalRow[]).filter(
    (invitation) => new Date(invitation.expires_at).getTime() > Date.now(),
  );

  if (activeRows.length === 0) {
    return [] as ParentPendingApprovalSnapshot[];
  }

  const studentIds = Array.from(
    new Set(activeRows.map((invitation) => invitation.student_user_id)),
  );
  const { data: students, error: studentError } = await supabase
    .from("users")
    .select(
      "id, display_name, preferred_ui_language, age_band, is_under_13, account_status",
    )
    .in("id", studentIds);

  if (studentError) {
    throw toServiceError(
      "Unable to load pending-approval student profiles.",
      studentError,
    );
  }

  const studentsById = new Map(
    ((students ?? []) as StudentRow[]).map((student) => [student.id, student]),
  );

  return activeRows
    .map((invitation): ParentPendingApprovalSnapshot | null => {
      const student = studentsById.get(invitation.student_user_id);

      if (!student) {
        return null;
      }

      return {
        id: invitation.id,
        invitationKind: invitation.invitation_kind,
        student: toStudentSnapshot(student),
        relationshipLabel: invitation.relationship_label,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
      };
    })
    .filter(
      (invitation): invitation is ParentPendingApprovalSnapshot =>
        invitation !== null,
    );
}

export async function loadParentDashboardSnapshot(
  appUser: AppUserRecord,
  parentEmail: string | null,
): Promise<ParentDashboardSnapshot> {
  requireAppUserRole(appUser, ["parent"]);

  const { students } = await loadLinkedStudents(appUser.id);
  const studentIds = students.map((student) => student.id);
  const [conversations, billing, linkedStudents, pendingApprovals] =
    await Promise.all([
    loadConversationRows(studentIds, 12),
    loadPayerBillingSnapshot(appUser.id),
    Promise.all(students.map((student) => toParentLinkedStudentSnapshot(student))),
    loadPendingParentApprovals({ parentEmail }),
  ]);
  const summaries = await loadParentSummaryRows(
    conversations.map((conversation) => conversation.id),
  );
  const studentsById = new Map(students.map((student) => [student.id, student]));
  const summariesByConversation = buildSummaryMap(summaries);

  return {
    linkedStudents: linkedStudents
      .sort((left, right) => left.displayName.localeCompare(right.displayName)),
    pendingApprovals,
    recentSessions: buildConversationPreviews({
      conversations,
      studentsById,
      summariesByConversation,
      preferredLanguage: appUser.preferred_ui_language,
    }),
    weeklySummary: buildWeeklySummary({
      conversations,
      studentsById,
      summariesByConversation,
      preferredLanguage: appUser.preferred_ui_language,
    }),
    billing,
  };
}

export async function loadParentStudentDetail(input: {
  appUser: AppUserRecord;
  studentUserId: string;
}): Promise<ParentStudentDetail> {
  requireAppUserRole(input.appUser, ["parent"]);
  await requireViewerCanAccessStudent(input.appUser, input.studentUserId);

  const { links, students } = await loadLinkedStudents(input.appUser.id);
  const link =
    links.find((candidate) => candidate.student_user_id === input.studentUserId) ??
    null;
  const student =
    students.find((candidate) => candidate.id === input.studentUserId) ?? null;

  if (!link || !student) {
    throw new AppError({
      code: "not_found",
      message: "Student not found.",
      status: 404,
    });
  }

  const conversations = await loadConversationRows([input.studentUserId], 12);
  const summaries = await loadParentSummaryRows(
    conversations.map((conversation) => conversation.id),
  );
  const studentsById = new Map([[student.id, student]]);
  const summariesByConversation = buildSummaryMap(summaries);
  const [studentSnapshot, memory] = await Promise.all([
    toParentLinkedStudentSnapshot(student),
    loadVisibleStudentMemory({
      viewer: input.appUser,
      studentUserId: input.studentUserId,
      auditContext: {
        action: "parent_student_memory_view",
        route: "/app/students/[studentUserId]",
        requestId: `memory_${crypto.randomUUID()}`,
      },
    }),
  ]);

  return {
    student: studentSnapshot,
    relationshipLabel: link.relationship_label,
    recentSessions: buildConversationPreviews({
      conversations,
      studentsById,
      summariesByConversation,
      preferredLanguage: input.appUser.preferred_ui_language,
    }),
    weeklySummary: buildWeeklySummary({
      conversations,
      studentsById,
      summariesByConversation,
      preferredLanguage: input.appUser.preferred_ui_language,
    }),
    memory,
  };
}

export async function loadParentConversationReview(input: {
  appUser: AppUserRecord;
  conversationId: string;
}): Promise<ParentConversationReview> {
  requireAppUserRole(input.appUser, ["parent"]);

  const detail = await loadConversationDetail({
    viewer: input.appUser,
    conversationId: input.conversationId,
    auditContext: {
      action: "parent_session_review_view",
      route: "/app/review/[conversationId]",
    },
  });

  const studentIds = await loadActiveLinkedStudentIdsForParent(input.appUser.id);

  if (!studentIds.includes(detail.conversation.student_user_id)) {
    throw new AppError({
      code: "not_found",
      message: "Conversation not found.",
      status: 404,
    });
  }

  const { students } = await loadLinkedStudents(input.appUser.id);
  const student =
    students.find((candidate) => candidate.id === detail.conversation.student_user_id) ??
    null;

  if (!student) {
    throw new AppError({
      code: "not_found",
      message: "Student not found.",
      status: 404,
    });
  }

  const summaryVariants: ParentConversationSummaryVariant[] = detail.summaries
    .map((summary) => ({
      languageCode: summary.language_code,
      summaryText: summary.summary_text,
      nextStepRecommendation: summary.next_step_recommendation,
      weaknessTags: summary.weakness_tags,
      generatedModelName: summary.generated_model_name,
      updatedAt: summary.updated_at,
    }))
    .sort((left, right) => left.languageCode.localeCompare(right.languageCode));

  return {
    student: toStudentSnapshot(student),
    detail,
    summaryVariants,
    billing: await loadPayerBillingSnapshot(input.appUser.id),
  };
}
