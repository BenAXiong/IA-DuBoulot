import "server-only";

import { getParentLearnerBootstrapServerCopy } from "@/lib/i18n/oversight-copy";
import { recordAuditEvent } from "@/lib/server/audit/audit-service";
import { logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import { syncAuthUserMetadataFromAppUser, APP_USER_SELECT } from "@/lib/server/auth/account-service";
import { AppError } from "@/lib/server/errors/app-error";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  AI_LANGUAGE_CODES,
  UI_LANGUAGE_CODES,
  UNDER_13_AGE_BANDS,
  type AgeBand,
  type AiLanguageCode,
  type AppUserRecord,
  type UiLanguageCode,
} from "@/lib/server/auth/types";

type ParentLearnerBootstrapPayload = Partial<{
  displayName: string;
  learnerEmail: string;
  temporaryPassword: string;
  preferredUiLanguage: string;
  aiHelpLanguage: string;
  ageBand: string | null;
  relationshipLabel: string | null;
}>;

export type CreateParentManagedLearnerInput = {
  displayName: string;
  learnerEmail: string;
  temporaryPassword: string;
  preferredUiLanguage: UiLanguageCode;
  aiHelpLanguage: AiLanguageCode;
  ageBand: AgeBand;
  relationshipLabel: string | null;
};

export type CreateParentManagedLearnerResult = {
  learner: AppUserRecord;
  relationshipLabel: string | null;
};

function isStringInArray<T extends readonly string[]>(
  value: string,
  allowed: T,
): value is T[number] {
  return allowed.includes(value as T[number]);
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function requireBodyObject(
  body: unknown,
  languageCode: UiLanguageCode,
): ParentLearnerBootstrapPayload {
  const copy = getParentLearnerBootstrapServerCopy(languageCode);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError({
      code: "bad_request",
      message: copy.expectedObject,
      status: 400,
    });
  }

  return body as ParentLearnerBootstrapPayload;
}

function parseDisplayName(
  value: string | undefined,
  languageCode: UiLanguageCode,
) {
  const copy = getParentLearnerBootstrapServerCopy(languageCode);
  const normalized = value?.trim() ?? "";

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

function parseLearnerEmail(
  learnerEmail: string | undefined,
  parentEmail: string | null,
  languageCode: UiLanguageCode,
) {
  const copy = getParentLearnerBootstrapServerCopy(languageCode);
  const normalized = normalizeEmail(learnerEmail);

  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        learnerEmail: copy.fieldErrors.learnerEmail,
      },
    });
  }

  if (parentEmail && normalizeEmail(parentEmail) === normalized) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        learnerEmail: copy.fieldErrors.learnerEmailDifferent,
      },
    });
  }

  return normalized;
}

function parseTemporaryPassword(
  value: string | undefined,
  languageCode: UiLanguageCode,
) {
  const copy = getParentLearnerBootstrapServerCopy(languageCode);
  const normalized = value ?? "";

  if (normalized.length < 8 || normalized.length > 72) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        temporaryPassword: copy.fieldErrors.temporaryPassword,
      },
    });
  }

  return normalized;
}

function parseUiLanguage(
  value: string | undefined,
  languageCode: UiLanguageCode,
): UiLanguageCode {
  const copy = getParentLearnerBootstrapServerCopy(languageCode);
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

function parseAiHelpLanguage(
  value: string | undefined,
  languageCode: UiLanguageCode,
): AiLanguageCode {
  const copy = getParentLearnerBootstrapServerCopy(languageCode);
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
  languageCode: UiLanguageCode,
): AgeBand {
  const copy = getParentLearnerBootstrapServerCopy(languageCode);

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
        ageBand: copy.fieldErrors.ageBand,
      },
    });
  }

  return value;
}

function parseRelationshipLabel(
  value: string | null | undefined,
  languageCode: UiLanguageCode,
) {
  const copy = getParentLearnerBootstrapServerCopy(languageCode);

  if (value == null || value.trim() === "") {
    return null;
  }

  const normalized = value.trim();

  if (normalized.length > 80) {
    throw new AppError({
      code: "validation_error",
      message: copy.invalidFields,
      status: 400,
      fieldErrors: {
        relationshipLabel: copy.fieldErrors.relationshipLabel,
      },
    });
  }

  return normalized;
}

function isUnder13AgeBand(
  value: AgeBand,
): value is (typeof UNDER_13_AGE_BANDS)[number] {
  return UNDER_13_AGE_BANDS.includes(
    value as (typeof UNDER_13_AGE_BANDS)[number],
  );
}

function isDuplicateEmailError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("already been registered") || message.includes("already registered");
}

export async function parseCreateParentManagedLearnerInput(
  request: Request,
  input: {
    languageCode: UiLanguageCode;
    parentEmail: string | null;
  },
): Promise<CreateParentManagedLearnerInput> {
  let body: unknown;
  const copy = getParentLearnerBootstrapServerCopy(input.languageCode);

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

  const payload = requireBodyObject(body, input.languageCode);

  return {
    displayName: parseDisplayName(payload.displayName, input.languageCode),
    learnerEmail: parseLearnerEmail(
      payload.learnerEmail,
      input.parentEmail,
      input.languageCode,
    ),
    temporaryPassword: parseTemporaryPassword(
      payload.temporaryPassword,
      input.languageCode,
    ),
    preferredUiLanguage: parseUiLanguage(
      payload.preferredUiLanguage,
      input.languageCode,
    ),
    aiHelpLanguage: parseAiHelpLanguage(
      payload.aiHelpLanguage,
      input.languageCode,
    ),
    ageBand: parseAgeBand(payload.ageBand, input.languageCode),
    relationshipLabel: parseRelationshipLabel(
      payload.relationshipLabel,
      input.languageCode,
    ),
  };
}

export async function createParentManagedLearner(input: {
  parentUser: AppUserRecord;
  payload: CreateParentManagedLearnerInput;
  requestId: string;
  route: string;
}): Promise<CreateParentManagedLearnerResult> {
  const copy = getParentLearnerBootstrapServerCopy(
    input.parentUser.preferred_ui_language,
  );

  if (input.parentUser.account_status !== "active") {
    throw new AppError({
      code: "conflict",
      message: copy.errors.parentMustBeActive,
      status: 409,
    });
  }

  const supabase = createSupabaseAdminClient();
  const isUnder13 = isUnder13AgeBand(input.payload.ageBand);
  const approvedAt = new Date().toISOString();
  let createdAuthUserId: string | null = null;

  try {
    const { data: authUserData, error: createAuthUserError } =
      await supabase.auth.admin.createUser({
        email: input.payload.learnerEmail,
        password: input.payload.temporaryPassword,
        email_confirm: true,
      });

    if (createAuthUserError) {
      if (isDuplicateEmailError(createAuthUserError)) {
        throw new AppError({
          code: "conflict",
          message: copy.errors.learnerEmailTaken,
          status: 409,
          fieldErrors: {
            learnerEmail: copy.errors.learnerEmailTaken,
          },
          cause: createAuthUserError,
        });
      }

      throw new AppError({
        code: "service_unavailable",
        message: copy.service.createAuthUser,
        status: 503,
        retryable: true,
        cause: createAuthUserError,
      });
    }

    if (!authUserData.user?.id) {
      throw new AppError({
        code: "service_unavailable",
        message: copy.service.createAuthUser,
        status: 503,
      });
    }

    createdAuthUserId = authUserData.user.id;

    const { data: learnerAppUser, error: createAppProfileError } = await supabase
      .from("users")
      .insert({
        id: createdAuthUserId,
        role: "student",
        account_status: "active",
        display_name: input.payload.displayName,
        preferred_ui_language: input.payload.preferredUiLanguage,
        ai_help_language: input.payload.aiHelpLanguage,
        age_band: input.payload.ageBand,
        is_under_13: isUnder13,
        deletion_requested_at: null,
      })
      .select(APP_USER_SELECT)
      .single<AppUserRecord>();

    if (createAppProfileError) {
      throw new AppError({
        code: "service_unavailable",
        message: copy.service.createAppProfile,
        status: 503,
        retryable: true,
        cause: createAppProfileError,
      });
    }

    const { error: createStudentProfileError } = await supabase
      .from("student_profiles")
      .insert({
        student_user_id: learnerAppUser.id,
        parental_approval_required: isUnder13,
        parent_approved_at: isUnder13 ? approvedAt : null,
      });

    if (createStudentProfileError) {
      throw new AppError({
        code: "service_unavailable",
        message: copy.service.createStudentProfile,
        status: 503,
        retryable: true,
        cause: createStudentProfileError,
      });
    }

    const { error: createParentLinkError } = await supabase
      .from("parent_student_links")
      .upsert(
        {
          parent_user_id: input.parentUser.id,
          student_user_id: learnerAppUser.id,
          link_status: "active",
          relationship_label: input.payload.relationshipLabel,
          approved_at: approvedAt,
          revoked_at: null,
        },
        {
          onConflict: "parent_user_id,student_user_id",
        },
      );

    if (createParentLinkError) {
      throw new AppError({
        code: "service_unavailable",
        message: copy.service.createParentLink,
        status: 503,
        retryable: true,
        cause: createParentLinkError,
      });
    }

    await syncAuthUserMetadataFromAppUser({
      authUserId: learnerAppUser.id,
      appUser: learnerAppUser,
      languageCode: learnerAppUser.preferred_ui_language,
      requestId: input.requestId,
      route: input.route,
    });

    logRuntimeInfo({
      message: "Parent created a managed learner account",
      requestId: input.requestId,
      route: input.route,
      method: "POST",
      actorUserId: input.parentUser.id,
      actorRole: input.parentUser.role,
      targetStudentUserId: learnerAppUser.id,
      details: {
        learner_email_domain: input.payload.learnerEmail.split("@")[1] ?? null,
        is_under_13: isUnder13,
        relationship_label: input.payload.relationshipLabel,
      },
    });

    try {
      await recordAuditEvent({
        actorUserId: input.parentUser.id,
        actorRole: input.parentUser.role,
        action: "parent_managed_learner_create",
        targetTable: "users",
        targetId: learnerAppUser.id,
        studentUserId: learnerAppUser.id,
        metadata: {
          request_id: input.requestId,
          route: input.route,
          is_under_13: isUnder13,
          learner_email_domain: input.payload.learnerEmail.split("@")[1] ?? null,
          relationship_label: input.payload.relationshipLabel,
        },
        requestId: input.requestId,
      });
    } catch {
      // Audit failures are already logged inside the audit service.
    }

    return {
      learner: learnerAppUser,
      relationshipLabel: input.payload.relationshipLabel,
    };
  } catch (error) {
    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId).catch(() => null);
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError({
      code: "service_unavailable",
      message: copy.service.createAppProfile,
      status: 503,
      retryable: true,
      cause: error,
    });
  }
}
