import "server-only";

import { AppError } from "@/lib/server/errors/app-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AppUserRecord,
  AppUserRole,
  AuthenticatedUserContext,
} from "@/lib/server/auth/types";

export async function getAuthenticatedUserContext(): Promise<AuthenticatedUserContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new AppError({
      code: "unauthenticated",
      message: "Authentication is required.",
      status: 401,
    });
  }

  if (!user) {
    return null;
  }

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select(
      "id, role, account_status, display_name, preferred_ui_language, ai_help_language, age_band, is_under_13, deletion_requested_at, created_at, updated_at",
    )
    .eq("id", user.id)
    .maybeSingle<AppUserRecord>();

  if (appUserError) {
    throw new AppError({
      code: "service_unavailable",
      message: "Unable to load the authenticated profile.",
      status: 503,
      retryable: true,
      cause: appUserError,
    });
  }

  return {
    authUserId: user.id,
    email: user.email ?? null,
    appUser,
  };
}

export async function requireAuthenticatedUserContext() {
  const context = await getAuthenticatedUserContext();

  if (!context) {
    throw new AppError({
      code: "unauthenticated",
      message: "Authentication is required.",
      status: 401,
    });
  }

  return context;
}

export function requireAppUserContext(context: AuthenticatedUserContext) {
  if (!context.appUser) {
    throw new AppError({
      code: "not_found",
      message: "App profile not found. Run profile bootstrap first.",
      status: 404,
    });
  }

  return context.appUser;
}

export function requireAppUserRole(
  appUser: AppUserRecord,
  allowedRoles: AppUserRole[],
) {
  if (!allowedRoles.includes(appUser.role)) {
    throw new AppError({
      code: "forbidden",
      message: "You do not have access to this action.",
      status: 403,
    });
  }

  return appUser;
}

export function requireSelfAccess(
  context: AuthenticatedUserContext,
  targetUserId: string,
) {
  if (context.authUserId !== targetUserId) {
    throw new AppError({
      code: "forbidden",
      message: "You do not have access to this resource.",
      status: 403,
    });
  }
}
