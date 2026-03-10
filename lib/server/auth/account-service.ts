import "server-only";

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
} from "@/lib/server/auth/types";
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

function requireBodyObject(body: unknown): BootstrapProfilePayload {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError({
      code: "bad_request",
      message: "Expected a JSON object body.",
      status: 400,
    });
  }

  return body as BootstrapProfilePayload;
}

function parseRole(role: string | undefined): SelfBootstrapRole {
  if (!role || !isStringInArray(role, SELF_BOOTSTRAP_ROLES)) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        role: "Role must be one of student, parent, or tutor.",
      },
    });
  }

  return role;
}

function parseDisplayName(displayName: string | undefined) {
  const normalized = displayName?.trim() ?? "";

  if (!normalized || normalized.length > 80) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        displayName: "Display name is required and must be 80 characters or fewer.",
      },
    });
  }

  return normalized;
}

function parseUiLanguage(value: string | undefined): UiLanguageCode {
  const normalized = value ?? "fr";

  if (!isStringInArray(normalized, UI_LANGUAGE_CODES)) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        preferredUiLanguage: "Preferred UI language must be fr, en, or zh.",
      },
    });
  }

  return normalized;
}

function parseAiLanguage(value: string | undefined): AiLanguageCode {
  const normalized = value ?? "fr";

  if (!isStringInArray(normalized, AI_LANGUAGE_CODES)) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        aiHelpLanguage: "AI help language must be fr or en.",
      },
    });
  }

  return normalized;
}

function parseAgeBand(value: string | null | undefined): AgeBand | null {
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
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        ageBand: "Age band must be one of the supported values.",
      },
    });
  }

  return value;
}

export async function parseBootstrapProfileInput(
  request: Request,
): Promise<BootstrapProfileInput> {
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

  const payload = requireBodyObject(body);
  const role = parseRole(payload.role);
  const displayName = parseDisplayName(payload.displayName);
  const preferredUiLanguage = parseUiLanguage(payload.preferredUiLanguage);
  const aiHelpLanguage = parseAiLanguage(payload.aiHelpLanguage);
  const ageBand = parseAgeBand(payload.ageBand);
  const isUnder13 = payload.isUnder13 ?? false;

  if (isUnder13 && role !== "student") {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        isUnder13: "Only student accounts can be marked as under 13.",
      },
    });
  }

  if (isUnder13 && (!ageBand || !isUnder13AgeBand(ageBand))) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        ageBand:
          "Under-13 student accounts must use six_eight, nine_ten, or eleven_twelve.",
      },
    });
  }

  if (!isUnder13 && role !== "student" && ageBand) {
    throw new AppError({
      code: "validation_error",
      message: "One or more fields are invalid.",
      status: 400,
      fieldErrors: {
        ageBand: "Only student bootstrap requests should include an age band.",
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

async function upsertStudentProfile(input: {
  authUserId: string;
  isUnder13: boolean;
}) {
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
      message: "Unable to bootstrap the student profile.",
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
  const supabase = createSupabaseAdminClient();
  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select(
      "id, role, account_status, display_name, preferred_ui_language, ai_help_language, age_band, is_under_13, deletion_requested_at, created_at, updated_at",
    )
    .eq("id", context.authUserId)
    .maybeSingle<AppUserRecord>();

  if (existingUserError) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to load the current app profile.",
      status: 503,
      retryable: true,
      cause: existingUserError,
    });
  }

  if (existingUser && existingUser.role !== input.role) {
    throw new AppError({
      code: "conflict",
      message: "An app profile already exists with a different role.",
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
    .select(
      "id, role, account_status, display_name, preferred_ui_language, ai_help_language, age_band, is_under_13, deletion_requested_at, created_at, updated_at",
    )
    .single<AppUserRecord>();

  if (upsertError) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to bootstrap the app profile.",
      status: 503,
      retryable: true,
      cause: upsertError,
    });
  }

  if (input.role === "student") {
    await upsertStudentProfile({
      authUserId: context.authUserId,
      isUnder13: input.isUnder13,
    });
  }

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
