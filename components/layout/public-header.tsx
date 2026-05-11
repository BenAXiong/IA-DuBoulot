"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  landingAudienceLabels,
  setLandingAudience,
  useLandingAudience,
} from "@/components/landing/landing-audience-store";
import { LanguageMenu } from "@/components/layout/language-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import { withUiLanguage } from "@/lib/i18n/ui-language";

type PublicHeaderProps = {
  currentHref: string;
  languageCode: UiLanguageCode;
  openAppLabel: string;
  showLandingAudienceSelector?: boolean;
  variant?: "default" | "hud" | "landing";
  showAuthLink?: boolean;
};

function getLandingHeaderCopy(languageCode: UiLanguageCode) {
  if (languageCode === "fr") {
    return {
      audienceLabels: {
        parent: "Parent",
        student: "Élève",
        tutor: "Tuteur",
      },
      faq: "FAQ",
      help: "Aide",
      pricing: "Tarifs",
      tutorUnavailable:
        "Les comptes tuteurs sont en cours d'implémentation. Contactez-nous si vous souhaitez les essayer en avant-première.",
    };
  }

  if (languageCode === "zh") {
    return {
      audienceLabels: {
        parent: "家長",
        student: "學生",
        tutor: "家教",
      },
      faq: "FAQ",
      help: "說明",
      pricing: "方案",
      tutorUnavailable:
        "家教帳號正在實作中。如果你想提早試用，請聯絡我們。",
    };
  }

  return {
    audienceLabels: {
      parent: "Parent",
      student: "Student",
      tutor: "Tutor",
    },
    faq: "FAQ",
    help: "Help",
    pricing: "Pricing",
    tutorUnavailable:
      "Tutor accounts are being implemented. Contact us if you want to try it out early.",
  };
}

function LandingAudienceSelector({ languageCode }: { languageCode: UiLanguageCode }) {
  const audience = useLandingAudience();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const copy = getLandingHeaderCopy(languageCode);
  const tutorUnavailableMessage = copy.tutorUnavailable;

  function showTutorUnavailableToast() {
    setToastMessage(tutorUnavailableMessage);
  }

  useEffect(() => {
    if (audience === "tutor") {
      setLandingAudience("parent");
    }
  }, [audience]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(null), 3600);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  return (
    <nav
      aria-label="Landing audience"
      className="order-3 flex w-full justify-center sm:order-none sm:w-auto"
    >
      <div className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-1 text-sm font-medium text-[color:var(--ink-soft)]">
        {landingAudienceLabels.map((item) => {
          const isTutor = item.value === "tutor";

          return (
            <button
              aria-pressed={!isTutor && audience === item.value}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
                !isTutor && audience === item.value
                  ? "bg-[color:var(--surface-raised)] text-[color:var(--foreground)] shadow-[var(--shadow-soft)]"
                  : isTutor
                    ? "cursor-not-allowed text-[color:var(--ink-muted)] opacity-60 hover:text-[color:var(--ink-muted)]"
                    : "text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
              }`}
              data-unavailable={isTutor ? "true" : undefined}
              key={item.value}
              onClick={() => {
                if (isTutor) {
                  showTutorUnavailableToast();
                  return;
                }

                setLandingAudience(item.value);
              }}
              title={isTutor ? tutorUnavailableMessage : undefined}
              type="button"
            >
              {copy.audienceLabels[item.value]}
            </button>
          );
        })}
      </div>
      {toastMessage ? (
        <div
          aria-live="polite"
          className="fixed left-1/2 top-24 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.35rem] border border-[color:var(--line-strong)] bg-[color:var(--surface-raised)] p-4 text-center text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-soft)] backdrop-blur-2xl"
          role="status"
        >
          {toastMessage}
        </div>
      ) : null}
    </nav>
  );
}

function HeaderHelpMenu({ languageCode }: { languageCode: UiLanguageCode }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const copy = getLandingHeaderCopy(languageCode);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      className="relative"
      onBlurCapture={(event) => {
        if (!(event.relatedTarget instanceof Node)) {
          setIsOpen(false);
          return;
        }

        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
      onFocusCapture={() => setIsOpen(true)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      ref={menuRef}
    >
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={copy.help}
        className="theme-toggle font-semibold"
        onClick={() => setIsOpen((current) => !current)}
        title={copy.help}
        type="button"
      >
        ?
      </button>
      {isOpen ? (
        <div
          className="absolute left-1/2 top-full z-50 grid min-w-44 -translate-x-1/2 gap-1 pt-3 text-sm"
          role="menu"
        >
          <div className="grid gap-1 rounded-[1.2rem] border border-[color:var(--line-strong)] bg-[color:var(--surface-raised)] p-2 shadow-[var(--shadow-soft)] backdrop-blur-2xl">
            <button
              className="rounded-full px-4 py-2 text-left font-semibold text-[color:var(--ink-muted)]"
              disabled
              role="menuitem"
              type="button"
            >
              {copy.faq}
            </button>
            <Link
              className="rounded-full px-4 py-2 font-semibold text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]"
              href={withUiLanguage("/pricing", languageCode)}
              onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            {copy.pricing}
          </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PublicHeader({
  currentHref,
  languageCode,
  openAppLabel,
  showLandingAudienceSelector = true,
  variant = "default",
  showAuthLink = true,
}: PublicHeaderProps) {
  const [hidden, setHidden] = useState(false);
  const isHudHeader = variant === "hud";
  const isLandingHeader = variant === "landing";

  useEffect(() => {
    if (!isLandingHeader) {
      return;
    }

    let lastY = window.scrollY;
    let ticking = false;

    function updateHeader() {
      const nextY = window.scrollY;
      const delta = nextY - lastY;

      if (nextY < 48 || delta < -8) {
        setHidden(false);
      } else if (delta > 8 && nextY > 96) {
        setHidden(true);
      }

      lastY = nextY;
      ticking = false;
    }

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLandingHeader]);

  const headerClassName = isLandingHeader
    ? "fixed inset-x-0 top-0 z-40 transition-transform duration-200"
    : isHudHeader
      ? "px-4 pt-4 sm:px-6 lg:px-8"
      : "px-5 py-5 sm:px-8 lg:px-12";
  const panelClassName = isLandingHeader
    ? "shell-panel shell-panel--allow-overflow flex w-full flex-wrap items-center justify-between gap-4 rounded-none border-x-0 border-t-0 px-5 py-3 sm:px-8 lg:px-36"
    : isHudHeader
      ? "mx-auto flex max-w-6xl items-center justify-between gap-4"
      : "shell-panel shell-panel--allow-overflow mx-auto flex max-w-[92rem] flex-wrap items-center justify-between gap-4 rounded-[2rem] px-5 py-4 sm:px-6";
  const controlsClassName = isHudHeader
    ? "flex items-center gap-1"
    : "flex flex-wrap items-center justify-end gap-2";

  return (
    <header
      className={headerClassName}
      style={
        isLandingHeader
          ? { transform: hidden ? "translateY(-100%)" : "translateY(0)" }
          : undefined
      }
    >
      <div className={panelClassName}>
        <Link
          className={isHudHeader ? "flex items-center gap-2.5" : "flex items-center gap-3"}
          href={withUiLanguage("/", languageCode)}
        >
          <span className={isHudHeader ? "brand-mark brand-mark--mini" : "brand-mark"} />
          <p className={`brand-wordmark text-[color:var(--foreground)] ${isHudHeader ? "text-xs" : "text-sm"}`}>
            IA DuBoulot
          </p>
        </Link>

        {isLandingHeader && showLandingAudienceSelector ? (
          <LandingAudienceSelector languageCode={languageCode} />
        ) : null}

        <div className={controlsClassName}>
          <ThemeToggle
            languageCode={languageCode}
            variant={isHudHeader ? "minimal" : "default"}
          />
          {isLandingHeader ? <HeaderHelpMenu languageCode={languageCode} /> : null}
          <LanguageMenu
            currentHref={currentHref}
            languageCode={languageCode}
            variant={isHudHeader ? "minimal" : "default"}
          />
          {showAuthLink ? (
            <Link
              className="button-base button-primary interactive-card"
              href={withUiLanguage("/auth", languageCode)}
            >
              {openAppLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
