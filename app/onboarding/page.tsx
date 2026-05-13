import { OnboardingForm } from "@/components/auth/onboarding-form";
import { PublicShell } from "@/components/layout/public-shell";
import { getOnboardingPageCopy } from "@/lib/i18n/ui-copy";
import {
  buildHrefWithSearchParams,
  readFirstSearchParam,
  resolveUiLanguageFromSearchParam,
} from "@/lib/i18n/ui-language";
import { requireOnboardingPageContext } from "@/lib/server/auth/page-guards";

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;

function parseDefaultRole(value: string | null) {
  if (value === "parent" || value === "tutor") {
    return value;
  }

  return "student" as const;
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
}) {
  const context = await requireOnboardingPageContext();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const languageCode = resolveUiLanguageFromSearchParam(
    readFirstSearchParam(resolvedSearchParams.lang),
    context.appUser?.preferred_ui_language ?? "fr",
  );
  const defaultRole = parseDefaultRole(
    readFirstSearchParam(resolvedSearchParams.role),
  );
  const copy = getOnboardingPageCopy(languageCode);
  const currentHref = buildHrefWithSearchParams("/onboarding", resolvedSearchParams);

  return (
    <PublicShell
      currentHref={currentHref}
      headerVariant="hud"
      languageCode={languageCode}
      showAuthLink={false}
      showFooter={false}
    >
      <main className="flex min-h-[calc(100dvh-4.75rem)] px-4 pb-5 pt-1 sm:min-h-[calc(100dvh-5rem)] sm:px-6 sm:pb-6 lg:min-h-[calc(100dvh-5.5rem)] lg:px-8 lg:pb-8">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-center">
          <section className="shell-panel grid w-full gap-6 rounded-[2rem] border border-[color:var(--line)] p-6 shadow-[var(--shadow)] md:p-8">
            <h1 className="text-center font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
              {copy.title}
            </h1>

            <article>
              <OnboardingForm
                defaultRole={defaultRole}
                initialPreferredUiLanguage={languageCode}
                inviteToken={readFirstSearchParam(resolvedSearchParams.invite)}
                languageCode={languageCode}
              />
            </article>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
