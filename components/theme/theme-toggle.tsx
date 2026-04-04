"use client";

import { useSyncExternalStore } from "react";
import { getThemeToggleCopy } from "@/lib/i18n/ui-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import {
  isDarkLikeThemeMode,
  persistThemeMode,
  resolveClientThemeMode,
  restoreStoredThemeMode,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/theme/config";

type ThemeToggleProps = {
  languageCode: UiLanguageCode;
  variant?: "default" | "minimal";
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

function subscribeToThemeChange(callback: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleMediaChange = () => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (!storedTheme) {
      restoreStoredThemeMode();
    }

    callback();
  };
  const handleStorage = () => callback();
  const handleThemeChange = () => callback();

  mediaQuery.addEventListener("change", handleMediaChange);
  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

  return () => {
    mediaQuery.removeEventListener("change", handleMediaChange);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  };
}

export function ThemeToggle({
  languageCode,
  variant = "default",
}: ThemeToggleProps) {
  const copy = getThemeToggleCopy(languageCode);
  const theme: ThemeMode = useSyncExternalStore(
    subscribeToThemeChange,
    resolveClientThemeMode,
    () => "light",
  );
  const nextTheme: ThemeMode = isDarkLikeThemeMode(theme) ? "light" : "dark";
  const ariaLabel = `${copy.label}: ${
    nextTheme === "dark" ? copy.dark : copy.light
  }`;

  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isDarkLikeThemeMode(theme)}
      className={variant === "minimal" ? "theme-toggle theme-toggle--minimal" : "theme-toggle"}
      onClick={() => persistThemeMode(nextTheme)}
      title={ariaLabel}
      type="button"
    >
      <span className="sr-only">{ariaLabel}</span>
      {isDarkLikeThemeMode(theme) ? (
        <SunIcon className={variant === "minimal" ? "h-4 w-4" : "h-5 w-5"} />
      ) : (
        <MoonIcon className={variant === "minimal" ? "h-4 w-4" : "h-5 w-5"} />
      )}
    </button>
  );
}
