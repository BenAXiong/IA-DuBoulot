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
    label: "Français",
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
    label: "Français",
  },
  {
    value: "en",
    label: "English",
  },
];

type StudentAgeBandValue =
  | ""
  | "six_eight"
  | "nine_ten"
  | "eleven_twelve"
  | "thirteen_fifteen"
  | "sixteen_eighteen";

export type StudentAgeBandOption = {
  value: StudentAgeBandValue;
  label: string;
};

export function getStudentAgeBandOptions(
  languageCode: UiLanguageCode,
): ReadonlyArray<StudentAgeBandOption> {
  switch (languageCode) {
    case "en":
      return [
        { value: "", label: "Select an age band" },
        { value: "six_eight", label: "6-8 years" },
        { value: "nine_ten", label: "9-10 years" },
        { value: "eleven_twelve", label: "11-12 years" },
        { value: "thirteen_fifteen", label: "13-15 years" },
        { value: "sixteen_eighteen", label: "16-18 years" },
      ];
    case "zh":
      return [
        { value: "", label: "選擇年齡區間" },
        { value: "six_eight", label: "6-8 歲" },
        { value: "nine_ten", label: "9-10 歲" },
        { value: "eleven_twelve", label: "11-12 歲" },
        { value: "thirteen_fifteen", label: "13-15 歲" },
        { value: "sixteen_eighteen", label: "16-18 歲" },
      ];
    default:
      return [
        { value: "", label: "Sélectionner une tranche d'âge" },
        { value: "six_eight", label: "6-8 ans" },
        { value: "nine_ten", label: "9-10 ans" },
        { value: "eleven_twelve", label: "11-12 ans" },
        { value: "thirteen_fifteen", label: "13-15 ans" },
        { value: "sixteen_eighteen", label: "16-18 ans" },
      ];
  }
}

export const STUDENT_AGE_BAND_OPTIONS = getStudentAgeBandOptions("fr");

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
