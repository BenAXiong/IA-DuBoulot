import { PostConfirmRedirect } from "@/components/auth/post-confirm-redirect";
import { PublicShell } from "@/components/layout/public-shell";
import { getAuthCompleteCopy } from "@/lib/i18n/ui-copy";
import {
  buildHrefWithSearchParams,
  readFirstSearchParam,
  resolveUiLanguageFromSearchParam,
  withUiLanguage,
} from "@/lib/i18n/ui-language";
import { sanitizeRelativeRedirectPath } from "@/lib/auth/redirect-path";

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;

export default async function AuthCompletePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const languageCode = resolveUiLanguageFromSearchParam(
    readFirstSearchParam(resolvedSearchParams.lang),
  );
  const nextPath = sanitizeRelativeRedirectPath(
    readFirstSearchParam(resolvedSearchParams.next),
  );
  const copy = getAuthCompleteCopy(languageCode);
  const currentHref = buildHrefWithSearchParams(
    "/auth/complete",
    resolvedSearchParams,
  );

  return (
    <PublicShell currentHref={currentHref} languageCode={languageCode}>
      <main className="px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col justify-center">
          <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                {copy.eyebrow}
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight">
                {copy.title}
              </h1>
              <p className="text-base leading-7 text-[color:var(--ink-soft)]">
                {copy.body}
              </p>
            </div>

            <PostConfirmRedirect
              languageCode={languageCode}
              nextPath={withUiLanguage(nextPath, languageCode)}
            />
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
