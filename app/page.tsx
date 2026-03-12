import Link from "next/link";
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

type PreviewCardProps = {
  body: string;
  label: string;
  steps: string[];
  title: string;
};

type FeatureCardProps = {
  body: string;
  title: string;
};

function PreviewCard({ body, label, steps, title }: PreviewCardProps) {
  return (
    <div className="shell-panel page-glow relative rounded-[2.35rem] p-6 sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(46,109,179,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(203,95,44,0.16),transparent_28%)]" />
      <div className="relative">
        <span className="soft-chip px-3 py-1">{label}</span>
        <h3 className="mt-4 font-[family-name:var(--font-heading)] text-2xl leading-tight">
          {title}
        </h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--ink-soft)]">
          {body}
        </p>

        <div className="mt-6 grid gap-3">
          {steps.map((step) => (
            <div
              className="rounded-[1.2rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[color:var(--foreground)]"
              key={step}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ body, title }: FeatureCardProps) {
  return (
    <article className="shell-card page-glow rounded-[1.7rem] p-5 sm:p-6">
      <h2 className="font-[family-name:var(--font-heading)] text-xl leading-tight">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
        {body}
      </p>
    </article>
  );
}

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
  const signupHref = withUiLanguage(
    "/auth?mode=sign_up&role=student",
    languageCode,
  );
  const featureRows = [
    {
      cards: copy.featureCards,
      preview: copy.previews.primary,
      reverse: false,
    },
    {
      cards: copy.contentCards,
      preview: copy.previews.content,
      reverse: true,
    },
    {
      cards: copy.sharingCards,
      preview: copy.previews.sharing,
      reverse: false,
    },
  ];

  return (
    <PublicShell
      currentHref={`/?lang=${languageCode}`}
      languageCode={languageCode}
      showFooter={false}
    >
      <FloatingHelperMenu languageCode={languageCode} />

      <main className="px-5 pb-16 pt-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[92rem]">
          <section className="py-12 text-center sm:py-20 lg:py-24">
            <div className="mx-auto max-w-5xl">
              <h1 className="mx-auto max-w-5xl font-[family-name:var(--font-heading)] text-5xl leading-[0.96] sm:text-6xl lg:text-[6.2rem]">
                {copy.heroTitle}
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[color:var(--ink-soft)]">
                {copy.heroBody}
              </p>
              <Link
                className="button-base button-primary mt-8"
                href={signupHref}
              >
                {copy.heroCta}
              </Link>
            </div>
          </section>

          {featureRows.map((row, index) => {
            const previewOrder = row.reverse ? "lg:order-2" : "lg:order-1";
            const cardsOrder = row.reverse ? "lg:order-1" : "lg:order-2";

            return (
              <section
                className={`${index === 0 ? "" : "mt-10"} grid items-center gap-6 lg:grid-cols-[1.08fr_0.92fr] xl:gap-8`}
                key={row.preview.title}
              >
                <div className={previewOrder}>
                  <PreviewCard
                    body={row.preview.body}
                    label={row.preview.label}
                    steps={row.preview.steps}
                    title={row.preview.title}
                  />
                </div>

                <div className={`grid gap-4 ${cardsOrder}`}>
                  {row.cards.map((card) => (
                    <FeatureCard body={card.body} key={card.title} title={card.title} />
                  ))}
                </div>
              </section>
            );
          })}

          <section className="py-14 text-center sm:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
                {copy.closingTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-[color:var(--ink-soft)]">
                {copy.closingBody}
              </p>
              <Link
                className="button-base button-primary mt-8"
                href={signupHref}
              >
                {copy.closingCta}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
