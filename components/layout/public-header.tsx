"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  variant?: "default" | "hud" | "landing";
  showAuthLink?: boolean;
};

function LandingAudienceSelector() {
  const audience = useLandingAudience();

  return (
    <nav
      aria-label="Landing audience"
      className="order-3 flex w-full justify-center sm:order-none sm:w-auto"
    >
      <div className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-1 text-sm font-medium text-[color:var(--ink-soft)]">
        {landingAudienceLabels.map((item) => (
          <button
            aria-pressed={audience === item.value}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
              audience === item.value
                ? "bg-[color:var(--surface-raised)] text-[color:var(--foreground)] shadow-[var(--shadow-soft)]"
                : "text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
            }`}
            key={item.value}
            onClick={() => setLandingAudience(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function PublicHeader({
  currentHref,
  languageCode,
  openAppLabel,
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
    ? "shell-panel shell-panel--allow-overflow flex w-full flex-wrap items-center justify-between gap-4 rounded-none border-x-0 border-t-0 px-5 py-3 sm:px-8 lg:px-12"
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

        {isLandingHeader ? <LandingAudienceSelector /> : null}

        <div className={controlsClassName}>
          <ThemeToggle
            languageCode={languageCode}
            variant={isHudHeader ? "minimal" : "default"}
          />
          {isLandingHeader ? (
            <Link
              aria-label="Pricing"
              className="theme-toggle font-semibold no-underline"
              href={withUiLanguage("/pricing", languageCode)}
              title="Pricing"
            >
              ?
            </Link>
          ) : null}
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
