"use client";

import { useEffect } from "react";
import { getAuthCompleteCopy } from "@/lib/i18n/ui-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";

type PostConfirmRedirectProps = {
  nextPath: string;
  languageCode: UiLanguageCode;
};

export function PostConfirmRedirect({
  nextPath,
  languageCode,
}: PostConfirmRedirectProps) {
  const copy = getAuthCompleteCopy(languageCode);

  useEffect(() => {
    window.location.replace(nextPath);
  }, [nextPath]);

  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
      {copy.redirecting}
    </div>
  );
}
