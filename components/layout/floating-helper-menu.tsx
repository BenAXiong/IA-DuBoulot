import Link from "next/link";
import { getHomePageCopy } from "@/lib/i18n/ui-copy";
import { withUiLanguage } from "@/lib/i18n/ui-language";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type FloatingHelperMenuProps = {
  languageCode: UiLanguageCode;
};

export function FloatingHelperMenu({
  languageCode,
}: FloatingHelperMenuProps) {
  const copy = getHomePageCopy(languageCode).helper;
  const links = [
    {
      href: withUiLanguage("/auth", languageCode),
      label: copy.links.auth,
      kind: "internal" as const,
    },
    {
      href: withUiLanguage("/auth?mode=sign_up&role=student", languageCode),
      label: copy.links.student,
      kind: "internal" as const,
    },
    {
      href: withUiLanguage(
        "/auth?mode=sign_up&role=parent&intent=parent_link",
        languageCode,
      ),
      label: copy.links.parent,
      kind: "internal" as const,
    },
    {
      href: withUiLanguage(
        "/auth?mode=sign_up&role=tutor&intent=tutor_link",
        languageCode,
      ),
      label: copy.links.tutor,
      kind: "internal" as const,
    },
    {
      href: "https://github.com/BenAXiong/IA-DuBoulot",
      label: copy.links.github,
      kind: "external" as const,
    },
    {
      href: "https://vercel.com/bmavmartinez-8475s-projects/ia-du-boulot",
      label: copy.links.vercel,
      kind: "external" as const,
    },
  ];

  return (
    <details className="group fixed bottom-24 right-4 z-50 sm:right-6">
      <summary className="flex h-14 w-14 cursor-pointer list-none items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-raised)] text-[color:var(--foreground)] shadow-[var(--shadow)] transition hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] [&::-webkit-details-marker]:hidden">
        <span className="sr-only">{copy.buttonLabel}</span>
        <svg
          aria-hidden="true"
          className="h-5 w-5 transition-transform duration-150 group-open:rotate-45"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 5.5v13M5.5 12h13"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      </summary>

      <div className="absolute bottom-16 right-0 w-[min(18rem,calc(100vw-2rem))] rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4 shadow-[var(--shadow)]">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
          {copy.title}
        </p>
        <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
          {copy.body}
        </p>

        <div className="mt-4 grid gap-2">
          {links.map((link) =>
            link.kind === "external" ? (
              <a
                className="flex items-center justify-between rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)]"
                href={link.href}
                key={link.href}
                rel="noreferrer"
                target="_blank"
              >
                <span>{link.label}</span>
                <span aria-hidden="true" className="text-[color:var(--ink-muted)]">
                  ↗
                </span>
              </a>
            ) : (
              <Link
                className="flex items-center justify-between rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-strong)]"
                href={link.href}
                key={link.href}
              >
                <span>{link.label}</span>
                <span aria-hidden="true" className="text-[color:var(--ink-muted)]">
                  →
                </span>
              </Link>
            ),
          )}
        </div>
      </div>
    </details>
  );
}
