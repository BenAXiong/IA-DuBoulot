import Image from "next/image";
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

type MediaPreviewProps = {
  alt: string;
  src: string;
};

type FeatureCardProps = {
  body: string;
  title: string;
};

function MediaPreview({ alt, src }: MediaPreviewProps) {
  return (
    <div className="relative h-full min-h-[21rem] overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-[#0b1020] sm:min-h-[25rem] lg:min-h-0">
      <Image
        alt={alt}
        className="h-full w-full object-cover"
        fill
        sizes="(min-width: 1024px) 60vw, 100vw"
        src={src}
        unoptimized
      />
    </div>
  );
}

function FeatureCard({ body, title }: FeatureCardProps) {
  return (
    <article className="shell-card page-glow h-full rounded-[1.7rem] p-5 sm:p-6">
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
      mediaSrc: "/landing/abstract-flow-1.gif",
      preview: copy.previews.primary,
      reverse: false,
    },
    {
      cards: copy.contentCards,
      mediaSrc: "/landing/abstract-flow-2.gif",
      preview: copy.previews.content,
      reverse: true,
    },
    {
      cards: copy.sharingCards,
      mediaSrc: "/landing/abstract-flow-3.gif",
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
            const sectionLayout = row.reverse
              ? "lg:grid-cols-[minmax(21rem,0.95fr)_minmax(0,1.55fr)]"
              : "lg:grid-cols-[minmax(0,1.55fr)_minmax(21rem,0.95fr)]";
            const mediaBlock = (
              <div className="h-full lg:h-[34rem]">
                <MediaPreview alt={row.preview.title} src={row.mediaSrc} />
              </div>
            );
            const cardsBlock = (
              <div className="grid h-full gap-4 auto-rows-fr lg:h-[34rem] lg:grid-rows-3">
                {row.cards.map((card) => (
                  <FeatureCard body={card.body} key={card.title} title={card.title} />
                ))}
              </div>
            );

            return (
              <section
                className={`${index === 0 ? "" : "mt-24 sm:mt-28 lg:mt-32"} grid items-stretch gap-6 lg:min-h-[34rem] ${sectionLayout} xl:gap-8`}
                key={row.preview.title}
              >
                {row.reverse ? cardsBlock : mediaBlock}
                {row.reverse ? mediaBlock : cardsBlock}
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
