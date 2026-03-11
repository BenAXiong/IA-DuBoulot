import "server-only";

import type { AppUserRecord } from "@/lib/server/auth/types";
import { AppError } from "@/lib/server/errors/app-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveStudentUsageSnapshot } from "@/lib/server/usage/service";
import type {
  ConversationStatus,
  LinkStatus,
  StudentDashboardConversation,
  StudentDashboardLinkCounts,
  StudentDashboardSnapshot,
  StudentDashboardStartState,
  StudentDashboardSubjectRollup,
  StudentDashboardSupportSnapshot,
  StudentDashboardUsageSnapshot,
} from "@/lib/server/student-dashboard/types";

type StudentProfileRow = {
  parental_approval_required: boolean;
  parent_approved_at: string | null;
};

type LinkRow = {
  link_status: LinkStatus;
};

type ConversationRow = {
  id: string;
  title: string;
  subject_tag: string;
  status: ConversationStatus;
  graded_homework: boolean;
  last_message_at: string | null;
  completed_at: string | null;
  created_at: string;
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

function countLinks(rows: LinkRow[]): StudentDashboardLinkCounts {
  return rows.reduce<StudentDashboardLinkCounts>(
    (counts, row) => {
      counts[row.link_status] += 1;
      return counts;
    },
    {
      active: 0,
      pending: 0,
      revoked: 0,
    },
  );
}

function buildSubjectRollup(
  conversations: StudentDashboardConversation[],
): StudentDashboardSubjectRollup[] {
  const counts = new Map<string, number>();

  for (const conversation of conversations) {
    counts.set(
      conversation.subjectTag,
      (counts.get(conversation.subjectTag) ?? 0) + 1,
    );
  }

  return Array.from(counts.entries())
    .map(([subjectTag, count]) => ({
      subjectTag,
      count,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.subjectTag.localeCompare(right.subjectTag);
    });
}

function buildStartState(input: {
  appUser: AppUserRecord;
  support: StudentDashboardSupportSnapshot;
  usage: StudentDashboardUsageSnapshot;
}): StudentDashboardStartState {
  const { appUser, support, usage } = input;

  if (appUser.account_status === "suspended") {
    return "suspended";
  }

  if (appUser.account_status === "deletion_requested") {
    return "deletion_requested";
  }

  if (
    appUser.is_under_13 &&
    (appUser.account_status === "pending_parent_approval" ||
      (support.parentalApprovalRequired &&
        !support.parentApprovedAt &&
        support.parentLinks.active === 0))
  ) {
    return "pending_parent_approval";
  }

  if (usage.quota.accessState === "blocked") {
    return "quota_blocked";
  }

  return "ready";
}

export async function loadStudentDashboardSnapshot(
  appUser: AppUserRecord,
): Promise<StudentDashboardSnapshot> {
  if (appUser.role !== "student") {
    throw new AppError({
      code: "forbidden",
      message: "Student dashboard data is only available for student accounts.",
      status: 403,
    });
  }

  const supabase = await createSupabaseServerClient();

  const [
    studentProfileResult,
    parentLinksResult,
    tutorLinksResult,
    conversationsResult,
    usage,
  ] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("parental_approval_required, parent_approved_at")
      .eq("student_user_id", appUser.id)
      .maybeSingle<StudentProfileRow>(),
    supabase
      .from("parent_student_links")
      .select("link_status")
      .eq("student_user_id", appUser.id),
    supabase
      .from("tutor_student_links")
      .select("link_status")
      .eq("student_user_id", appUser.id),
    supabase
      .from("conversations")
      .select(
        "id, title, subject_tag, status, graded_homework, last_message_at, completed_at, created_at",
      )
      .eq("student_user_id", appUser.id)
      .order("last_message_at", {
        ascending: false,
        nullsFirst: false,
      })
      .order("created_at", { ascending: false })
      .limit(6),
    resolveStudentUsageSnapshot({
      studentUserId: appUser.id,
    }),
  ]);

  if (studentProfileResult.error) {
    throw toServiceError(
      "Unable to load the student approval profile.",
      studentProfileResult.error,
    );
  }

  if (parentLinksResult.error) {
    throw toServiceError(
      "Unable to load parent link status.",
      parentLinksResult.error,
    );
  }

  if (tutorLinksResult.error) {
    throw toServiceError(
      "Unable to load tutor link status.",
      tutorLinksResult.error,
    );
  }

  if (conversationsResult.error) {
    throw toServiceError(
      "Unable to load recent sessions.",
      conversationsResult.error,
    );
  }

  const recentSessions = ((conversationsResult.data ?? []) as ConversationRow[]).map(
    (conversation): StudentDashboardConversation => ({
      id: conversation.id,
      title: conversation.title,
      subjectTag: conversation.subject_tag,
      status: conversation.status,
      gradedHomework: conversation.graded_homework,
      lastMessageAt: conversation.last_message_at,
      completedAt: conversation.completed_at,
      createdAt: conversation.created_at,
    }),
  );

  const support: StudentDashboardSupportSnapshot = {
    accountStatus: appUser.account_status,
    isUnder13: appUser.is_under_13,
    parentalApprovalRequired:
      studentProfileResult.data?.parental_approval_required ?? appUser.is_under_13,
    parentApprovedAt: studentProfileResult.data?.parent_approved_at ?? null,
    parentLinks: countLinks((parentLinksResult.data ?? []) as LinkRow[]),
    tutorLinks: countLinks((tutorLinksResult.data ?? []) as LinkRow[]),
  };

  const startState = buildStartState({
    appUser,
    support,
    usage,
  });

  return {
    appUser: {
      id: appUser.id,
      display_name: appUser.display_name,
      preferred_ui_language: appUser.preferred_ui_language,
      account_status: appUser.account_status,
      is_under_13: appUser.is_under_13,
    },
    startState,
    canStartHomework: startState === "ready",
    recentSessions,
    subjectRollup: buildSubjectRollup(recentSessions),
    support,
    usage,
  };
}
