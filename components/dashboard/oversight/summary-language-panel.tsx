"use client";

import { useState } from "react";
import { StudentStatusPill } from "@/components/dashboard/student/student-status-pill";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { ParentConversationSummaryVariant } from "@/lib/server/oversight/types";

type SummaryLanguagePanelProps = {
  variants: ParentConversationSummaryVariant[];
  preferredLanguage: UiLanguageCode;
};

function pickInitialLanguage(
  variants: ParentConversationSummaryVariant[],
  preferredLanguage: UiLanguageCode,
) {
  return (
    variants.find((variant) => variant.languageCode === preferredLanguage)
      ?.languageCode ??
    variants.find((variant) => variant.languageCode === "fr")?.languageCode ??
    variants[0]?.languageCode ??
    null
  );
}

export function SummaryLanguagePanel({
  variants,
  preferredLanguage,
}: SummaryLanguagePanelProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<UiLanguageCode | null>(
    pickInitialLanguage(variants, preferredLanguage),
  );
  const selectedVariant =
    variants.find((variant) => variant.languageCode === selectedLanguage) ?? null;

  if (variants.length === 0) {
    return (
      <article className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
        Aucun resume parent n&apos;est encore disponible pour cette session.
      </article>
    );
  }

  return (
    <article className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="space-y-2">
        <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
          Resume parent
        </p>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                variant.languageCode === selectedLanguage
                  ? "bg-[color:var(--accent)] text-white"
                  : "border border-[color:var(--line)] bg-white text-[color:var(--foreground)]"
              }`}
              key={variant.languageCode}
              onClick={() => setSelectedLanguage(variant.languageCode)}
              type="button"
            >
              {variant.languageCode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {selectedVariant ? (
        <div className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
          <p className="whitespace-pre-line text-sm leading-6 text-[color:var(--foreground)]">
            {selectedVariant.summaryText}
          </p>

          {selectedVariant.weaknessTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedVariant.weaknessTags.map((tag) => (
                <StudentStatusPill key={tag} label={tag} tone="warning" />
              ))}
            </div>
          ) : null}

          {selectedVariant.nextStepRecommendation ? (
            <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
              Prochaine etape: {selectedVariant.nextStepRecommendation}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
