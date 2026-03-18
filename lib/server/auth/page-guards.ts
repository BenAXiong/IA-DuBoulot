import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  APP_UI_LANGUAGE_COOKIE_NAME,
  resolveUiLanguageCode,
} from "@/lib/i18n/ui-language";
import { getAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import type {
  AppUserRecord,
  AuthenticatedUserContext,
} from "@/lib/server/auth/types";

export async function redirectAuthenticatedUserFromAuthPage() {
  const context = await getAuthenticatedUserContext();

  if (!context) {
    return null;
  }

  redirect(context.appUser ? "/app" : "/onboarding");
}

export async function requireSessionForPage(): Promise<AuthenticatedUserContext> {
  const context = await getAuthenticatedUserContext();

  if (!context) {
    redirect("/auth");
  }

  return context;
}

export async function requireOnboardingPageContext() {
  const context = await requireSessionForPage();

  if (context.appUser) {
    redirect("/app");
  }

  return context;
}

export async function requireAppPageContext(): Promise<{
  context: AuthenticatedUserContext;
  appUser: AppUserRecord;
}> {
  const context = await requireSessionForPage();

  if (!context.appUser) {
    redirect("/onboarding");
  }

  const cookieStore = await cookies();
  const overrideLanguage = resolveUiLanguageCode(
    cookieStore.get(APP_UI_LANGUAGE_COOKIE_NAME)?.value,
    context.appUser.preferred_ui_language,
  );
  const appUser =
    overrideLanguage === context.appUser.preferred_ui_language
      ? context.appUser
      : {
          ...context.appUser,
          preferred_ui_language: overrideLanguage,
        };

  return {
    context,
    appUser,
  };
}

export function redirectDeletionRequestedAppUser(appUser: AppUserRecord) {
  if (appUser.role === "admin") {
    return;
  }

  if (appUser.account_status === "deletion_requested") {
    redirect("/app/settings");
  }
}
