import "server-only";

import type {
  AccountStatus,
  AgeBand,
  UiLanguageCode,
} from "@/lib/server/auth/types";
import type { BillingSnapshot } from "@/lib/server/billing/types";
import type {
  ConversationDetail,
  ConversationRecord,
} from "@/lib/server/conversations/types";
import type { StudentMemorySnapshot } from "@/lib/server/memory/types";
import type { StudentUsageSnapshot } from "@/lib/server/usage/types";

export type OversightStudentSnapshot = {
  id: string;
  displayName: string;
  preferredUiLanguage: UiLanguageCode;
  ageBand: AgeBand | null;
  isUnder13: boolean;
  accountStatus: AccountStatus;
};

export type OversightConversationPreview = {
  id: string;
  studentUserId: string;
  studentDisplayName: string;
  title: string;
  subjectTag: string;
  status: ConversationRecord["status"];
  gradedHomework: boolean;
  lastMessageAt: string | null;
  completedAt: string | null;
  createdAt: string;
  summaryText: string | null;
  nextStepRecommendation: string | null;
  weaknessTags: string[];
  summaryLanguage: UiLanguageCode | null;
  availableSummaryLanguages: UiLanguageCode[];
};

export type ParentBillingSnapshot = BillingSnapshot;

export type ParentLinkedStudentSnapshot = OversightStudentSnapshot & {
  usage: StudentUsageSnapshot;
};

export type ParentWeeklyStudentSnapshot = {
  studentUserId: string;
  studentDisplayName: string;
  completedSessionCount: number;
  latestSummaryText: string | null;
  nextStepRecommendation: string | null;
};

export type ParentWeeklySummary = {
  windowStart: string;
  windowEnd: string;
  completedSessionCount: number;
  reviewedStudentCount: number;
  studentSnapshots: ParentWeeklyStudentSnapshot[];
};

export type ParentDashboardSnapshot = {
  linkedStudents: ParentLinkedStudentSnapshot[];
  recentSessions: OversightConversationPreview[];
  weeklySummary: ParentWeeklySummary;
  billing: ParentBillingSnapshot;
};

export type ParentStudentDetail = {
  student: ParentLinkedStudentSnapshot;
  relationshipLabel: string | null;
  recentSessions: OversightConversationPreview[];
  weeklySummary: ParentWeeklySummary;
  memory: StudentMemorySnapshot;
};

export type ParentConversationSummaryVariant = {
  languageCode: UiLanguageCode;
  summaryText: string;
  nextStepRecommendation: string | null;
  weaknessTags: string[];
  generatedModelName: string | null;
  updatedAt: string;
};

export type ParentConversationReview = {
  student: OversightStudentSnapshot;
  detail: ConversationDetail;
  summaryVariants: ParentConversationSummaryVariant[];
  billing: ParentBillingSnapshot;
};

export type TutorNoteRecord = {
  id: string;
  tutorUserId: string;
  studentUserId: string;
  conversationId: string | null;
  noteText: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TutorDashboardStudentSnapshot = OversightStudentSnapshot & {
  pinnedNoteCount: number;
  recentSessionCount: number;
  topWeaknessTags: string[];
};

export type TutorDashboardSnapshot = {
  linkedStudents: TutorDashboardStudentSnapshot[];
  recentSessions: OversightConversationPreview[];
};

export type TutorStudentInsight = {
  topWeaknessTags: string[];
  recommendedNextTopics: string[];
};

export type TutorStudentDetail = {
  student: TutorDashboardStudentSnapshot;
  recentSessions: OversightConversationPreview[];
  notes: TutorNoteRecord[];
  insight: TutorStudentInsight;
};

export type TutorConversationReview = {
  student: TutorDashboardStudentSnapshot;
  detail: ConversationDetail;
  notes: TutorNoteRecord[];
  insight: TutorStudentInsight;
};

export type AdminSensitiveAccessEvent = {
  id: string;
  createdAt: string;
  actorUserId: string | null;
  actorRole: string | null;
  actorDisplayName: string | null;
  action: string;
  targetTable: string;
  targetId: string | null;
  studentUserId: string | null;
  studentDisplayName: string | null;
  conversationId: string | null;
  metadata: Record<string, unknown>;
};

export type AdminAccessAuditSnapshot = {
  events: AdminSensitiveAccessEvent[];
};
