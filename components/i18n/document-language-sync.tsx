"use client";

import { useEffect } from "react";
import type { UiLanguageCode } from "@/lib/i18n/config";

type DocumentLanguageSyncProps = {
  languageCode: UiLanguageCode;
};

export function DocumentLanguageSync({
  languageCode,
}: DocumentLanguageSyncProps) {
  useEffect(() => {
    document.documentElement.lang = languageCode;
    document.documentElement.dataset.uiLanguage = languageCode;
  }, [languageCode]);

  return null;
}
