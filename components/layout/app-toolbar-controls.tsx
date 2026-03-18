"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { LanguageMenu } from "@/components/layout/language-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buildHrefWithSearchParams } from "@/lib/i18n/ui-language";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type AppToolbarControlsProps = {
  languageCode: UiLanguageCode;
  variant?: "default" | "minimal";
};

export function AppToolbarControls({
  languageCode,
  variant = "default",
}: AppToolbarControlsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentHref = buildHrefWithSearchParams(
    pathname || "/app",
    Object.fromEntries(searchParams.entries()),
  );

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle
        languageCode={languageCode}
        variant={variant}
      />
      <LanguageMenu
        currentHref={currentHref}
        languageCode={languageCode}
        variant={variant}
      />
    </div>
  );
}
