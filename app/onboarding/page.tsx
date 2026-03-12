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
    <PublicShell currentHref={currentHref} languageCode={languageCode}>
      <main className="px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col justify-center gap-6">
          <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.8fr_1.2fr] md:p-8">
            <article className="space-y-4">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                {copy.eyebrow}
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight">
                {copy.title}
              </h1>
              <p className="text-base leading-7 text-[color:var(--ink-soft)]">
                {copy.body}
              </p>
            </article>

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
