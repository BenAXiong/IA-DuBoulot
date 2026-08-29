import type { UiLanguageCode } from "@/lib/i18n/config";

export type LocalizedSummaryVariant = {
  language_code: UiLanguageCode;
};

export function selectSummaryForLanguage<
  TSummary extends LocalizedSummaryVariant,
>(
  summaries: readonly TSummary[],
  preferredLanguage: UiLanguageCode,
): TSummary | null {
  return (
    summaries.find(
      (summary) => summary.language_code === preferredLanguage,
    ) ??
    summaries.find((summary) => summary.language_code === "fr") ??
    summaries[0] ??
    null
  );
}
