"use client";

import { useState, useSyncExternalStore } from "react";
import { getThemeCustomizerCopy } from "@/lib/i18n/ui-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import {
  CUSTOM_THEME_FIELDS,
  DEFAULT_CUSTOM_THEME,
  normalizeCustomTheme,
  persistThemeMode,
  previewThemeMode,
  readStoredCustomTheme,
  resolveClientThemeMode,
  restoreStoredThemeMode,
  THEME_CHANGE_EVENT,
  THEME_MODES,
  type CustomThemeField,
  type CustomThemeRecord,
  type ThemeMode,
} from "@/lib/theme/config";

type ThemeMenuProps = {
  languageCode: UiLanguageCode;
};

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 3.75a8.25 8.25 0 1 0 0 16.5h1.25a2 2 0 0 0 0-4H12.5a1.75 1.75 0 0 1 0-3.5h3a4 4 0 0 0 0-8H12Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="8.1" cy="9.1" r="1" fill="currentColor" />
      <circle cx="11.9" cy="7.6" r="1" fill="currentColor" />
      <circle cx="15.7" cy="9.1" r="1" fill="currentColor" />
    </svg>
  );
}

function subscribeToThemeChange(callback: () => void) {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => callback();

  mediaQuery.addEventListener("change", handleChange);
  window.addEventListener("storage", handleChange);
  window.addEventListener(THEME_CHANGE_EVENT, handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(THEME_CHANGE_EVENT, handleChange);
  };
}

export function ThemeMenu({ languageCode }: ThemeMenuProps) {
  const copy = getThemeCustomizerCopy(languageCode);
  const currentTheme = useSyncExternalStore(
    subscribeToThemeChange,
    resolveClientThemeMode,
    () => "light",
  );
  const [open, setOpen] = useState(false);
  const [showCustomEditor, setShowCustomEditor] = useState(
    currentTheme === "custom",
  );
  const [customTheme, setCustomTheme] = useState<CustomThemeRecord>(() =>
    normalizeCustomTheme(readStoredCustomTheme()),
  );

  function handleThemePreview(theme: ThemeMode) {
    if (theme === "custom") {
      previewThemeMode("custom", customTheme);
      setShowCustomEditor(true);
      return;
    }

    previewThemeMode(theme);
    setShowCustomEditor(false);
  }

  function handleCustomFieldChange(field: CustomThemeField, value: string) {
    const nextTheme = normalizeCustomTheme({
      ...customTheme,
      [field]: value,
    });

    setCustomTheme(nextTheme);
    previewThemeMode("custom", nextTheme);
    setShowCustomEditor(true);
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setShowCustomEditor(currentTheme === "custom");
        restoreStoredThemeMode();
      }}
    >
      <button
        className="flex w-full items-center justify-between rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="flex items-center gap-2">
          <PaletteIcon className="h-4 w-4" />
          <span>{copy.entry}</span>
        </span>
        <span aria-hidden="true" className="text-[color:var(--ink-muted)]">
          →
        </span>
      </button>

      {open ? (
        <div className="absolute right-full top-0 z-50 mr-3 w-[min(30rem,calc(100vw-6.5rem))] max-h-[min(80vh,42rem)] overflow-y-auto rounded-[1.6rem] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4 shadow-[var(--shadow)]">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {copy.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
            {copy.hint}
          </p>

          <div className="mt-4 grid gap-2">
            {THEME_MODES.map((theme) => (
              <button
                className={`flex items-center justify-between rounded-[1rem] border px-3 py-2 text-sm font-medium transition ${
                  currentTheme === theme
                    ? "border-[color:var(--line-strong)] bg-[color:var(--foreground)] text-[color:var(--foreground-inverse)]"
                    : "border-[color:var(--line)] bg-[color:var(--surface)] text-[color:var(--foreground)] hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)]"
                }`}
                key={theme}
                onClick={() => {
                  if (theme === "custom") {
                    persistThemeMode("custom", customTheme);
                    setShowCustomEditor(true);
                    return;
                  }

                  persistThemeMode(theme);
                  setShowCustomEditor(false);
                }}
                onMouseEnter={() => handleThemePreview(theme)}
                type="button"
              >
                <span>{copy.themes[theme]}</span>
                {theme === "custom" ? (
                  <span className="text-xs text-[color:var(--ink-muted)]">⋯</span>
                ) : null}
              </button>
            ))}
          </div>

          {showCustomEditor ? (
            <div className="mt-4 rounded-[1.3rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                  {copy.customEditor}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="button-base button-secondary min-h-[2.2rem] px-3 py-1.5 text-xs"
                    onClick={() => {
                      setCustomTheme(DEFAULT_CUSTOM_THEME);
                      previewThemeMode("custom", DEFAULT_CUSTOM_THEME);
                    }}
                    type="button"
                  >
                    {copy.reset}
                  </button>
                  <button
                    className="button-base button-primary min-h-[2.2rem] px-3 py-1.5 text-xs"
                    onClick={() => persistThemeMode("custom", customTheme)}
                    type="button"
                  >
                    {copy.save}
                  </button>
                </div>
              </div>

              <div className="mt-3 grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {CUSTOM_THEME_FIELDS.map((field) => (
                  <label className="grid gap-1 text-xs" key={field}>
                    <span className="font-medium uppercase tracking-[0.12em] text-[color:var(--ink-muted)]">
                      {copy.fields[field]}
                    </span>
                    <input
                      className="field-control rounded-[0.95rem] px-3 py-2 text-sm"
                      onChange={(event) =>
                        handleCustomFieldChange(field, event.target.value)
                      }
                      spellCheck={false}
                      type="text"
                      value={customTheme[field]}
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
