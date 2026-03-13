export const THEME_STORAGE_KEY = "iadb-theme";
export const CUSTOM_THEME_STORAGE_KEY = "iadb-theme-custom";
export const THEME_VERSION_STORAGE_KEY = "iadb-theme-version";
export const THEME_STORAGE_VERSION = "2";
export const THEME_CHANGE_EVENT = "iadb-themechange";
export const THEME_MODES = ["light", "dark", "smooth", "warm", "custom"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

export const THEME_COLOR_SCHEMES: Record<ThemeMode, "light" | "dark"> = {
  light: "light",
  dark: "dark",
  smooth: "dark",
  warm: "light",
  custom: "dark",
};

export const CUSTOM_THEME_FIELDS = [
  "--background",
  "--background-strong",
  "--foreground",
  "--surface",
  "--surface-strong",
  "--surface-raised",
  "--line",
  "--line-strong",
  "--accent",
  "--brand",
  "--highlight",
  "--ink-soft",
  "--panel-top",
  "--panel-bottom",
  "--card-top",
  "--card-bottom",
  "--input-bg",
  "--button-secondary-bg",
] as const;

export type CustomThemeField = (typeof CUSTOM_THEME_FIELDS)[number];
export type CustomThemeRecord = Record<CustomThemeField, string>;

export const DEFAULT_CUSTOM_THEME: CustomThemeRecord = {
  "--background": "#131c27",
  "--background-strong": "#0b1118",
  "--foreground": "#ebf3fb",
  "--surface": "rgba(18, 28, 41, 0.8)",
  "--surface-strong": "rgba(22, 34, 49, 0.95)",
  "--surface-raised": "rgba(26, 39, 56, 0.98)",
  "--line": "rgba(184, 204, 227, 0.1)",
  "--line-strong": "rgba(184, 204, 227, 0.2)",
  "--accent": "#19c59d",
  "--brand": "#7da8ff",
  "--highlight": "#ffb15d",
  "--ink-soft": "rgba(235, 243, 251, 0.76)",
  "--panel-top": "rgba(22, 34, 49, 0.9)",
  "--panel-bottom": "rgba(13, 21, 31, 0.96)",
  "--card-top": "rgba(27, 40, 57, 0.96)",
  "--card-bottom": "rgba(19, 29, 42, 0.98)",
  "--input-bg": "rgba(8, 16, 24, 0.88)",
  "--button-secondary-bg": "rgba(26, 39, 56, 0.92)",
};

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return THEME_MODES.includes(value as ThemeMode);
}

export function isDarkLikeThemeMode(theme: ThemeMode) {
  return theme === "dark" || theme === "smooth" || theme === "custom";
}

function getSystemThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function clearStoredThemePreference() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(THEME_STORAGE_KEY);
  localStorage.removeItem(THEME_VERSION_STORAGE_KEY);
  localStorage.removeItem(CUSTOM_THEME_STORAGE_KEY);
}

export function normalizeCustomTheme(
  value: unknown,
  fallback: CustomThemeRecord = DEFAULT_CUSTOM_THEME,
): CustomThemeRecord {
  const source =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const normalized = { ...fallback };

  for (const field of CUSTOM_THEME_FIELDS) {
    const candidate = source[field];
    if (typeof candidate === "string" && candidate.trim()) {
      normalized[field] = candidate.trim();
    }
  }

  return normalized;
}

export function readStoredCustomTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_CUSTOM_THEME;
  }

  try {
    const storedValue = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
    if (!storedValue) {
      return DEFAULT_CUSTOM_THEME;
    }

    return normalizeCustomTheme(JSON.parse(storedValue));
  } catch {
    return DEFAULT_CUSTOM_THEME;
  }
}

export function resolveClientThemeMode(): ThemeMode {
  if (typeof document === "undefined") {
    return "light";
  }

  const documentTheme = document.documentElement.dataset.theme;

  if (documentTheme === "light" || documentTheme === "dark") {
    return documentTheme;
  }

  return getSystemThemeMode();
}

function dispatchThemeChangeEvent() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function clearCustomThemeFromDocument(root: HTMLElement) {
  for (const field of CUSTOM_THEME_FIELDS) {
    root.style.removeProperty(field);
  }
}

function applyCustomThemeToDocument(root: HTMLElement, customTheme: CustomThemeRecord) {
  for (const field of CUSTOM_THEME_FIELDS) {
    root.style.setProperty(field, customTheme[field]);
  }
}

function applyThemeToDocument(
  root: HTMLElement,
  theme: ThemeMode,
  customTheme: CustomThemeRecord = DEFAULT_CUSTOM_THEME,
) {
  root.dataset.theme = theme;
  root.style.colorScheme = THEME_COLOR_SCHEMES[theme];

  if (theme === "custom") {
    applyCustomThemeToDocument(root, customTheme);
  } else {
    clearCustomThemeFromDocument(root);
  }
}

export function previewThemeMode(
  theme: ThemeMode,
  customTheme: CustomThemeRecord = DEFAULT_CUSTOM_THEME,
) {
  if (typeof document === "undefined") {
    return;
  }

  applyThemeToDocument(document.documentElement, theme, customTheme);
  dispatchThemeChangeEvent();
}

export function persistThemeMode(
  theme: ThemeMode,
  customTheme: CustomThemeRecord = DEFAULT_CUSTOM_THEME,
) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  applyThemeToDocument(document.documentElement, theme, customTheme);
  clearStoredThemePreference();
  dispatchThemeChangeEvent();
}

export function restoreStoredThemeMode() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  clearStoredThemePreference();
  applyThemeToDocument(document.documentElement, getSystemThemeMode());
  dispatchThemeChangeEvent();
}
