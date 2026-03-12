import Link from "next/link";
import { HighlightCard } from "@/components/highlight-card";
import { PublicShell } from "@/components/layout/public-shell";
import { getPricingPageCopy } from "@/lib/i18n/ui-copy";
import {
  readFirstSearchParam,
  resolveUiLanguageFromSearchParam,
} from "@/lib/i18n/ui-language";

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;

export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const languageCode = resolveUiLanguageFromSearchParam(
    readFirstSearchParam(resolvedSearchParams.lang),
  );
  const copy = getPricingPageCopy(languageCode);

  return (
    <PublicShell
      currentHref={`/pricing?lang=${languageCode}`}
      languageCode={languageCode}
    >
      <main className="px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[1fr_0.9fr] md:p-8">
            <article className="space-y-4">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                {copy.eyebrow}
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
                {copy.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[color:var(--ink-soft)]">
                {copy.body}
              </p>
            </article>

            <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <HighlightCard
                body={copy.posture.body}
                title={copy.posture.title}
              />
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {copy.tiers.map((tier) => (
              <article
                className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
                key={tier.name}
              >
                <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
                  {tier.name}
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl">
                  {tier.price}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                  {tier.body}
                </p>
                <ul className="mt-5 grid gap-2 text-sm leading-6">
                  {tier.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="flex flex-wrap gap-3">
            <Link
              className="button-base button-primary"
              href={`/auth?lang=${languageCode}`}
            >
              {copy.ctas.auth}
            </Link>
            <Link
              className="button-base button-secondary"
              href={`/?lang=${languageCode}`}
            >
              {copy.ctas.back}
            </Link>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
