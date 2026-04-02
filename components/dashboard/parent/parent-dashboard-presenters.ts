import {
  formatDateLabel,
  getConversationStatusLabel,
} from "@/components/dashboard/student/student-dashboard-presenters";
import {
  getDashboardAgeBandLabel,
  getParentDashboardCopy,
} from "@/lib/i18n/dashboard-copy";
import type { AppUserRecord, UiLanguageCode } from "@/lib/server/auth/types";
import type {
  OversightConversationPreview,
  ParentDashboardSnapshot,
} from "@/lib/server/oversight/types";

type ParentLearnerStatusTone = "neutral" | "accent" | "warning";

export type ParentDashboardLearnerCardModel = {
  id: string;
  displayName: string;
  detailHref: string;
  latestReviewHref: string | null;
  latestSessionTitle: string | null;
  latestSessionSummary: string | null;
  latestNextStepRecommendation: string | null;
  lastActivityLabel: string;
  lastActivityDateLabel: string | null;
  attentionLabel: string;
  attentionTone: ParentLearnerStatusTone;
  usageLabel: string;
  assignmentsLabel: string;
  weeklyCompletedLabel: string;
  ageBandLabel: string | null;
  under13Label: string | null;
  weaknessTags: string[];
  activeAssignmentsCount: number;
  sortKey: number;
};

export type ParentDashboardRecentSessionModel = {
  id: string;
  studentDisplayName: string;
  studentHref: string;
  title: string;
  subjectTag: string;
  statusLabel: string;
  lastActivityLabel: string | null;
  summaryText: string | null;
  nextStepRecommendation: string | null;
  weaknessTags: string[];
  reviewHref: string;
};

export type ParentDashboardWeeklyModel = {
  studentUserId: string;
  studentDisplayName: string;
  studentHref: string;
  completedSessionsLabel: string;
  latestSummaryText: string | null;
  nextStepRecommendation: string | null;
};

export type ParentDashboardPendingApprovalModel = {
  id: string;
  studentDisplayName: string;
  relationshipLabel: string | null;
  ageBandLabel: string | null;
  under13Label: string | null;
  createdAtLabel: string | null;
  expiresAtLabel: string | null;
};

export type ParentDashboardViewModel = {
  learnerCount: number;
  activeAssignmentsCount: number;
  weeklyCompletedCount: number;
  attentionCount: number;
  learners: ParentDashboardLearnerCardModel[];
  focusLearner: ParentDashboardLearnerCardModel | null;
  pendingApprovals: ParentDashboardPendingApprovalModel[];
  recentSessions: ParentDashboardRecentSessionModel[];
  weeklyEntries: ParentDashboardWeeklyModel[];
};

function buildRecentSessionMap(
  sessions: OversightConversationPreview[],
) {
  return sessions.reduce<Map<string, OversightConversationPreview[]>>((map, session) => {
    const existing = map.get(session.studentUserId) ?? [];
    existing.push(session);
    map.set(session.studentUserId, existing);
    return map;
  }, new Map<string, OversightConversationPreview[]>());
}

function getRelativeActivityLabel(
  value: string | null,
  languageCode: UiLanguageCode,
) {
  const copy = getParentDashboardCopy(languageCode);

  if (!value) {
    return copy.learners.activity.none;
  }

  const now = new Date();
  const activityDate = new Date(value);
  const diffMs = now.getTime() - activityDate.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) {
    return copy.learners.activity.today;
  }

  if (diffDays === 1) {
    return copy.learners.activity.yesterday;
  }

  if (diffDays <= 6) {
    return copy.learners.activity.thisWeek;
  }

  return copy.learners.activity.earlier;
}

function getLearnerAttentionState(input: {
  accessState: ParentDashboardSnapshot["linkedStudents"][number]["usage"]["quota"]["accessState"];
  activeAssignmentsCount: number;
  lastActivityAt: string | null;
  weeklyCompletedCount: number;
  languageCode: UiLanguageCode;
}) {
  const copy = getParentDashboardCopy(input.languageCode);

  if (input.accessState === "blocked") {
    return {
      label: copy.learners.status.blocked,
      tone: "warning" as const,
      priority: 400,
    };
  }

  if (input.accessState === "warning") {
    return {
      label: copy.learners.status.warning,
      tone: "warning" as const,
      priority: 320,
    };
  }

  if (input.activeAssignmentsCount > 0) {
    return {
      label: copy.learners.status.inProgress,
      tone: "accent" as const,
      priority: 240,
    };
  }

  const relativeActivity = getRelativeActivityLabel(
    input.lastActivityAt,
    input.languageCode,
  );

  if (relativeActivity === copy.learners.activity.today) {
    return {
      label: copy.learners.status.activeToday,
      tone: "accent" as const,
      priority: 180,
    };
  }

  if (input.weeklyCompletedCount > 0) {
    return {
      label: copy.learners.status.activeThisWeek,
      tone: "accent" as const,
      priority: 120,
    };
  }

  return {
    label: copy.learners.status.quiet,
    tone: "neutral" as const,
    priority: 40,
  };
}

export function buildParentDashboardViewModel(
  snapshot: ParentDashboardSnapshot,
  languageCode: UiLanguageCode,
): ParentDashboardViewModel {
  const copy = getParentDashboardCopy(languageCode);
  const recentSessionsByStudent = buildRecentSessionMap(snapshot.recentSessions);
  const weeklyByStudent = new Map(
    snapshot.weeklySummary.studentSnapshots.map((entry) => [
      entry.studentUserId,
      entry,
    ]),
  );

  const learners = snapshot.linkedStudents
    .map((student): ParentDashboardLearnerCardModel => {
      const recentSessions = recentSessionsByStudent.get(student.id) ?? [];
      const latestSession = recentSessions[0] ?? null;
      const weeklyEntry = weeklyByStudent.get(student.id) ?? null;
      const weaknessTags = Array.from(
        new Set(recentSessions.flatMap((session) => session.weaknessTags)),
      ).slice(0, 3);
      const activeAssignmentsCount = recentSessions.filter(
        (session) => session.status === "active",
      ).length;
      const weeklyCompletedCount = weeklyEntry?.completedSessionCount ?? 0;
      const lastActivityAt =
        latestSession?.lastMessageAt ??
        latestSession?.completedAt ??
        latestSession?.createdAt ??
        null;
      const attention = getLearnerAttentionState({
        accessState: student.usage.quota.accessState,
        activeAssignmentsCount,
        lastActivityAt,
        weeklyCompletedCount,
        languageCode,
      });
      const lastActivityDateLabel = formatDateLabel(lastActivityAt, languageCode);

      return {
        id: student.id,
        displayName: student.displayName,
        detailHref: `/app/students/${student.id}`,
        latestReviewHref: latestSession ? `/app/review/${latestSession.id}` : null,
        latestSessionTitle: latestSession?.title ?? null,
        latestSessionSummary:
          latestSession?.summaryText ??
          weeklyEntry?.latestSummaryText ??
          null,
        latestNextStepRecommendation:
          latestSession?.nextStepRecommendation ??
          weeklyEntry?.nextStepRecommendation ??
          null,
        lastActivityLabel: getRelativeActivityLabel(lastActivityAt, languageCode),
        lastActivityDateLabel,
        attentionLabel: attention.label,
        attentionTone: attention.tone,
        usageLabel: copy.learners.sessionsUsage(
          student.usage.sessionsCount,
          student.usage.quota.sessions.limit,
        ),
        activeAssignmentsCount,
        assignmentsLabel:
          activeAssignmentsCount > 0
            ? copy.learners.openAssignments(activeAssignmentsCount)
            : copy.learners.noOpenAssignments,
        weeklyCompletedLabel: copy.learners.weeklyCompleted(weeklyCompletedCount),
        ageBandLabel: getDashboardAgeBandLabel(student.ageBand, languageCode),
        under13Label: student.isUnder13 ? copy.learners.under13 : null,
        weaknessTags,
        sortKey: attention.priority,
      };
    })
    .sort((left, right) => {
      if (right.sortKey !== left.sortKey) {
        return right.sortKey - left.sortKey;
      }

      return left.displayName.localeCompare(right.displayName);
    });

  return {
    learnerCount: snapshot.linkedStudents.length,
    activeAssignmentsCount: learners.reduce(
      (total, learner) => total + learner.activeAssignmentsCount,
      0,
    ),
    weeklyCompletedCount: snapshot.weeklySummary.completedSessionCount,
    attentionCount: learners.filter((learner) => learner.attentionTone === "warning")
      .length,
    learners,
    focusLearner: learners[0] ?? null,
    pendingApprovals: snapshot.pendingApprovals.map((approval) => ({
      id: approval.id,
      studentDisplayName: approval.student.displayName,
      relationshipLabel: approval.relationshipLabel,
      ageBandLabel: getDashboardAgeBandLabel(
        approval.student.ageBand,
        languageCode,
      ),
      under13Label: approval.student.isUnder13 ? copy.learners.under13 : null,
      createdAtLabel: formatDateLabel(approval.createdAt, languageCode),
      expiresAtLabel: formatDateLabel(approval.expiresAt, languageCode),
    })),
    recentSessions: snapshot.recentSessions.map((session) => ({
      id: session.id,
      studentDisplayName: session.studentDisplayName,
      studentHref: `/app/students/${session.studentUserId}`,
      title: session.title,
      subjectTag: session.subjectTag,
      statusLabel: getConversationStatusLabel(session.status, languageCode),
      lastActivityLabel: formatDateLabel(
        session.lastMessageAt ?? session.completedAt ?? session.createdAt,
        languageCode,
      ),
      summaryText: session.summaryText,
      nextStepRecommendation: session.nextStepRecommendation,
      weaknessTags: session.weaknessTags.slice(0, 3),
      reviewHref: `/app/review/${session.id}`,
    })),
    weeklyEntries: snapshot.weeklySummary.studentSnapshots.map((entry) => ({
      studentUserId: entry.studentUserId,
      studentDisplayName: entry.studentDisplayName,
      studentHref: `/app/students/${entry.studentUserId}`,
      completedSessionsLabel: copy.activity.weeklySessions(
        entry.completedSessionCount,
      ),
      latestSummaryText: entry.latestSummaryText,
      nextStepRecommendation: entry.nextStepRecommendation,
    })),
  };
}

export type ParentDashboardAccountModel = {
  displayName: string;
  email: string | null;
  accountStatusLabel: string;
};

export function buildParentDashboardAccountModel(input: {
  appUser: AppUserRecord;
  email: string | null;
  languageCode: UiLanguageCode;
}): ParentDashboardAccountModel {
  const statusLabels = {
    active: "active",
    pending_parent_approval: "pending_parent_approval",
    suspended: "suspended",
    deletion_requested: "deletion_requested",
  } as const;
  const copy = getParentDashboardCopy(input.languageCode);
  const localizedStatus =
    copy.account.statuses[statusLabels[input.appUser.account_status]];

  return {
    displayName: input.appUser.display_name,
    email: input.email,
    accountStatusLabel: localizedStatus,
  };
}
