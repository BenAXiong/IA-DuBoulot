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
      languageCode={languageCode}
      showFooter={false}
    >
      <main className="px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-2xl flex-col justify-center">
          <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:p-8">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                {copy.eyebrow}
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
                {copy.title}
              </h1>
              <p className="text-base leading-7 text-[color:var(--ink-soft)]">
                {copy.body}
              </p>
            </div>

            <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <OnboardingForm
                defaultRole={defaultRole}
                email={context.email}
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
