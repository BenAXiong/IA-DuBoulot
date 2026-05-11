import { PublicShell } from "@/components/layout/public-shell";
import { PublicPricingPage } from "@/components/pricing/public-pricing-page";
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
      headerVariant="landing"
      languageCode={languageCode}
      showFooter={false}
      showLandingAudienceSelector={false}
    >
      <PublicPricingPage copy={copy} languageCode={languageCode} />
    </PublicShell>
  );
}
