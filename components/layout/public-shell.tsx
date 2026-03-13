import Link from "next/link";
import { DocumentLanguageSync } from "@/components/i18n/document-language-sync";
import { LanguageMenu } from "@/components/layout/language-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import { getPublicShellCopy } from "@/lib/i18n/ui-copy";
import { withUiLanguage } from "@/lib/i18n/ui-language";

type PublicShellProps = {
  children: React.ReactNode;
  currentHref: string;
  languageCode: UiLanguageCode;
  showFooter?: boolean;
};

export function PublicShell({
  children,
  currentHref,
  languageCode,
  showFooter = true,
}: PublicShellProps) {
  const copy = getPublicShellCopy(languageCode);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      lang={languageCode}
    >
      <DocumentLanguageSync languageCode={languageCode} />
      <div className="pointer-events-none absolute inset-0 -z-10 muted-grid opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(203,95,44,0.17),transparent_62%)]" />

      <header className="px-5 py-5 sm:px-8 lg:px-12">
        <div className="shell-panel overflow-visible mx-auto flex max-w-[92rem] flex-wrap items-center justify-between gap-4 rounded-[2rem] px-5 py-4 sm:px-6">
          <Link
            className="flex items-center gap-3"
            href={withUiLanguage("/", languageCode)}
          >
            <span className="brand-mark" />
            <p className="brand-wordmark text-sm text-[color:var(--foreground)]">
              IA DuBoulot
            </p>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle languageCode={languageCode} />
            <LanguageMenu
              currentHref={currentHref}
              languageCode={languageCode}
            />
            <Link
              className="button-base button-primary interactive-card"
              href={withUiLanguage("/auth", languageCode)}
            >
              {copy.openApp}
            </Link>
          </div>
        </div>
      </header>

      {children}

      {showFooter ? (
        <footer className="px-5 pb-8 pt-10 sm:px-8 lg:px-12">
          <div className="shell-panel page-glow mx-auto grid max-w-6xl gap-6 rounded-[2rem] p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
            <div className="space-y-4">
              <span className="brand-pill">{copy.footerBadge}</span>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
                {copy.footerTitle}
              </h2>
              <p className="max-w-xl text-sm leading-6 text-[color:var(--ink-soft)]">
                {copy.footerBody}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {copy.footerColumns.map((column) => (
                <article
                  className="shell-card rounded-[1.5rem] p-4"
                  key={column.title}
                >
                  <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                    {column.title}
                  </p>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-[color:var(--foreground)]">
                    {column.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
