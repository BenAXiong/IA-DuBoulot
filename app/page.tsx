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

function PreviewCard({ body, label, steps, title }: PreviewCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[2.2rem] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-6 shadow-[var(--shadow)]">
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

  return (
    <PublicShell
      currentHref={`/?lang=${languageCode}`}
      languageCode={languageCode}
      showFooter={false}
    >
      <FloatingHelperMenu languageCode={languageCode} />

      <main className="px-5 pb-12 pt-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <section className="py-10 sm:py-16 lg:py-24">
            <div className="max-w-5xl">
              <h1 className="max-w-4xl font-[family-name:var(--font-heading)] text-5xl leading-[0.96] sm:text-6xl lg:text-[5.8rem]">
                {copy.heroTitle}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--ink-soft)]">
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

          <section className="grid gap-6 rounded-[2.4rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.08fr_0.92fr] lg:p-8">
            <PreviewCard
              body={copy.previews.primary.body}
              label={copy.previews.primary.label}
              steps={copy.previews.primary.steps}
              title={copy.previews.primary.title}
            />

            <div className="grid gap-4">
              {copy.featureCards.map((card) => (
                <article
                  className="rounded-[1.6rem] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-5 shadow-[var(--shadow-soft)]"
                  key={card.title}
                >
                  <h2 className="font-[family-name:var(--font-heading)] text-xl leading-tight">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                    {card.body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {copy.sections.map((section, index) => {
            const preview = index === 0 ? copy.previews.content : copy.previews.sharing;
            const previewOrder = index % 2 === 0 ? "lg:order-1" : "lg:order-2";
            const textOrder = index % 2 === 0 ? "lg:order-2" : "lg:order-1";

            return (
              <section
                className="mt-8 grid gap-6 rounded-[2.4rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[0.96fr_1.04fr] lg:p-8"
                key={section.title}
              >
                <div className={previewOrder}>
                  <PreviewCard
                    body={preview.body}
                    label={preview.label}
                    steps={preview.steps}
                    title={preview.title}
                  />
                </div>

                <article className={`flex items-center ${textOrder}`}>
                  <div className="max-w-2xl">
                    <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
                      {section.title}
                    </h2>
                    <p className="mt-5 text-base leading-7 text-[color:var(--ink-soft)] sm:text-lg">
                      {section.body}
                    </p>
                  </div>
                </article>
              </section>
            );
          })}

          <section className="py-12 sm:py-16">
            <div className="shell-panel page-glow flex flex-col gap-5 rounded-[2.4rem] px-6 py-7 sm:px-8 sm:py-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
                  {copy.closingTitle}
                </h2>
                <p className="mt-4 text-base leading-7 text-[color:var(--ink-soft)]">
                  {copy.closingBody}
                </p>
              </div>

              <Link
                className="button-base button-primary w-full justify-center md:w-auto"
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
