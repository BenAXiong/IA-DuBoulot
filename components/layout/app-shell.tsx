import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DocumentLanguageSync } from "@/components/i18n/document-language-sync";
import { AppToolbarControls } from "@/components/layout/app-toolbar-controls";
import {
  getAppShellCopy,
  getLanguageLabel,
} from "@/lib/i18n/ui-copy";
import { withUiLanguage } from "@/lib/i18n/ui-language";
import type { AppUserRecord } from "@/lib/server/auth/types";

type AppShellProps = {
  children: React.ReactNode;
  email: string | null;
  appUser: AppUserRecord;
};

export function AppShell({ children, email, appUser }: AppShellProps) {
  const languageCode = appUser.preferred_ui_language;
  const copy = getAppShellCopy(languageCode);
  const navItems = copy.navigation[appUser.role];
  const roleMeta = copy.roles[appUser.role];

  return (
    <main className="px-5 py-6 sm:px-8 lg:px-12" lang={languageCode}>
      <DocumentLanguageSync languageCode={languageCode} />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="shell-panel page-glow sticky top-6 grid gap-5 rounded-[2rem] p-6">
            <div className="space-y-3">
              <p className="brand-wordmark text-xs text-[color:var(--ink-muted)]">
                IA DuBoulot
              </p>
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                {roleMeta.label}
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
                {roleMeta.title}
              </h1>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {roleMeta.body}
              </p>
            </div>

            <nav className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  className="interactive-card rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3"
                  href={item.href}
                  key={item.href}
                >
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--ink-soft)]">
                    {item.hint}
                  </p>
                </Link>
              ))}
            </nav>

            <div className="shell-card grid gap-3 rounded-[1.5rem] p-4 text-sm">
              <p className="font-medium">{copy.sessionActive}</p>
              <p className="text-[color:var(--ink-soft)]">
                {email ?? copy.unknownEmail}
              </p>
              <SignOutButton
                label={copy.signOut.idle}
                pendingLabel={copy.signOut.pending}
                redirectHref={withUiLanguage("/auth", languageCode)}
              />
            </div>
          </div>
        </aside>

        <div className="flex flex-col gap-6">
          <header className="shell-panel shell-panel--allow-overflow page-glow page-glow--allow-overflow rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="brand-pill">
                    {copy.chips.role}: {roleMeta.badge}
                  </span>
                  <span className="brand-pill">
                    {copy.chips.status}: {copy.accountStatus[appUser.account_status]}
                  </span>
                  <span className="brand-pill">
                    {copy.chips.interface}: {getLanguageLabel(languageCode)}
                  </span>
                </div>
                <div>
                  <p className="brand-wordmark text-xs text-[color:var(--ink-muted)]">
                    {copy.application}
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
                    {roleMeta.label}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--ink-soft)]">
                    {roleMeta.body}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:self-start">
                <AppToolbarControls
                  appUser={appUser}
                  languageCode={languageCode}
                />
                <div className="lg:hidden">
                  <SignOutButton
                    label={copy.signOut.idle}
                    pendingLabel={copy.signOut.pending}
                    redirectHref={withUiLanguage("/auth", languageCode)}
                  />
                </div>
              </div>
            </div>

            {appUser.account_status === "deletion_requested" ? (
              <div className="callout-warning mt-5 rounded-[1.5rem] border px-4 py-4 text-sm leading-6">
                {copy.deletionRequested}
              </div>
            ) : null}

            <nav className="mt-5 flex gap-3 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => (
                <Link
                  className="interactive-card min-w-[11rem] rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] px-4 py-3"
                  href={item.href}
                  key={item.href}
                >
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--ink-soft)]">
                    {item.hint}
                  </p>
                </Link>
              ))}
            </nav>
          </header>

          {children}
        </div>
      </div>
    </main>
  );
}
