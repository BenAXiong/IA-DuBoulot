import type { UiLanguageCode } from "@/lib/server/auth/types";
import type {
  ConversationStatus,
  StudentDashboardStartState,
  StudentDashboardUsageSnapshot,
} from "@/lib/server/student-dashboard/types";

const localeByUiLanguage: Record<UiLanguageCode, string> = {
  fr: "fr-FR",
  en: "en-US",
  zh: "zh-TW",
};

function getLocale(languageCode: UiLanguageCode) {
  return localeByUiLanguage[languageCode] ?? "fr-FR";
}

export function formatDateLabel(
  value: string | null,
  languageCode: UiLanguageCode,
) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(getLocale(languageCode), {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatUsagePeriod(
  usage: StudentDashboardUsageSnapshot,
  languageCode: UiLanguageCode,
) {
  if (!usage.periodStart || !usage.periodEnd) {
    return "Aucune periode mesuree pour l'instant";
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
  return new Intl.NumberFormat(getLocale(languageCode), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function getStartStateLabel(startState: StudentDashboardStartState) {
  switch (startState) {
    case "ready":
      return "Pret";
    case "pending_parent_approval":
      return "En attente parent";
    case "quota_blocked":
      return "Quota bloque";
    case "suspended":
      return "Suspendu";
    case "deletion_requested":
      return "Suppression demandee";
    default:
      return "Statut inconnu";
  }
}

export function getStartStateBody(startState: StudentDashboardStartState) {
  switch (startState) {
    case "ready":
      return "Le compte peut lancer un nouveau devoir et reprendre les sessions recentes.";
    case "pending_parent_approval":
      return "Le prochain devoir reste bloque tant qu'un parent n'a pas active le lien de supervision.";
    case "quota_blocked":
      return "Le compte a atteint sa limite d'essai ou de quota. La reprise passe maintenant par le statut de facturation et le renouvellement de la periode.";
    case "suspended":
      return "Le compte ne peut pas demarrer de nouveau devoir tant que la suspension n'est pas levee.";
    case "deletion_requested":
      return "Le compte reste gele pendant la file de suppression et n'accepte plus de nouvelle activite.";
    default:
      return "Le statut de depart ne peut pas etre resolu.";
  }
}

export function getConversationStatusLabel(status: ConversationStatus) {
  switch (status) {
    case "active":
      return "En cours";
    case "completed":
      return "Terminee";
    case "archived":
      return "Archivee";
    default:
      return "Statut inconnu";
  }
}
