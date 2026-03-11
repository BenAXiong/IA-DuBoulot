export const UI_LANGUAGE_CODES = ["fr", "en", "zh"] as const;
export const AI_LANGUAGE_CODES = ["fr", "en"] as const;

export type UiLanguageCode = (typeof UI_LANGUAGE_CODES)[number];
export type AiLanguageCode = (typeof AI_LANGUAGE_CODES)[number];

export const UI_LANGUAGE_OPTIONS: ReadonlyArray<{
  value: UiLanguageCode;
  label: string;
  locale: string;
}> = [
  {
    value: "fr",
    label: "Francais",
    locale: "fr-FR",
  },
  {
    value: "en",
    label: "English",
    locale: "en-US",
  },
  {
    value: "zh",
    label: "中文",
    locale: "zh-TW",
  },
];

export const AI_LANGUAGE_OPTIONS: ReadonlyArray<{
  value: AiLanguageCode;
  label: string;
}> = [
  {
    value: "fr",
    label: "Francais",
  },
  {
    value: "en",
    label: "English",
  },
];

export const STUDENT_AGE_BAND_OPTIONS = [
  { value: "", label: "Selectionner une tranche d'age" },
  { value: "six_eight", label: "6-8 ans" },
  { value: "nine_ten", label: "9-10 ans" },
  { value: "eleven_twelve", label: "11-12 ans" },
  { value: "thirteen_fifteen", label: "13-15 ans" },
  { value: "sixteen_eighteen", label: "16-18 ans" },
] as const;

export const UNDER_13_AGE_BAND_VALUES = new Set([
  "six_eight",
  "nine_ten",
  "eleven_twelve",
]);

export function getIntlLocale(languageCode: UiLanguageCode) {
  return (
    UI_LANGUAGE_OPTIONS.find((option) => option.value === languageCode)?.locale ??
    "fr-FR"
  );
}
