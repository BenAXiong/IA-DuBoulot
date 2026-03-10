import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";
import { recordAuditEvent } from "@/lib/server/audit/audit-service";
import { logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import {
  getAuthenticatedUserContext,
  requireAppUserContext,
  requireAppUserRole,
} from "@/lib/server/auth/authorization";
import {
  loadAppUserById,
  syncAuthUserMetadataFromAppUser,
} from "@/lib/server/auth/account-service";
import { AppError } from "@/lib/server/errors/app-error";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AcceptInvitationResult,
  CreateParentApprovalRequestInput,
  CreateTutorInviteInput,
  CreatedInvitationResult,
  InvitationAcceptanceInput,
  InvitationInviterRecord,
  InvitationKind,
  InvitationLandingRecord,
  InvitationPageState,
  InvitationStatus,
  InvitationStudentRecord,
  InvitationTargetRole,
  LinkInvitationRecord,
} from "@/lib/server/links/types";

const INVITATION_SELECT =
  "id, invitation_kind, invitation_status, student_user_id, inviter_user_id, target_role, target_email, relationship_label, token_hash, accepted_by_user_id, expires_at, accepted_at, revoked_at, metadata, created_at, updated_at";

function requireBodyObject<T>(body: unknown): T {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError({
      code: "bad_request",
      message: "Expected a JSON object body.",
      status: 400,
    });
  }

  return body as T;
}

function normalizeEmail(email: string | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

function parseEmail(value: string | undefined, fieldName: "parentEmail" | "tutorEmail") {
  const normalized = normalizeEmail(value);

  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        [fieldName]: "A valid email address is required.",
      },
    });
  }

  return normalized;
}

function parseRelationshipLabel(value: string | null | undefined) {
  if (value == null || value.trim() === "") {
    return null;
  }

  const normalized = value.trim();

  if (normalized.length > 80) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        relationshipLabel: "Relationship label must be 80 characters or fewer.",
      },
    });
  }

  return normalized;
}

function parseStudentUserId(value: string | null | undefined) {
  if (value == null || value === "") {
    return null;
  }

  if (!/^[0-9a-fA-F-]{36}$/.test(value)) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        studentUserId: "Student user ID must be a UUID.",
      },
    });
  }

  return value;
}

function parseInvitationToken(token: string) {
  const normalized = token.trim();

  if (!normalized || normalized.length < 16 || normalized.length > 256) {
    throw new AppError({
      code: "validation_error",
      message: "Invitation token is invalid.",
      status: 400,
      fieldErrors: {
        token: "Invitation token is invalid.",
      },
    });
  }

  return normalized;
}

function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createInvitationToken() {
  return randomBytes(24).toString("base64url");
}

function stripInvitationTokenHash(invitation: LinkInvitationRecord) {
  const { token_hash: tokenHash, ...safeInvitation } = invitation;
  void tokenHash;
  return safeInvitation;
}

function maskEmail(email: string) {
  const [localPart = "", domain = ""] = email.split("@");
  const maskedLocal =
    localPart.length <= 2
      ? `${localPart[0] ?? "*"}*`
      : `${localPart.slice(0, 2)}***`;

  return domain ? `${maskedLocal}@${domain}` : maskedLocal;
}

function resolveInvitationStatus(invitation: LinkInvitationRecord): InvitationStatus {
  if (invitation.invitation_status !== "pending") {
    return invitation.invitation_status;
  }

  const expiresAt = new Date(invitation.expires_at).getTime();

  if (!Number.isNaN(expiresAt) && expiresAt <= Date.now()) {
    return "expired";
  }

  return "pending";
}

function buildInvitationUrl(token: string) {
  return new URL(`/invite/${token}`, env.NEXT_PUBLIC_APP_URL).toString();
}

async function loadInvitationByToken(token: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("account_link_invitations")
    .select(INVITATION_SELECT)
    .eq("token_hash", hashInvitationToken(token))
    .maybeSingle<LinkInvitationRecord>();

  if (error) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to load the invitation.",
      status: 503,
      retryable: true,
      cause: error,
    });
  }

  return data;
}

async function loadStudentRecord(studentUserId: string): Promise<InvitationStudentRecord> {
  const student = await loadAppUserById(studentUserId);

  if (student.role !== "student") {
    throw new AppError({
      code: "conflict",
      message: "The invitation does not reference a student account.",
      status: 409,
    });
  }

  return {
    id: student.id,
    role: student.role,
    account_status: student.account_status,
    display_name: student.display_name,
    is_under_13: student.is_under_13,
  };
}

async function loadInviterRecord(inviterUserId: string): Promise<InvitationInviterRecord | null> {
  try {
    const inviter = await loadAppUserById(inviterUserId);
    return {
      id: inviter.id,
      role: inviter.role,
      display_name: inviter.display_name,
    };
  } catch {
    return null;
  }
}

async function markInvitationStatus(input: {
  invitationId: string;
  status: Exclude<InvitationStatus, "pending">;
  acceptedByUserId?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const patch =
    input.status === "accepted"
      ? {
          invitation_status: "accepted" as const,
          accepted_at: new Date().toISOString(),
          accepted_by_user_id: input.acceptedByUserId ?? null,
        }
      : {
          invitation_status: input.status,
          revoked_at: new Date().toISOString(),
        };

  const { error } = await supabase
    .from("account_link_invitations")
    .update(patch)
    .eq("id", input.invitationId);

  if (error) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to update the invitation status.",
      status: 503,
      retryable: true,
      cause: error,
    });
  }
}

async function revokeExistingPendingInvitations(input: {
  studentUserId: string;
  targetEmail: string;
  invitationKind: InvitationKind;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("account_link_invitations")
    .update({
      invitation_status: "revoked",
      revoked_at: new Date().toISOString(),
    })
    .eq("student_user_id", input.studentUserId)
    .eq("target_email", input.targetEmail)
    .eq("invitation_kind", input.invitationKind)
    .eq("invitation_status", "pending");

  if (error) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to rotate the existing invitation.",
      status: 503,
      retryable: true,
      cause: error,
    });
  }
}

async function createInvitation(input: {
  invitationKind: InvitationKind;
  targetRole: InvitationTargetRole;
  studentUserId: string;
  inviterUserId: string;
  targetEmail: string;
  relationshipLabel: string | null;
  metadata: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  const token = createInvitationToken();
  const invitationPayload = {
    invitation_kind: input.invitationKind,
    invitation_status: "pending" as const,
    student_user_id: input.studentUserId,
    inviter_user_id: input.inviterUserId,
    target_role: input.targetRole,
    target_email: input.targetEmail,
    relationship_label: input.relationshipLabel,
    token_hash: hashInvitationToken(token),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: input.metadata,
  };

  const { data, error } = await supabase
    .from("account_link_invitations")
    .insert(invitationPayload)
    .select(INVITATION_SELECT)
    .single<LinkInvitationRecord>();

  if (error) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to create the invitation.",
      status: 503,
      retryable: true,
      cause: error,
    });
  }

  return {
    invitation: stripInvitationTokenHash(data),
    inviteUrl: buildInvitationUrl(token),
  };
}

async function countActiveParentLinks(studentUserId: string) {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("parent_student_links")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("student_user_id", studentUserId)
    .eq("link_status", "active");

  if (error) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to inspect parent link state.",
      status: 503,
      retryable: true,
      cause: error,
    });
  }

  return count ?? 0;
}

async function requireActiveParentLink(parentUserId: string, studentUserId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("parent_student_links")
    .select("id")
    .eq("parent_user_id", parentUserId)
    .eq("student_user_id", studentUserId)
    .eq("link_status", "active")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to validate the parent link.",
      status: 503,
      retryable: true,
      cause: error,
    });
  }

  if (!data) {
    throw new AppError({
      code: "forbidden",
      message: "An active parent link is required for this student.",
      status: 403,
    });
  }
}

async function upsertParentStudentLink(input: {
  parentUserId: string;
  studentUserId: string;
  relationshipLabel: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const approvedAt = new Date().toISOString();
  const { error } = await supabase.from("parent_student_links").upsert(
    {
      parent_user_id: input.parentUserId,
      student_user_id: input.studentUserId,
      relationship_label: input.relationshipLabel,
      link_status: "active",
      approved_at: approvedAt,
      revoked_at: null,
    },
    {
      onConflict: "parent_user_id,student_user_id",
    },
  );

  if (error) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to activate the parent link.",
      status: 503,
      retryable: true,
      cause: error,
    });
  }

  return approvedAt;
}

async function activateStudentAfterParentApproval(studentUserId: string, requestId: string, route: string) {
  const supabase = createSupabaseAdminClient();
  const approvedAt = new Date().toISOString();

  const { error: profileError } = await supabase
    .from("student_profiles")
    .update({
      parental_approval_required: true,
      parent_approved_at: approvedAt,
    })
    .eq("student_user_id", studentUserId);

  if (profileError) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to update the student approval state.",
      status: 503,
      retryable: true,
      cause: profileError,
    });
  }

  const { error: userError } = await supabase
    .from("users")
    .update({
      account_status: "active",
    })
    .eq("id", studentUserId);

  if (userError) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to activate the student account.",
      status: 503,
      retryable: true,
      cause: userError,
    });
  }

  const student = await loadAppUserById(studentUserId);

  await syncAuthUserMetadataFromAppUser({
    authUserId: studentUserId,
    appUser: student,
    requestId,
    route,
  });

  return {
    approvedAt,
    student,
  };
}

async function upsertTutorStudentLink(input: {
  tutorUserId: string;
  studentUserId: string;
  approvedByParentUserId: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const approvedAt = new Date().toISOString();
  const { error } = await supabase.from("tutor_student_links").upsert(
    {
      tutor_user_id: input.tutorUserId,
      student_user_id: input.studentUserId,
      approved_by_parent_user_id: input.approvedByParentUserId,
      link_status: "active",
      approved_at: approvedAt,
      revoked_at: null,
    },
    {
      onConflict: "tutor_user_id,student_user_id",
    },
  );

  if (error) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to activate the tutor link.",
      status: 503,
      retryable: true,
      cause: error,
    });
  }

  return approvedAt;
}

async function resolveTutorApprovalContext(input: {
  student: InvitationStudentRecord;
  inviter: InvitationInviterRecord | null;
}) {
  if (!input.inviter) {
    throw new AppError({
      code: "conflict",
      message: "The invitation is missing inviter context.",
      status: 409,
    });
  }

  if (input.student.is_under_13) {
    if (input.inviter.role !== "parent") {
      throw new AppError({
        code: "forbidden",
        message: "Under-13 tutor access requires a parent-originated invitation.",
        status: 403,
      });
    }

    await requireActiveParentLink(input.inviter.id, input.student.id);

    return {
      linkStatus: "active" as const,
      approvedByParentUserId: input.inviter.id,
    };
  }

  if (input.inviter.role === "student" && input.inviter.id === input.student.id) {
    return {
      linkStatus: "active" as const,
      approvedByParentUserId: null,
    };
  }

  if (input.inviter.role === "parent") {
    await requireActiveParentLink(input.inviter.id, input.student.id);

    return {
      linkStatus: "active" as const,
      approvedByParentUserId: input.inviter.id,
    };
  }

  throw new AppError({
    code: "forbidden",
    message: "The invitation origin is not allowed to activate a tutor link.",
    status: 403,
  });
}

function invitationKindMatchesRole(input: {
  invitationKind: InvitationKind;
  targetRole: InvitationTargetRole;
}) {
  if (
    (input.invitationKind === "parent_approval" ||
      input.invitationKind === "parent_link") &&
    input.targetRole === "parent"
  ) {
    return true;
  }

  return input.invitationKind === "tutor_link" && input.targetRole === "tutor";
}

async function loadInvitationLandingCore(token: string): Promise<InvitationLandingRecord | null> {
  const invitation = await loadInvitationByToken(token);

  if (!invitation) {
    return null;
  }

  const resolvedStatus = resolveInvitationStatus(invitation);
  const [student, inviter] = await Promise.all([
    loadStudentRecord(invitation.student_user_id),
    loadInviterRecord(invitation.inviter_user_id),
  ]);

  return {
    invitation: stripInvitationTokenHash(invitation),
    targetEmailMasked: maskEmail(invitation.target_email),
    student,
    inviter,
    resolvedStatus,
  };
}

export async function parseCreateParentApprovalRequestInput(
  request: Request,
): Promise<CreateParentApprovalRequestInput> {
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

  const payload = requireBodyObject<{
    parentEmail?: string;
    relationshipLabel?: string | null;
  }>(body);

  return {
    parentEmail: parseEmail(payload.parentEmail, "parentEmail"),
    relationshipLabel: parseRelationshipLabel(payload.relationshipLabel),
  };
}

export async function parseCreateTutorInviteInput(
  request: Request,
): Promise<CreateTutorInviteInput> {
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

  const payload = requireBodyObject<{
    studentUserId?: string | null;
    tutorEmail?: string;
  }>(body);

  return {
    studentUserId: parseStudentUserId(payload.studentUserId),
    tutorEmail: parseEmail(payload.tutorEmail, "tutorEmail"),
  };
}

export async function parseInvitationTokenInput(request: Request) {
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

  const payload = requireBodyObject<{ token?: string }>(body);

  return {
    token: parseInvitationToken(payload.token ?? ""),
  };
}

export async function createParentApprovalRequest(input: {
  context: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUserContext>>>;
  requestId: string;
  route: string;
  invitation: CreateParentApprovalRequestInput;
}): Promise<CreatedInvitationResult> {
  const appUser = requireAppUserContext(input.context);
  requireAppUserRole(appUser, ["student"]);

  if (!appUser.is_under_13) {
    throw new AppError({
      code: "forbidden",
      message: "Parent approval requests are only available for under-13 student accounts.",
      status: 403,
    });
  }

  if (normalizeEmail(input.context.email ?? "") === input.invitation.parentEmail) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        parentEmail: "The parent email must be different from the student email.",
      },
    });
  }

  const activeParentLinkCount = await countActiveParentLinks(appUser.id);

  if (activeParentLinkCount > 0 && appUser.account_status === "active") {
    throw new AppError({
      code: "conflict",
      message: "This student already has an active parent link.",
      status: 409,
    });
  }

  await revokeExistingPendingInvitations({
    studentUserId: appUser.id,
    targetEmail: input.invitation.parentEmail,
    invitationKind: "parent_approval",
  });

  const result = await createInvitation({
    invitationKind: "parent_approval",
    targetRole: "parent",
    studentUserId: appUser.id,
    inviterUserId: appUser.id,
    targetEmail: input.invitation.parentEmail,
    relationshipLabel: input.invitation.relationshipLabel,
    metadata: {
      student_account_status: appUser.account_status,
      student_is_under_13: appUser.is_under_13,
    },
  });

  logRuntimeInfo({
    message: "Created parent approval invitation",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: appUser.id,
    actorRole: appUser.role,
    targetStudentUserId: appUser.id,
    details: {
      invitationKind: "parent_approval",
      targetRole: "parent",
      targetEmailDomain: input.invitation.parentEmail.split("@")[1] ?? null,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: appUser.id,
      actorRole: appUser.role,
      action: "parent_approval_request_create",
      targetTable: "account_link_invitations",
      targetId: result.invitation.id,
      studentUserId: appUser.id,
      metadata: {
        request_id: input.requestId,
        route: input.route,
        invitation_kind: "parent_approval",
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block invite issuance.
  }

  return result;
}

export async function createTutorInvitation(input: {
  context: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUserContext>>>;
  requestId: string;
  route: string;
  invitation: CreateTutorInviteInput;
}): Promise<CreatedInvitationResult> {
  const actor = requireAppUserContext(input.context);

  let studentUserId = input.invitation.studentUserId;

  if (actor.role === "student") {
    studentUserId = actor.id;

    if (actor.is_under_13) {
      throw new AppError({
        code: "forbidden",
        message: "Under-13 students cannot directly invite tutors. A linked parent must initiate that flow.",
        status: 403,
      });
    }
  } else if (actor.role === "parent") {
    if (!studentUserId) {
      throw new AppError({
        code: "validation_error",
        message: "One or more fields are invalid.",
        status: 400,
        fieldErrors: {
          studentUserId: "Parent tutor invites must specify a student user ID.",
        },
      });
    }

    await requireActiveParentLink(actor.id, studentUserId);
  } else {
    throw new AppError({
      code: "forbidden",
      message: "Only students and linked parents can issue tutor invitations.",
      status: 403,
    });
  }

  if (!studentUserId) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        studentUserId: "A student user ID is required.",
      },
    });
  }

  const student = await loadStudentRecord(studentUserId);

  if (student.account_status !== "active") {
    throw new AppError({
      code: "conflict",
      message: "Tutor invitations require an active student account.",
      status: 409,
    });
  }

  if (student.is_under_13 && actor.role !== "parent") {
    throw new AppError({
      code: "forbidden",
      message: "Under-13 tutor access must be initiated by a linked parent.",
      status: 403,
    });
  }

  if (normalizeEmail(input.context.email ?? "") === input.invitation.tutorEmail) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        tutorEmail: "The tutor email must be different from the actor email.",
      },
    });
  }

  await revokeExistingPendingInvitations({
    studentUserId: student.id,
    targetEmail: input.invitation.tutorEmail,
    invitationKind: "tutor_link",
  });

  const result = await createInvitation({
    invitationKind: "tutor_link",
    targetRole: "tutor",
    studentUserId: student.id,
    inviterUserId: actor.id,
    targetEmail: input.invitation.tutorEmail,
    relationshipLabel: null,
    metadata: {
      student_is_under_13: student.is_under_13,
      inviter_role: actor.role,
    },
  });

  logRuntimeInfo({
    message: "Created tutor invitation",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: actor.id,
    actorRole: actor.role,
    targetStudentUserId: student.id,
    details: {
      invitationKind: "tutor_link",
      targetRole: "tutor",
      targetEmailDomain: input.invitation.tutorEmail.split("@")[1] ?? null,
      studentIsUnder13: student.is_under_13,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "tutor_invitation_create",
      targetTable: "account_link_invitations",
      targetId: result.invitation.id,
      studentUserId: student.id,
      metadata: {
        request_id: input.requestId,
        route: input.route,
        invitation_kind: "tutor_link",
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block invite issuance.
  }

  return result;
}

export async function acceptInvitation(
  input: InvitationAcceptanceInput,
): Promise<AcceptInvitationResult> {
  const token = parseInvitationToken(input.token);
  const appUser = requireAppUserContext(input.context);

  if (appUser.account_status !== "active") {
    throw new AppError({
      code: "forbidden",
      message: "Only active accounts can accept invitations.",
      status: 403,
    });
  }

  const invitation = await loadInvitationByToken(token);

  if (!invitation) {
    throw new AppError({
      code: "not_found",
      message: "Invitation not found.",
      status: 404,
    });
  }

  if (!invitationKindMatchesRole({
    invitationKind: invitation.invitation_kind,
    targetRole: invitation.target_role,
  })) {
    throw new AppError({
      code: "conflict",
      message: "Invitation role configuration is invalid.",
      status: 409,
    });
  }

  if (
    input.expectedKinds &&
    !input.expectedKinds.includes(invitation.invitation_kind)
  ) {
    throw new AppError({
      code: "conflict",
      message: "Invitation kind does not match this route.",
      status: 409,
    });
  }

  const resolvedStatus = resolveInvitationStatus(invitation);

  if (resolvedStatus === "expired") {
    await markInvitationStatus({
      invitationId: invitation.id,
      status: "expired",
    });

    throw new AppError({
      code: "conflict",
      message: "Invitation has expired.",
      status: 409,
    });
  }

  if (resolvedStatus === "revoked") {
    throw new AppError({
      code: "conflict",
      message: "Invitation is no longer active.",
      status: 409,
    });
  }

  if (resolvedStatus === "accepted") {
    throw new AppError({
      code: "conflict",
      message: "Invitation has already been accepted.",
      status: 409,
    });
  }

  if (appUser.role !== invitation.target_role) {
    throw new AppError({
      code: "forbidden",
      message: "This invitation is for a different account role.",
      status: 403,
    });
  }

  if (normalizeEmail(input.context.email ?? "") !== invitation.target_email) {
    throw new AppError({
      code: "conflict",
      message: "The signed-in email does not match the invitation target.",
      status: 409,
      fieldErrors: {
        email: "Sign in with the invited email address to accept this invitation.",
      },
    });
  }

  const student = await loadStudentRecord(invitation.student_user_id);
  const inviter = await loadInviterRecord(invitation.inviter_user_id);
  let linkStatus: "active" | "pending" = "active";

  if (
    invitation.invitation_kind === "parent_approval" ||
    invitation.invitation_kind === "parent_link"
  ) {
    await upsertParentStudentLink({
      parentUserId: appUser.id,
      studentUserId: student.id,
      relationshipLabel: invitation.relationship_label,
    });

    await activateStudentAfterParentApproval(student.id, input.requestId, input.route);
  } else if (invitation.invitation_kind === "tutor_link") {
    const approvalContext = await resolveTutorApprovalContext({
      student,
      inviter,
    });

    linkStatus = approvalContext.linkStatus;

    await upsertTutorStudentLink({
      tutorUserId: appUser.id,
      studentUserId: student.id,
      approvedByParentUserId: approvalContext.approvedByParentUserId,
    });
  } else {
    throw new AppError({
      code: "conflict",
      message: "Unsupported invitation kind.",
      status: 409,
    });
  }

  await markInvitationStatus({
    invitationId: invitation.id,
    status: "accepted",
    acceptedByUserId: appUser.id,
  });

  const acceptedInvitation = await loadInvitationByToken(token);

  if (!acceptedInvitation) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to reload the accepted invitation.",
      status: 503,
      retryable: true,
    });
  }

  logRuntimeInfo({
    message: "Accepted invitation",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: appUser.id,
    actorRole: appUser.role,
    targetStudentUserId: student.id,
    details: {
      invitationKind: acceptedInvitation.invitation_kind,
      linkStatus,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: appUser.id,
      actorRole: appUser.role,
      action: "account_link_invitation_accept",
      targetTable: "account_link_invitations",
      targetId: acceptedInvitation.id,
      studentUserId: student.id,
      metadata: {
        request_id: input.requestId,
        route: input.route,
        invitation_kind: acceptedInvitation.invitation_kind,
        link_status: linkStatus,
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block acceptance.
  }

  return {
    invitation: stripInvitationTokenHash(acceptedInvitation),
    student: await loadStudentRecord(student.id),
    linkStatus,
  };
}

export async function loadInvitationLanding(token: string) {
  const parsedToken = parseInvitationToken(token);
  return loadInvitationLandingCore(parsedToken);
}

export async function getInvitationPageState(token: string): Promise<InvitationPageState> {
  const landing = await loadInvitationLanding(token);
  const context = await getAuthenticatedUserContext();
  const appUser = context?.appUser ?? null;

  if (!landing) {
    return {
      landing: null,
      viewerState: "unavailable",
      context,
      appUser,
    };
  }

  if (landing.resolvedStatus === "accepted") {
    return {
      landing,
      viewerState:
        landing.invitation.accepted_by_user_id &&
        context?.authUserId === landing.invitation.accepted_by_user_id
          ? "already_accepted"
          : "unavailable",
      context,
      appUser,
    };
  }

  if (landing.resolvedStatus !== "pending") {
    return {
      landing,
      viewerState: "unavailable",
      context,
      appUser,
    };
  }

  if (!context) {
    return {
      landing,
      viewerState: "unauthenticated",
      context,
      appUser,
    };
  }

  if (!appUser) {
    return {
      landing,
      viewerState: "needs_onboarding",
      context,
      appUser,
    };
  }

  if (appUser.role !== landing.invitation.target_role) {
    return {
      landing,
      viewerState: "role_mismatch",
      context,
      appUser,
    };
  }

  return {
    landing,
    viewerState: "ready",
    context,
    appUser,
  };
}

export function buildAuthIntentFromInvitationKind(kind: InvitationKind) {
  if (kind === "tutor_link") {
    return "tutor_link";
  }

  return "parent_link";
}

export function buildOnboardingHrefFromInvitation(input: {
  token: string;
  targetRole: InvitationTargetRole;
}) {
  const url = new URL("/onboarding", env.NEXT_PUBLIC_APP_URL);
  url.searchParams.set("role", input.targetRole);
  url.searchParams.set("invite", input.token);
  return `${url.pathname}${url.search}`;
}

export function buildAuthHrefFromInvitation(input: {
  token: string;
  targetRole: InvitationTargetRole;
  mode: "sign_in" | "sign_up";
  kind: InvitationKind;
}) {
  const url = new URL("/auth", env.NEXT_PUBLIC_APP_URL);
  url.searchParams.set("mode", input.mode);
  url.searchParams.set("role", input.targetRole);
  url.searchParams.set("invite", input.token);
  url.searchParams.set("intent", buildAuthIntentFromInvitationKind(input.kind));
  return `${url.pathname}${url.search}`;
}
