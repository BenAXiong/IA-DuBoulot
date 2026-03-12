import "server-only";

import { getAuthProfileServerCopy } from "@/lib/i18n/ui-copy";
import { AppError } from "@/lib/server/errors/app-error";
import {
  AI_LANGUAGE_CODES,
  SELF_BOOTSTRAP_ROLES,
  UI_LANGUAGE_CODES,
  UNDER_13_AGE_BANDS,
  type AppUserRecord,
  type BootstrapProfileInput,
  type SelfBootstrapRole,
  type UiLanguageCode,
  type AiLanguageCode,
  type AgeBand,
  type UpdateProfileInput,
} from "@/lib/server/auth/types";
import { requireActiveAppUser } from "@/lib/server/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordAuditEvent } from "@/lib/server/audit/audit-service";
import { logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import type { AuthenticatedUserContext } from "@/lib/server/auth/types";

type BootstrapProfilePayload = Partial<{
  role: string;
  displayName: string;
  preferredUiLanguage: string;
  aiHelpLanguage: string;
  ageBand: string | null;
  isUnder13: boolean;
}>;

type BootstrapProfileResult = {
  appUser: AppUserRecord;
  created: boolean;
};

type UpdateProfilePayload = Partial<{
  displayName: string;
  preferredUiLanguage: string;
  aiHelpLanguage: string;
  ageBand: string | null;
}>;

type AuthProfileServerCopy = ReturnType<typeof getAuthProfileServerCopy>;

export const APP_USER_SELECT =
  "id, role, account_status, display_name, preferred_ui_language, ai_help_language, age_band, is_under_13, deletion_requested_at, created_at, updated_at";

function isStringInArray<T extends readonly string[]>(
  value: string,
  allowed: T,
): value is T[number] {
  return allowed.includes(value as T[number]);
}

function isUnder13AgeBand(value: AgeBand): value is (typeof UNDER_13_AGE_BANDS)[number] {
  return UNDER_13_AGE_BANDS.includes(
    value as (typeof UNDER_13_AGE_BANDS)[number],
  );
}

function resolveServerCopyLanguage(
  value: string | null | undefined,
): UiLanguageCode {
  return value === "en" || value === "zh" ? value : "fr";
}

function requireBodyObject(
  body: unknown,
  copy: AuthProfileServerCopy,
): BootstrapProfilePayload {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError({
      code: "bad_request",
      message: copy.expectedObject,
      status: 400,
    });
  }

  return body as BootstrapProfilePayload;
}

function parseRole(
  role: string | undefined,
  copy: AuthProfileServerCopy,
): SelfBootstrapRole {
  if (!role || !isStringInArray(role, SELF_BOOTSTRAP_ROLES)) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        role: copy.fieldErrors.role,
      },
    });
  }

  return role;
}

function parseDisplayName(
  displayName: string | undefined,
  copy: AuthProfileServerCopy,
) {
  const normalized = displayName?.trim() ?? "";

  if (!normalized || normalized.length > 80) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        displayName: copy.fieldErrors.displayName,
      },
    });
  }

  return normalized;
}

function parseUiLanguage(
  value: string | undefined,
  copy: AuthProfileServerCopy,
): UiLanguageCode {
  const normalized = value ?? "fr";

  if (!isStringInArray(normalized, UI_LANGUAGE_CODES)) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        preferredUiLanguage: copy.fieldErrors.preferredUiLanguage,
      },
    });
  }

  return normalized;
}

function parseAiLanguage(
  value: string | undefined,
  copy: AuthProfileServerCopy,
): AiLanguageCode {
  const normalized = value ?? "fr";

  if (!isStringInArray(normalized, AI_LANGUAGE_CODES)) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        aiHelpLanguage: copy.fieldErrors.aiHelpLanguage,
      },
    });
  }

  return normalized;
}

function parseAgeBand(
  value: string | null | undefined,
  copy: AuthProfileServerCopy,
): AgeBand | null {
  if (value == null) {
    return null;
  }

  if (
    value !== "six_eight" &&
    value !== "nine_ten" &&
    value !== "eleven_twelve" &&
    value !== "thirteen_fifteen" &&
    value !== "sixteen_eighteen"
  ) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        ageBand: copy.fieldErrors.ageBandSupported,
      },
    });
  }

  return value;
}

function requireUpdateBodyObject(
  body: unknown,
  copy: AuthProfileServerCopy,
): UpdateProfilePayload {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError({
      code: "bad_request",
      message: copy.expectedObject,
      status: 400,
    });
  }

  return body as UpdateProfilePayload;
}

function buildAuthMetadata(appUser: AppUserRecord) {
  return {
    app_role: appUser.role,
    display_name: appUser.display_name,
    preferred_ui_language: appUser.preferred_ui_language,
    ai_help_language: appUser.ai_help_language,
    age_band: appUser.age_band,
    is_under_13: appUser.is_under_13,
    account_status: appUser.account_status,
    onboarding_completed: true,
    app_profile_version: 1,
  };
}

async function syncAuthUserMetadata(input: {
  authUserId: string;
  appUser: AppUserRecord;
  languageCode: UiLanguageCode;
  requestId: string;
  route: string;
}) {
  const copy = getAuthProfileServerCopy(input.languageCode);
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(input.authUserId, {
    user_metadata: buildAuthMetadata(input.appUser),
  });

  if (error) {
    throw new AppError({
      code: "service_unavailable",
      message: copy.service.syncAuthMetadata,
      status: 503,
      retryable: true,
      cause: error,
    });
  }
}

export async function loadAppUserById(userId: string): Promise<AppUserRecord> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", userId)
    .single<AppUserRecord>();

  if (error) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to load the app profile.",
      status: 503,
      retryable: true,
      cause: error,
    });
  }

  return data;
}

export async function syncAuthUserMetadataFromAppUser(input: {
  authUserId: string;
  appUser: AppUserRecord;
  languageCode?: UiLanguageCode;
  requestId: string;
  route: string;
}) {
  await syncAuthUserMetadata({
    ...input,
    languageCode: input.languageCode ?? input.appUser.preferred_ui_language,
  });
}

export async function parseBootstrapProfileInput(
  request: Request,
): Promise<BootstrapProfileInput> {
  let body: unknown;
  const fallbackCopy = getAuthProfileServerCopy("fr");

  try {
    body = await request.json();
  } catch (error) {
    throw new AppError({
      code: "bad_request",
      message: fallbackCopy.invalidJson,
      status: 400,
      cause: error,
    });
  }

  const payload = requireBodyObject(body, fallbackCopy);
  const copy = getAuthProfileServerCopy(
    resolveServerCopyLanguage(payload.preferredUiLanguage),
  );
  const role = parseRole(payload.role, copy);
  const displayName = parseDisplayName(payload.displayName, copy);
  const preferredUiLanguage = parseUiLanguage(payload.preferredUiLanguage, copy);
  const aiHelpLanguage = parseAiLanguage(payload.aiHelpLanguage, copy);
  const ageBand = parseAgeBand(payload.ageBand, copy);
  const isUnder13 = payload.isUnder13 ?? false;

  if (isUnder13 && role !== "student") {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        isUnder13: copy.fieldErrors.onlyStudentUnder13,
      },
    });
  }

  if (isUnder13 && (!ageBand || !isUnder13AgeBand(ageBand))) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        ageBand: copy.fieldErrors.under13AgeBand,
      },
    });
  }

  if (!isUnder13 && role !== "student" && ageBand) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        ageBand: copy.fieldErrors.bootstrapAgeBandStudentOnly,
      },
    });
  }

  return {
    role,
    displayName,
    preferredUiLanguage,
    aiHelpLanguage,
    ageBand,
    isUnder13,
  };
}

export async function parseUpdateProfileInput(
  request: Request,
  appUser: AppUserRecord,
): Promise<UpdateProfileInput> {
  let body: unknown;
  const copy = getAuthProfileServerCopy(appUser.preferred_ui_language);

  try {
    body = await request.json();
  } catch (error) {
    throw new AppError({
      code: "bad_request",
      message: copy.invalidJson,
      status: 400,
      cause: error,
    });
  }

  const payload = requireUpdateBodyObject(body, copy);
  const displayName = parseDisplayName(payload.displayName, copy);
  const preferredUiLanguage = parseUiLanguage(payload.preferredUiLanguage, copy);
  const aiHelpLanguage = parseAiLanguage(payload.aiHelpLanguage, copy);
  const ageBand = parseAgeBand(payload.ageBand, copy);

  if (appUser.role !== "student" && ageBand) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        ageBand: copy.fieldErrors.storedAgeBandStudentOnly,
      },
    });
  }

  if (appUser.role === "student" && appUser.is_under_13) {
    if (!ageBand || !isUnder13AgeBand(ageBand)) {
      throw new AppError({
        code: "validation_error",
        message: copy.invalidFields,
        status: 400,
        fieldErrors: {
          ageBand: copy.fieldErrors.under13AgeBand,
        },
      });
    }
  }

  return {
    displayName,
    preferredUiLanguage,
    aiHelpLanguage,
    ageBand: appUser.role === "student" ? ageBand : null,
  };
}

async function upsertStudentProfile(input: {
  authUserId: string;
  isUnder13: boolean;
  languageCode: UiLanguageCode;
}) {
  const copy = getAuthProfileServerCopy(input.languageCode);
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("student_profiles").upsert(
    {
      student_user_id: input.authUserId,
      parental_approval_required: input.isUnder13,
      parent_approved_at: null,
    },
    {
      onConflict: "student_user_id",
    },
  );

  if (error) {
    throw new AppError({
      code: "service_unavailable",
      message: copy.service.bootstrapStudentProfile,
      status: 503,
      retryable: true,
      cause: error,
    });
  }
}

export async function bootstrapProfile(
  context: AuthenticatedUserContext,
  input: BootstrapProfileInput,
  requestId: string,
): Promise<BootstrapProfileResult> {
  const copy = getAuthProfileServerCopy(input.preferredUiLanguage);
  const supabase = createSupabaseAdminClient();
  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select(APP_USER_SELECT)
    .eq("id", context.authUserId)
    .maybeSingle<AppUserRecord>();

  if (existingUserError) {
    throw new AppError({
      code: "service_unavailable",
      message: copy.service.loadCurrentProfile,
      status: 503,
      retryable: true,
      cause: existingUserError,
    });
  }

  if (existingUser && existingUser.role !== input.role) {
    throw new AppError({
      code: "conflict",
      message: copy.service.roleConflict,
      status: 409,
    });
  }

  const accountStatus =
    input.role === "student" && input.isUnder13
      ? "pending_parent_approval"
      : "active";

  const upsertPayload = {
    id: context.authUserId,
    role: input.role,
    account_status: accountStatus,
    display_name: input.displayName,
    preferred_ui_language: input.preferredUiLanguage,
    ai_help_language: input.aiHelpLanguage,
    age_band: input.role === "student" ? input.ageBand : null,
    is_under_13: input.role === "student" ? input.isUnder13 : false,
    deletion_requested_at: null,
  };

  const { data: upsertedUser, error: upsertError } = await supabase
    .from("users")
    .upsert(upsertPayload, {
      onConflict: "id",
    })
    .select(APP_USER_SELECT)
    .single<AppUserRecord>();

  if (upsertError) {
    throw new AppError({
      code: "service_unavailable",
      message: copy.service.bootstrapAppProfile,
      status: 503,
      retryable: true,
      cause: upsertError,
    });
  }

  if (input.role === "student") {
    await upsertStudentProfile({
      authUserId: context.authUserId,
      isUnder13: input.isUnder13,
      languageCode: input.preferredUiLanguage,
    });
  }

  await syncAuthUserMetadata({
    authUserId: context.authUserId,
    appUser: upsertedUser,
    languageCode: input.preferredUiLanguage,
    requestId,
    route: "/api/auth/profile/bootstrap",
  });

  logRuntimeInfo({
    message: "Bootstrapped app profile",
    requestId,
    route: "/api/auth/profile/bootstrap",
    method: "POST",
    actorUserId: context.authUserId,
    actorRole: input.role,
    targetStudentUserId: input.role === "student" ? context.authUserId : null,
    details: {
      created: !existingUser,
      role: input.role,
      isUnder13: input.isUnder13,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: context.authUserId,
      actorRole: existingUser?.role ?? input.role,
      action: existingUser ? "profile_bootstrap_repair" : "profile_bootstrap_create",
      targetTable: "users",
      targetId: context.authUserId,
      studentUserId: input.role === "student" ? context.authUserId : null,
      metadata: {
        request_id: requestId,
        route: "/api/auth/profile/bootstrap",
        role: input.role,
        created_student_profile: input.role === "student",
      },
      requestId,
    });
  } catch {
    // Audit failures are logged inside the audit service and should not block bootstrap.
  }

  return {
    appUser: upsertedUser,
    created: !existingUser,
  };
}

export async function updateProfile(
  context: AuthenticatedUserContext,
  appUser: AppUserRecord,
  input: UpdateProfileInput,
  requestId: string,
) {
  requireActiveAppUser(appUser);
  const copy = getAuthProfileServerCopy(input.preferredUiLanguage);
  const supabase = createSupabaseAdminClient();
  const { data: updatedUser, error } = await supabase
    .from("users")
    .update({
      display_name: input.displayName,
      preferred_ui_language: input.preferredUiLanguage,
      ai_help_language: input.aiHelpLanguage,
      age_band: appUser.role === "student" ? input.ageBand : null,
    })
    .eq("id", context.authUserId)
    .select(APP_USER_SELECT)
    .single<AppUserRecord>();

  if (error) {
    throw new AppError({
      code: "service_unavailable",
      message: copy.service.updateAppProfile,
      status: 503,
      retryable: true,
      cause: error,
    });
  }

  await syncAuthUserMetadata({
    authUserId: context.authUserId,
    appUser: updatedUser,
    languageCode: input.preferredUiLanguage,
    requestId,
    route: "/api/auth/profile",
  });

  logRuntimeInfo({
    message: "Updated app profile",
    requestId,
    route: "/api/auth/profile",
    method: "PATCH",
    actorUserId: context.authUserId,
    actorRole: appUser.role,
    targetStudentUserId: appUser.role === "student" ? context.authUserId : null,
    details: {
      preferredUiLanguage: input.preferredUiLanguage,
      aiHelpLanguage: input.aiHelpLanguage,
      ageBand: input.ageBand,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: context.authUserId,
      actorRole: appUser.role,
      action: "profile_update",
      targetTable: "users",
      targetId: context.authUserId,
      studentUserId: appUser.role === "student" ? context.authUserId : null,
      metadata: {
        request_id: requestId,
        route: "/api/auth/profile",
        role: appUser.role,
      },
      requestId,
    });
  } catch {
    // Audit failures are logged inside the audit service and should not block profile updates.
  }

  return updatedUser;
}
