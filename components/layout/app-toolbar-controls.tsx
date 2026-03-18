"use client";

import { AppLanguageMenu } from "@/components/layout/app-language-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { AppUserRecord, UiLanguageCode } from "@/lib/server/auth/types";

type AppToolbarControlsProps = {
  appUser: AppUserRecord;
  languageCode: UiLanguageCode;
  variant?: "default" | "minimal";
};

export function AppToolbarControls({
  appUser,
  languageCode,
  variant = "default",
}: AppToolbarControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <ThemeToggle
        languageCode={languageCode}
        variant={variant}
      />
      <AppLanguageMenu
        appUser={appUser}
        variant={variant}
      />
    </div>
  );
}
