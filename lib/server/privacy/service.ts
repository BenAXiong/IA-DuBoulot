import "server-only";

import {
  APP_USER_SELECT,
  loadAppUserById,
  syncAuthUserMetadataFromAppUser,
} from "@/lib/server/auth/account-service";
import {
  requireAppUserContext,
  requireAppUserRole,
} from "@/lib/server/auth/authorization";
import type {
  AppUserRecord,
  AuthenticatedUserContext,
} from "@/lib/server/auth/types";
import { recordAuditEvent } from "@/lib/server/audit/audit-service";
import { logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import { loadPayerBillingSnapshot } from "@/lib/server/billing/service";
import { AppError } from "@/lib/server/errors/app-error";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  PrivacyDeletionRequestResult,
  PrivacyDeletionScope,
  PrivacyDeletionTargetSnapshot,
  PrivacySettingsSnapshot,
} from "@/lib/server/privacy/types";

const DELETION_PURGE_TARGET_DAYS = 30;

type LinkedStudentRow = Pick<
  AppUserRecord,
  "id" | "role" | "display_name" | "is_under_13" | "account_status" | "deletion_requested_at"
>;

function addDaysIso(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function toPurgeTargetDate(requestedAt: string | null) {
  return requestedAt ? addDaysIso(requestedAt, DELETION_PURGE_TARGET_DAYS) : null;
}

function toServiceError(message: string, cause: unknown) {
  return new AppError({
    code: "service_unavailable",
    message,
    status: 503,
    retryable: true,
    cause,
  });
}

function getPrivacyDeletionCopy(
  languageCode: AppUserRecord["preferred_ui_language"],
) {
  return {
    under13Blocked:
      languageCode === "en"
        ? "Only a linked parent can request deletion for a student account under 13."
        : languageCode === "zh"
          ? "只有已連結的家長可以要求刪除 13 歲以下學生帳號。"
          : "Seul un parent lié peut demander la suppression d'un compte élève de moins de 13 ans.",
    adminBlocked:
      languageCode === "en"
        ? "The admin account does not go through self-service deletion."
        : languageCode === "zh"
          ? "管理員帳號不走自助刪除流程。"
          : "Le compte admin ne passe pas par la suppression libre-service.",
    linkedStudentsBlocked:
      languageCode === "en"
        ? "Delete or unlink the linked student accounts before requesting deletion of the parent account."
        : languageCode === "zh"
          ? "請先刪除或解除已連結的學生帳號，再要求刪除家長帳號。"
          : "Supprime ou délie d'abord les comptes élève liés avant de demander la suppression du compte parent.",
    billingBlocked:
      languageCode === "en"
        ? "The parent account still has an active billing relationship. Handle the subscription before requesting deletion."
        : languageCode === "zh"
          ? "家長帳號仍有有效的付費關係。請先處理訂閱，再要求刪除帳號。"
          : "Le compte parent a encore une relation de facturation. Gère d'abord l'abonnement avant de demander la suppression du compte.",
    linkedChildAlreadyQueued:
      languageCode === "en"
        ? "A deletion request is already queued for this student."
        : languageCode === "zh"
          ? "這位學生已經有刪除要求在排隊中。"
          : "Une demande est déjà en file pour cet élève.",
    selfAlreadyQueued:
      languageCode === "en"
        ? "A deletion request is already queued for this account."
        : languageCode === "zh"
          ? "這個帳號已經有刪除要求在排隊中。"
          : "Une demande de suppression est déjà en file pour ce compte.",
    requestNotAllowed:
      languageCode === "en"
        ? "Deletion request is not allowed."
        : languageCode === "zh"
          ? "目前不允許提出刪除要求。"
          : "Cette demande de suppression n'est pas autorisée.",
  };
}

async function loadActiveLinkedStudents(parentUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data: links, error: linkError } = await admin
    .from("parent_student_links")
    .select("student_user_id")
    .eq("parent_user_id", parentUserId)
    .eq("link_status", "active");

  if (linkError) {
    throw toServiceError("Unable to load linked students.", linkError);
  }

  const studentUserIds = (links ?? [])
    .map((row) => row.student_user_id)
    .filter((value): value is string => typeof value === "string");

  if (studentUserIds.length === 0) {
    return [] as LinkedStudentRow[];
  }

  const { data: students, error: studentError } = await admin
    .from("users")
    .select(
      "id, role, display_name, is_under_13, account_status, deletion_requested_at",
    )
    .in("id", studentUserIds);

  if (studentError) {
    throw toServiceError("Unable to load linked student profiles.", studentError);
  }

  return (students ?? []) as LinkedStudentRow[];
}

async function loadSelfDeletionBlockers(appUser: AppUserRecord) {
  const copy = getPrivacyDeletionCopy(appUser.preferred_ui_language);

  if (appUser.role !== "parent") {
    return {
      linkedStudentCount: 0,
      hasSubscription: false,
      blockedReason:
        appUser.role === "student" && appUser.is_under_13
          ? copy.under13Blocked
          : appUser.role === "admin"
            ? copy.adminBlocked
            : null,
    };
  }

  const [linkedStudents, billing] = await Promise.all([
    loadActiveLinkedStudents(appUser.id),
    loadPayerBillingSnapshot(appUser.id),
  ]);

  if (linkedStudents.length > 0) {
    return {
      linkedStudentCount: linkedStudents.length,
      hasSubscription: billing.hasSubscription,
      blockedReason: copy.linkedStudentsBlocked,
    };
  }

  if (billing.hasSubscription) {
    return {
      linkedStudentCount: 0,
      hasSubscription: true,
      blockedReason: copy.billingBlocked,
    };
  }

  return {
    linkedStudentCount: 0,
    hasSubscription: false,
    blockedReason: null,
  };
}

async function buildDeletionTargetSnapshot(input: {
  viewer: AppUserRecord;
  target: Pick<
    AppUserRecord,
    "id" | "role" | "display_name" | "is_under_13" | "account_status" | "deletion_requested_at"
  >;
  scope: PrivacyDeletionScope;
}): Promise<PrivacyDeletionTargetSnapshot> {
  const isAlreadyRequested = input.target.account_status === "deletion_requested";
  const copy = getPrivacyDeletionCopy(input.viewer.preferred_ui_language);

  if (input.scope === "linked_child") {
    return {
      targetUserId: input.target.id,
      displayName: input.target.display_name,
      role: input.target.role,
      isUnder13: input.target.is_under_13,
      requestedAt: input.target.deletion_requested_at,
      purgeTargetDate: toPurgeTargetDate(input.target.deletion_requested_at),
      canRequest: !isAlreadyRequested,
      blockedReason: isAlreadyRequested ? copy.linkedChildAlreadyQueued : null,
      linkedStudentCount: 0,
      hasSubscription: false,
    };
  }

  const blockers = await loadSelfDeletionBlockers(input.viewer);
  const blockedReason =
    isAlreadyRequested
      ? copy.selfAlreadyQueued
      : blockers.blockedReason;

  return {
    targetUserId: input.target.id,
    displayName: input.target.display_name,
    role: input.target.role,
    isUnder13: input.target.is_under_13,
    requestedAt: input.target.deletion_requested_at,
    purgeTargetDate: toPurgeTargetDate(input.target.deletion_requested_at),
    canRequest: !isAlreadyRequested && !blockedReason,
    blockedReason,
    linkedStudentCount: blockers.linkedStudentCount,
    hasSubscription: blockers.hasSubscription,
  };
}

async function revokeTutorAccessForStudent(studentUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("tutor_student_links")
    .update({
      link_status: "revoked",
    })
    .eq("student_user_id", studentUserId)
    .eq("link_status", "active")
    .select("id");

  if (error) {
    throw toServiceError("Unable to revoke tutor access for the student.", error);
  }

  return (data ?? []).length;
}

async function revokeTutorSelfLinks(tutorUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("tutor_student_links")
    .update({
      link_status: "revoked",
    })
    .eq("tutor_user_id", tutorUserId)
    .eq("link_status", "active")
    .select("id");

  if (error) {
    throw toServiceError("Unable to revoke tutor links for the account.", error);
  }

  return (data ?? []).length;
}

async function revokeParentSelfLinks(parentUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("parent_student_links")
    .update({
      link_status: "revoked",
    })
    .eq("parent_user_id", parentUserId)
    .eq("link_status", "active")
    .select("id");

  if (error) {
    throw toServiceError("Unable to revoke parent links for the account.", error);
  }

  return (data ?? []).length;
}

async function loadLinkedStudentForParent(parentUserId: string, studentUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data: link, error: linkError } = await admin
    .from("parent_student_links")
    .select("student_user_id")
    .eq("parent_user_id", parentUserId)
    .eq("student_user_id", studentUserId)
    .eq("link_status", "active")
    .maybeSingle<{ student_user_id: string }>();

  if (linkError) {
    throw toServiceError("Unable to verify the parent link.", linkError);
  }

  if (!link) {
    throw new AppError({
      code: "not_found",
      message: "Student not found.",
      status: 404,
    });
  }

  const student = await loadAppUserById(studentUserId);

  if (student.role !== "student") {
    throw new AppError({
      code: "validation_error",
      message: "Only student accounts can be deleted from the parent flow.",
      status: 400,
    });
  }

  return student;
}

export async function loadPrivacySettingsSnapshot(
  appUser: AppUserRecord,
): Promise<PrivacySettingsSnapshot> {
  const billing = appUser.role === "parent"
    ? await loadPayerBillingSnapshot(appUser.id)
    : null;
  const selfDeletion =
    appUser.role === "admin"
      ? null
      : await buildDeletionTargetSnapshot({
          viewer: appUser,
          target: appUser,
          scope: "self",
        });
  const linkedStudentDeletionTargets =
    appUser.role === "parent"
      ? await Promise.all(
          (await loadActiveLinkedStudents(appUser.id)).map((student) =>
            buildDeletionTargetSnapshot({
              viewer: appUser,
              target: {
                id: student.id,
                role: student.role,
                display_name: student.display_name,
                is_under_13: student.is_under_13,
                account_status: student.account_status,
                deletion_requested_at: student.deletion_requested_at,
              },
              scope: "linked_child",
            }),
          ),
        )
      : [];

  return {
    billing,
    selfDeletion,
    linkedStudentDeletionTargets,
  };
}

export async function requestPrivacyDeletion(input: {
  context: AuthenticatedUserContext;
  targetUserId?: string;
  requestId: string;
  route: string;
}): Promise<PrivacyDeletionRequestResult> {
  const appUser = requireAppUserContext(input.context);
  const isSelfRequest = !input.targetUserId || input.targetUserId === appUser.id;
  const scope: PrivacyDeletionScope = isSelfRequest ? "self" : "linked_child";
  const target =
    scope === "self"
      ? appUser
      : await (async () => {
          requireAppUserRole(appUser, ["parent"]);
          return loadLinkedStudentForParent(appUser.id, input.targetUserId as string);
        })();
  const snapshot = await buildDeletionTargetSnapshot({
    viewer: appUser,
    target,
    scope,
  });

  if (!snapshot.canRequest && !snapshot.requestedAt) {
    const copy = getPrivacyDeletionCopy(appUser.preferred_ui_language);
    throw new AppError({
      code: "conflict",
      message: snapshot.blockedReason ?? copy.requestNotAllowed,
      status: 409,
    });
  }

  if (snapshot.requestedAt) {
    return {
      targetUserId: target.id,
      targetDisplayName: target.display_name,
      targetRole: target.role,
      requestedAt: snapshot.requestedAt,
      purgeTargetDate: snapshot.purgeTargetDate ?? addDaysIso(snapshot.requestedAt, DELETION_PURGE_TARGET_DAYS),
      scope,
      status: "deletion_requested",
    };
  }

  const requestedAt = new Date().toISOString();
  const admin = createSupabaseAdminClient();
  const { data: updatedUser, error: updateError } = await admin
    .from("users")
    .update({
      account_status: "deletion_requested",
      deletion_requested_at: requestedAt,
    })
    .eq("id", target.id)
    .select(APP_USER_SELECT)
    .single<AppUserRecord>();

  if (updateError) {
    throw toServiceError("Unable to queue the deletion request.", updateError);
  }

  let revokedTutorLinkCount = 0;
  let revokedParentLinkCount = 0;

  if (updatedUser.role === "student") {
    revokedTutorLinkCount = await revokeTutorAccessForStudent(updatedUser.id);
  }

  if (scope === "self" && updatedUser.role === "tutor") {
    revokedTutorLinkCount = await revokeTutorSelfLinks(updatedUser.id);
  }

  if (scope === "self" && updatedUser.role === "parent") {
    revokedParentLinkCount = await revokeParentSelfLinks(updatedUser.id);
  }

  await syncAuthUserMetadataFromAppUser({
    authUserId: updatedUser.id,
    appUser: updatedUser,
    requestId: input.requestId,
    route: input.route,
  });

  const purgeTargetDate = addDaysIso(requestedAt, DELETION_PURGE_TARGET_DAYS);

  logRuntimeInfo({
    message: "Queued privacy deletion request",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: appUser.id,
    actorRole: appUser.role,
    targetStudentUserId: updatedUser.role === "student" ? updatedUser.id : null,
    details: {
      scope,
      targetUserId: updatedUser.id,
      targetRole: updatedUser.role,
      revokedTutorLinkCount,
      revokedParentLinkCount,
      purgeTargetDate,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: appUser.id,
      actorRole: appUser.role,
      action: "account_deletion_requested",
      targetTable: "users",
      targetId: updatedUser.id,
      studentUserId: updatedUser.role === "student" ? updatedUser.id : null,
      metadata: {
        request_id: input.requestId,
        route: input.route,
        scope,
        requested_for_role: updatedUser.role,
        purge_target_date: purgeTargetDate,
        revoked_tutor_link_count: revokedTutorLinkCount,
        revoked_parent_link_count: revokedParentLinkCount,
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block deletion requests.
  }

  return {
    targetUserId: updatedUser.id,
    targetDisplayName: updatedUser.display_name,
    targetRole: updatedUser.role,
    requestedAt,
    purgeTargetDate,
    scope,
    status: updatedUser.account_status,
  };
}
