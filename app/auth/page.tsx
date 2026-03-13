import { AuthPanel } from "@/components/auth/auth-panel";
import { PublicShell } from "@/components/layout/public-shell";
import { getAuthIntentLabel } from "@/lib/i18n/ui-copy";
import {
  buildHrefWithSearchParams,
  readFirstSearchParam,
  resolveUiLanguageFromSearchParam,
} from "@/lib/i18n/ui-language";
import { redirectAuthenticatedUserFromAuthPage } from "@/lib/server/auth/page-guards";

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;
type AuthMode = "sign_in" | "sign_up";
type SignupRole = "student" | "parent" | "tutor";

function parseMode(value: string | null): AuthMode {
  return value === "sign_up" ? "sign_up" : "sign_in";
}

function parseRole(value: string | null): SignupRole {
  if (value === "parent" || value === "tutor") {
    return value;
  }

  return "student";
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
}) {
  await redirectAuthenticatedUserFromAuthPage();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const languageCode = resolveUiLanguageFromSearchParam(
    readFirstSearchParam(resolvedSearchParams.lang),
  );
  const initialError = readFirstSearchParam(resolvedSearchParams.error);
  const initialMessage = readFirstSearchParam(resolvedSearchParams.message);
  const initialMode = parseMode(readFirstSearchParam(resolvedSearchParams.mode));
  const initialRole = parseRole(readFirstSearchParam(resolvedSearchParams.role));
  const inviteToken = readFirstSearchParam(resolvedSearchParams.invite);
  const intentLabel = getAuthIntentLabel(
    languageCode,
    initialRole,
    readFirstSearchParam(resolvedSearchParams.intent),
  );
  const currentHref = buildHrefWithSearchParams("/auth", resolvedSearchParams);

  return (
    <PublicShell
      currentHref={currentHref}
      headerVariant="hud"
      languageCode={languageCode}
      showAuthLink={false}
      showFooter={false}
    >
      <main className="flex h-[calc(100dvh-4.75rem)] px-4 pb-5 pt-1 sm:h-[calc(100dvh-5rem)] sm:px-6 sm:pb-6 lg:h-[calc(100dvh-5.5rem)] lg:px-8 lg:pb-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-center">
          <AuthPanel
            initialError={initialError}
            initialMessage={initialMessage}
            initialMode={initialMode}
            initialRole={initialRole}
            inviteToken={inviteToken}
            intentLabel={intentLabel}
            languageCode={languageCode}
          />
        </div>
      </main>
    </PublicShell>
  );
}
