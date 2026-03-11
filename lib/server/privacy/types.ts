import "server-only";

import type { AppUserRecord, AppUserRole } from "@/lib/server/auth/types";
import type { BillingSnapshot } from "@/lib/server/billing/types";

export type PrivacyDeletionScope = "self" | "linked_child";

export type PrivacyDeletionTargetSnapshot = {
  targetUserId: string;
  displayName: string;
  role: AppUserRole;
  isUnder13: boolean;
  requestedAt: string | null;
  purgeTargetDate: string | null;
  canRequest: boolean;
  blockedReason: string | null;
  linkedStudentCount: number;
  hasSubscription: boolean;
};

export type PrivacySettingsSnapshot = {
  billing: BillingSnapshot | null;
  selfDeletion: PrivacyDeletionTargetSnapshot | null;
  linkedStudentDeletionTargets: PrivacyDeletionTargetSnapshot[];
};

export type PrivacyDeletionRequestResult = {
  targetUserId: string;
  targetDisplayName: string;
  targetRole: AppUserRole;
  requestedAt: string;
  purgeTargetDate: string;
  scope: PrivacyDeletionScope;
  status: AppUserRecord["account_status"];
};
