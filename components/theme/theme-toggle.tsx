"use client";

import { useState, useSyncExternalStore } from "react";
import { getThemeToggleCopy } from "@/lib/i18n/ui-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import {
  isThemeMode,
  THEME_MODES,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/theme/config";

type ThemeToggleProps = {
  languageCode: UiLanguageCode;
};

function resolveClientTheme(): ThemeMode {
  const documentTheme = document.documentElement.dataset.theme;

  if (isThemeMode(documentTheme)) {
    return documentTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function subscribeToThemeChange(callback: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => callback();

  mediaQuery.addEventListener("change", handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function ThemeToggle({ languageCode }: ThemeToggleProps) {
  const copy = getThemeToggleCopy(languageCode);
  const systemTheme = useSyncExternalStore(
    subscribeToThemeChange,
    resolveClientTheme,
    () => "light",
  );
  const [manualTheme, setManualTheme] = useState<ThemeMode | null>(null);
  const theme = manualTheme ?? systemTheme;

  return (
    <div className="theme-toggle">
      <span className="theme-toggle-label hidden xl:inline">{copy.label}</span>
      {THEME_MODES.map((mode) => (
        <button
          aria-pressed={theme === mode}
          className="theme-toggle-option"
          data-active={theme === mode}
          key={mode}
          onClick={() => {
            applyTheme(mode);
            setManualTheme(mode);
          }}
          type="button"
        >
          {mode === "light" ? copy.light : copy.dark}
        </button>
      ))}
    </div>
  );
}
