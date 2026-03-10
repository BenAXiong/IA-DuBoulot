import "server-only";

import { redirect } from "next/navigation";
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

  return {
    context,
    appUser: context.appUser,
  };
}
