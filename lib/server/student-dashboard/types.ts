import "server-only";

import type {
  AccountStatus,
  AppUserRecord,
} from "@/lib/server/auth/types";
import type { StudentUsageSnapshot } from "@/lib/server/usage/types";

export type LinkStatus = "pending" | "active" | "revoked";
export type ConversationStatus = "active" | "completed" | "archived";

export type StudentDashboardConversation = {
  id: string;
  title: string;
  subjectTag: string;
  status: ConversationStatus;
  gradedHomework: boolean;
  lastMessageAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type StudentDashboardSubjectRollup = {
  subjectTag: string;
  count: number;
};

export type StudentDashboardLinkCounts = {
  active: number;
  pending: number;
  revoked: number;
};

export type StudentDashboardSupportSnapshot = {
  accountStatus: AccountStatus;
  isUnder13: boolean;
  parentalApprovalRequired: boolean;
  parentApprovedAt: string | null;
  parentLinks: StudentDashboardLinkCounts;
  tutorLinks: StudentDashboardLinkCounts;
};

export type StudentDashboardUsageSnapshot = StudentUsageSnapshot;

export type StudentDashboardStartState =
  | "ready"
  | "pending_parent_approval"
  | "deletion_requested"
  | "suspended"
  | "quota_blocked";

export type StudentDashboardSnapshot = {
  appUser: Pick<
    AppUserRecord,
    | "id"
    | "display_name"
    | "preferred_ui_language"
    | "account_status"
    | "is_under_13"
  >;
  startState: StudentDashboardStartState;
  canStartHomework: boolean;
  recentSessions: StudentDashboardConversation[];
  subjectRollup: StudentDashboardSubjectRollup[];
  support: StudentDashboardSupportSnapshot;
  usage: StudentDashboardUsageSnapshot;
};
