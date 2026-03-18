"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getLanguageMenuCopy } from "@/lib/i18n/ui-copy";
import { APP_UI_LANGUAGE_COOKIE_NAME } from "@/lib/i18n/ui-language";
import type { AppUserRecord } from "@/lib/server/auth/types";

type AppLanguageMenuProps = {
  appUser: AppUserRecord;
  variant?: "default" | "minimal";
};

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.75 12h14.5M12 4.75c2 2.05 3.1 4.78 3.1 7.25s-1.1 5.2-3.1 7.25M12 4.75c-2 2.05-3.1 4.78-3.1 7.25s1.1 5.2 3.1 7.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function AppLanguageMenu({
  appUser,
  variant = "default",
}: AppLanguageMenuProps) {
  const router = useRouter();
  const [optimisticLanguage, setOptimisticLanguage] = useState<{
    from: AppUserRecord["preferred_ui_language"];
    to: AppUserRecord["preferred_ui_language"];
  } | null>(
    null,
  );
  const selectedLanguage =
    optimisticLanguage &&
    optimisticLanguage.from === appUser.preferred_ui_language
      ? optimisticLanguage.to
      : appUser.preferred_ui_language;
  const copy = getLanguageMenuCopy(selectedLanguage);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const languages: Array<{
    code: AppUserRecord["preferred_ui_language"];
    label: string;
  }> = [
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" },
    { code: "zh", label: "中文" },
  ];

  function clearCloseTimer() {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

  function openMenu() {
    clearCloseTimer();
    setOpen(true);
  }

  function closeMenuSoon() {
    clearCloseTimer();
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimeoutRef.current = null;
    }, 180);
  }

  useEffect(() => {
    document.documentElement.lang = selectedLanguage;
    document.documentElement.dataset.uiLanguage = selectedLanguage;
    document.cookie = `${APP_UI_LANGUAGE_COOKIE_NAME}=${selectedLanguage}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [selectedLanguage]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        clearCloseTimer();
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      clearCloseTimer();
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function updateLanguage(nextLanguage: AppUserRecord["preferred_ui_language"]) {
    if (nextLanguage === selectedLanguage || isSaving) {
      setOpen(false);
      return;
    }

    setOptimisticLanguage({
      from: appUser.preferred_ui_language,
      to: nextLanguage,
    });
    setOpen(false);
    setIsSaving(true);
    startTransition(() => {
      router.refresh();
    });

    void (async () => {
      try {
        const response = await fetch("/api/auth/profile", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            displayName: appUser.display_name,
            preferredUiLanguage: nextLanguage,
            aiHelpLanguage: appUser.ai_help_language,
            ageBand: appUser.role === "student" ? appUser.age_band : null,
          }),
        });

        if (response.ok) {
          setIsSaving(false);
          return;
        }

        setOptimisticLanguage(null);
        setIsSaving(false);
        startTransition(() => {
          router.refresh();
        });
      } catch {
        setOptimisticLanguage(null);
        setIsSaving(false);
        startTransition(() => {
          router.refresh();
        });
      }
    })();
  }

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenuSoon}
      ref={rootRef}
    >
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={variant === "minimal" ? "theme-toggle theme-toggle--minimal" : "theme-toggle"}
        disabled={isPending || isSaving}
        onClick={() => {
          clearCloseTimer();
          setOpen((value) => !value);
        }}
        title={copy.buttonLabel}
        type="button"
      >
        <span className="sr-only">{copy.buttonLabel}</span>
        <GlobeIcon className="h-[1.1rem] w-[1.1rem] shrink-0 overflow-visible" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-36 rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-2 shadow-[var(--shadow)]">
          <p className="px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-muted)]">
            {copy.menuTitle}
          </p>
          <div className="mt-1 grid gap-1">
            {languages.map((language) => (
              <button
                className={`rounded-[0.95rem] px-3 py-2 text-left text-sm font-medium transition ${
                  language.code === selectedLanguage
                    ? "bg-[color:var(--highlight)] text-[#141414]"
                    : "text-[color:var(--foreground)] hover:bg-[color:var(--surface)]"
                }`}
                disabled={isPending || isSaving}
                key={language.code}
                onClick={() => updateLanguage(language.code)}
                type="button"
              >
                {language.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
