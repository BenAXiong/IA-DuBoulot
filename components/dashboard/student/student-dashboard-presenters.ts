import { getIntlLocale, type UiLanguageCode } from "@/lib/i18n/config";
import {
  getLocalizedConversationStatusLabel,
  getLocalizedStartStateBody,
  getLocalizedStartStateLabel,
} from "@/lib/i18n/dashboard-copy";
import type {
  ConversationStatus,
  StudentDashboardStartState,
  StudentDashboardUsageSnapshot,
} from "@/lib/server/student-dashboard/types";

export function formatDateLabel(
  value: string | null,
  languageCode: UiLanguageCode,
) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(getIntlLocale(languageCode), {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatUsagePeriod(
  usage: StudentDashboardUsageSnapshot,
  languageCode: UiLanguageCode,
) {
  if (!usage.periodStart || !usage.periodEnd) {
    if (languageCode === "en") {
      return "No measured usage window yet";
    }

    if (languageCode === "zh") {
      return "目前還沒有已量測的使用期間";
    }

    return "Aucune période mesurée pour l'instant";
  }

  return `${formatDateLabel(usage.periodStart, languageCode)} -> ${formatDateLabel(
    usage.periodEnd,
    languageCode,
  )}`;
}

export function formatCompactNumber(
  value: number,
  languageCode: UiLanguageCode,
) {
  return new Intl.NumberFormat(getIntlLocale(languageCode), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function getStartStateLabel(
  startState: StudentDashboardStartState,
  languageCode: UiLanguageCode = "fr",
) {
  return getLocalizedStartStateLabel(startState, languageCode);
}

export function getStartStateBody(
  startState: StudentDashboardStartState,
  languageCode: UiLanguageCode = "fr",
) {
  return getLocalizedStartStateBody(startState, languageCode);
}

export function getConversationStatusLabel(
  status: ConversationStatus,
  languageCode: UiLanguageCode = "fr",
) {
  return getLocalizedConversationStatusLabel(status, languageCode);
}
