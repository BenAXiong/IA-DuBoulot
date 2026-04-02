import "server-only";

import type {
  AppUserRecord,
  AppUserRole,
  AuthenticatedUserContext,
} from "@/lib/server/auth/types";

export const INVITATION_KINDS = [
  "parent_approval",
  "parent_link",
  "tutor_link",
] as const;
export const INVITATION_TARGET_ROLES = ["parent", "tutor"] as const;
export const INVITATION_STATUSES = [
  "pending",
  "accepted",
  "revoked",
  "expired",
] as const;

export type InvitationKind = (typeof INVITATION_KINDS)[number];
export type InvitationTargetRole = (typeof INVITATION_TARGET_ROLES)[number];
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export type LinkInvitationRecord = {
  id: string;
  invitation_kind: InvitationKind;
  invitation_status: InvitationStatus;
  student_user_id: string;
  inviter_user_id: string;
  target_role: InvitationTargetRole;
  target_email: string;
  relationship_label: string | null;
  token_hash: string;
  accepted_by_user_id: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type InvitationStudentRecord = Pick<
  AppUserRecord,
  "id" | "role" | "account_status" | "display_name" | "is_under_13"
>;

export type InvitationInviterRecord = Pick<
  AppUserRecord,
  "id" | "role" | "display_name"
>;

export type InvitationLandingRecord = {
  invitation: Omit<LinkInvitationRecord, "token_hash" | "target_email">;
  targetEmailMasked: string;
  student: InvitationStudentRecord;
  inviter: InvitationInviterRecord | null;
  resolvedStatus: InvitationStatus;
};

export type CreateParentApprovalRequestInput = {
  parentEmail: string;
  relationshipLabel: string | null;
};

export type CreateTutorInviteInput = {
  studentUserId: string | null;
  tutorEmail: string;
};

export type CreatedInvitationResult = {
  invitation: Omit<LinkInvitationRecord, "token_hash">;
  inviteUrl: string;
};

export type AcceptInvitationResult = {
  invitation: Omit<LinkInvitationRecord, "token_hash">;
  student: InvitationStudentRecord;
  linkStatus: "active" | "pending";
};

export type InvitationViewerState =
  | "unauthenticated"
  | "needs_onboarding"
  | "role_mismatch"
  | "ready"
  | "already_accepted"
  | "unavailable";

export type InvitationPageState = {
  landing: InvitationLandingRecord | null;
  viewerState: InvitationViewerState;
  context: AuthenticatedUserContext | null;
  appUser: AppUserRecord | null;
};

export type CreateInvitationBaseInput = {
  context: AuthenticatedUserContext;
  requestId: string;
  route: string;
};

export type InvitationAcceptanceInput = {
  context: AuthenticatedUserContext;
  requestId: string;
  route: string;
  token?: string;
  invitationId?: string;
  expectedKinds?: InvitationKind[];
};

export type InvitationCreateAuditContext = {
  actorUserId: string;
  actorRole: AppUserRole;
  studentUserId: string;
  requestId: string;
  route: string;
};
