"use client";

import { useState, useSyncExternalStore } from "react";
import { getThemeToggleCopy } from "@/lib/i18n/ui-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import {
  isThemeMode,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/theme/config";

type ThemeToggleProps = {
  languageCode: UiLanguageCode;
};

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.55 5.45l-1.75 1.75M7.2 16.8l-1.75 1.75M18.55 18.55l-1.75-1.75M7.2 7.2 5.45 5.45"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M20.2 14.35A8.25 8.25 0 0 1 9.65 3.8 8.25 8.25 0 1 0 20.2 14.35Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

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
  const nextTheme = theme === "light" ? "dark" : "light";
  const ariaLabel = `${copy.label}: ${
    nextTheme === "dark" ? copy.dark : copy.light
  }`;

  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={theme === "dark"}
      className="theme-toggle"
      onClick={() => {
        applyTheme(nextTheme);
        setManualTheme(nextTheme);
      }}
      title={ariaLabel}
      type="button"
    >
      <span className="sr-only">{ariaLabel}</span>
      {theme === "dark" ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
}
