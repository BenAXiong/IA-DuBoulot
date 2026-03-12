import Link from "next/link";
import { HighlightCard } from "@/components/highlight-card";
import { FloatingHelperMenu } from "@/components/layout/floating-helper-menu";
import { PublicShell } from "@/components/layout/public-shell";
import { getHomePageCopy } from "@/lib/i18n/ui-copy";
import {
  readFirstSearchParam,
  resolveUiLanguageFromSearchParam,
  withUiLanguage,
} from "@/lib/i18n/ui-language";

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const languageCode = resolveUiLanguageFromSearchParam(
    readFirstSearchParam(resolvedSearchParams.lang),
  );
  const copy = getHomePageCopy(languageCode);

  return (
    <PublicShell currentHref={`/?lang=${languageCode}`} languageCode={languageCode}>
      <FloatingHelperMenu languageCode={languageCode} />

      <main className="px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 pb-12">
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="shell-panel page-glow rounded-[2.4rem] px-6 py-7 sm:px-10 sm:py-10">
              <div className="flex flex-wrap gap-2 text-sm text-[color:var(--ink-soft)]">
                {copy.badges.map((badge) => (
                  <span className="soft-chip px-3 py-1" key={badge}>
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.28em] text-[color:var(--ink-soft)]">
                  {copy.eyebrow}
                </p>
                <h1 className="max-w-3xl font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl lg:text-[3.75rem]">
                  {copy.title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[color:var(--ink-soft)] sm:text-lg">
                  {copy.body}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="button-base button-primary"
                  href={withUiLanguage("/auth", languageCode)}
                >
                  {copy.ctas.primary}
                </Link>
                <Link
                  className="button-base button-secondary"
                  href={withUiLanguage("/pricing", languageCode)}
                >
                  {copy.ctas.secondary}
                </Link>
                <Link
                  className="button-base button-secondary"
                  href={withUiLanguage("/#journey", languageCode)}
                >
                  {copy.ctas.journey}
                </Link>
              </div>
            </article>

            <aside className="shell-panel rounded-[2.2rem] px-6 py-7 sm:px-8 sm:py-8">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                {copy.supportCard.eyebrow}
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-heading)] text-3xl leading-tight">
                {copy.supportCard.title}
              </h2>
              <ul className="mt-6 grid gap-3 text-sm leading-6 text-[color:var(--foreground)]">
                {copy.supportCard.items.map((item) => (
                  <li
                    className="rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3"
                    key={item}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {copy.proof.map((item) => (
              <HighlightCard body={item.body} key={item.title} title={item.title} />
            ))}
          </section>

          <section
            className="shell-panel rounded-[2.2rem] px-6 py-7 sm:px-8 sm:py-8"
            id="journey"
          >
            <div className="max-w-2xl space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                {copy.journeyEyebrow}
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
                {copy.journeyTitle}
              </h2>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {copy.journeySteps.map((step) => (
                <HighlightCard body={step.body} key={step.title} title={step.title} />
              ))}
            </div>
          </section>

          <section className="shell-panel rounded-[2.2rem] px-6 py-7 sm:px-8 sm:py-8">
            <div className="max-w-2xl space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                {copy.rolesEyebrow}
              </p>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
                {copy.rolesTitle}
              </h2>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {copy.roles.map((role) => (
                <HighlightCard body={role.body} key={role.title} title={role.title} />
              ))}
            </div>
          </section>

          <section className="shell-panel page-glow rounded-[2.2rem] px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                  {copy.closing.eyebrow}
                </p>
                <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
                  {copy.closing.title}
                </h2>
                <p className="text-base leading-7 text-[color:var(--ink-soft)]">
                  {copy.closing.body}
                </p>
              </div>

              <Link
                className="button-base button-primary w-full justify-center md:w-auto"
                href={withUiLanguage("/auth", languageCode)}
              >
                {copy.closing.cta}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
