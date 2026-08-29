import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  APP_UI_LANGUAGE_COOKIE_NAME,
  resolveUiLanguageCode,
  withUiLanguage,
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

  const languageCode = await getRequestUiLanguage(
    context.appUser?.preferred_ui_language,
  );

  redirect(
    withUiLanguage(context.appUser ? "/app" : "/onboarding", languageCode),
  );
}

async function getRequestUiLanguage(fallback?: AppUserRecord["preferred_ui_language"]) {
  const cookieStore = await cookies();

  return resolveUiLanguageCode(
    cookieStore.get(APP_UI_LANGUAGE_COOKIE_NAME)?.value,
    fallback,
  );
}

export async function requireSessionForPage(): Promise<AuthenticatedUserContext> {
  const context = await getAuthenticatedUserContext();

  if (!context) {
    redirect(withUiLanguage("/auth", await getRequestUiLanguage()));
  }

  return context;
}

export async function requireOnboardingPageContext() {
  const context = await requireSessionForPage();

  if (context.appUser) {
    redirect(
      withUiLanguage(
        "/app",
        await getRequestUiLanguage(context.appUser.preferred_ui_language),
      ),
    );
  }

  return context;
}

export async function requireAppPageContext(): Promise<{
  context: AuthenticatedUserContext;
  appUser: AppUserRecord;
}> {
  const context = await requireSessionForPage();

  if (!context.appUser) {
    redirect(
      withUiLanguage("/onboarding", await getRequestUiLanguage()),
    );
  }

  const overrideLanguage = await getRequestUiLanguage(
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
