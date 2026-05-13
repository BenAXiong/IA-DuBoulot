import "server-only";
import {
  AI_LANGUAGE_CODES,
  UI_LANGUAGE_CODES,
  type AiLanguageCode,
  type UiLanguageCode,
} from "@/lib/i18n/config";

export const APP_USER_ROLES = ["student", "parent", "tutor", "admin"] as const;
export const SELF_BOOTSTRAP_ROLES = ["student", "parent", "tutor"] as const;
export const AGE_BANDS = [
  "six_eight",
  "nine_ten",
  "eleven_twelve",
  "thirteen_fifteen",
  "sixteen_eighteen",
] as const;
export const UNDER_13_AGE_BANDS = [
  "six_eight",
  "nine_ten",
  "eleven_twelve",
] as const;

export { AI_LANGUAGE_CODES, UI_LANGUAGE_CODES };
export type { AiLanguageCode, UiLanguageCode } from "@/lib/i18n/config";

export type AppUserRole = (typeof APP_USER_ROLES)[number];
export type SelfBootstrapRole = (typeof SELF_BOOTSTRAP_ROLES)[number];
export type AgeBand = (typeof AGE_BANDS)[number];
export type AccountStatus =
  | "pending_parent_approval"
  | "active"
  | "suspended"
  | "deletion_requested";

export type AppUserRecord = {
  id: string;
  role: AppUserRole;
  account_status: AccountStatus;
  display_name: string;
  preferred_ui_language: UiLanguageCode;
  ai_help_language: AiLanguageCode;
  age_band: AgeBand | null;
  is_under_13: boolean;
  birth_date: string | null;
  country_of_study: string | null;
  school_name: string | null;
  grade_level: string | null;
  deletion_requested_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthenticatedUserContext = {
  authUserId: string;
  email: string | null;
  appUser: AppUserRecord | null;
};

export type BootstrapProfileInput = {
  role: SelfBootstrapRole;
  displayName: string;
  preferredUiLanguage: UiLanguageCode;
  aiHelpLanguage: AiLanguageCode;
  ageBand: AgeBand | null;
  isUnder13: boolean;
  birthDate: string | null;
  countryOfStudy: string | null;
  schoolName: string | null;
  gradeLevel: string | null;
};

export type UpdateProfileInput = {
  displayName: string;
  preferredUiLanguage: UiLanguageCode;
  aiHelpLanguage: AiLanguageCode;
  ageBand: AgeBand | null;
};
