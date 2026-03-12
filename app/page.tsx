import Link from "next/link";
import { HighlightCard } from "@/components/highlight-card";
import { PublicShell } from "@/components/layout/public-shell";
import { getHomePageCopy } from "@/lib/i18n/ui-copy";
import {
  readFirstSearchParam,
  resolveUiLanguageFromSearchParam,
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
      <main className="px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-8">
        <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] backdrop-blur md:grid-cols-[1.25fr_0.75fr] md:p-10">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 text-sm text-[color:var(--ink-soft)]">
              {copy.badges.map((badge) => (
                <span className="soft-chip px-3 py-1" key={badge}>
                  {badge}
                </span>
              ))}
            </div>

            <div className="space-y-4">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.28em] text-[color:var(--ink-soft)]">
                {copy.eyebrow}
              </p>
              <h1 className="max-w-3xl font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl lg:text-6xl">
                {copy.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[color:var(--ink-soft)] sm:text-lg">
                {copy.body}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="button-base button-primary"
                href={`/auth?lang=${languageCode}`}
              >
                {copy.ctas.auth}
              </Link>
              <Link
                className="button-base button-secondary"
                href={`/auth?mode=sign_up&role=student&lang=${languageCode}`}
              >
                {copy.ctas.student}
              </Link>
              <Link
                className="button-base button-secondary"
                href={`/auth?mode=sign_up&role=parent&intent=parent_link&lang=${languageCode}`}
              >
                {copy.ctas.parent}
              </Link>
              <Link
                className="button-base button-secondary"
                href={`/auth?mode=sign_up&role=tutor&intent=tutor_link&lang=${languageCode}`}
              >
                {copy.ctas.tutor}
              </Link>
              <a
                className="button-base button-primary"
                href="https://github.com/BenAXiong/IA-DuBoulot"
                rel="noreferrer"
                target="_blank"
              >
                {copy.ctas.github}
              </a>
              <a
                className="button-base button-secondary"
                href="https://vercel.com/bmavmartinez-8475s-projects/ia-du-boulot"
                rel="noreferrer"
                target="_blank"
              >
                {copy.ctas.vercel}
              </a>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              {copy.currentTrackTitle}
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--foreground)]">
              {copy.buildTrack.map((item) => (
                <li className="flex gap-3" key={item}>
                  <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {copy.pillars.map((pillar) => (
            <HighlightCard
              body={pillar.body}
              key={pillar.title}
              title={pillar.title}
            />
          ))}
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.88fr_1.12fr] md:p-8">
          <article className="space-y-4">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
              {copy.publicTrackEyebrow}
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
              {copy.publicTrackTitle}
            </h2>
            <p className="text-base leading-7 text-[color:var(--ink-soft)]">
              {copy.publicTrackBody}
            </p>
          </article>

          <article className="grid gap-4 sm:grid-cols-2">
            <HighlightCard
              body={copy.appShell.body}
              title={copy.appShell.title}
            />
            <HighlightCard
              body={copy.pricingShell.body}
              title={copy.pricingShell.title}
            />
          </article>
        </section>
        </div>
      </main>
    </PublicShell>
  );
}
