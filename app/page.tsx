import { PublicShell } from "@/components/layout/public-shell";
import { PublicLandingPage } from "@/components/landing/public-landing-page";
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
    <PublicShell
      currentHref={`/?lang=${languageCode}`}
      headerVariant="landing"
      languageCode={languageCode}
      showFooter={false}
    >
      <PublicLandingPage
        languageCode={languageCode}
        tutorPlaceholder={{
          contentCards: copy.contentCards,
          featureCards: copy.featureCards,
          sharingCards: copy.sharingCards,
        }}
      />
    </PublicShell>
  );
}
