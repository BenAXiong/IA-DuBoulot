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
    <PublicShell currentHref={currentHref} languageCode={languageCode} showFooter={false}>
      <main className="px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center">
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
