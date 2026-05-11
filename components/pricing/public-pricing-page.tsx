"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LandingAudience } from "@/components/landing/landing-audience-store";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import { withUiLanguage } from "@/lib/i18n/ui-language";

type BillingCycle = "monthly" | "yearly";

type PricingPlan = {
  body: string;
  cta: string;
  disabled?: boolean;
  includesExplorerPerks?: boolean;
  monthlyPrice?: string;
  name: string;
  points: string[];
  price: string;
  yearlyPrice?: string;
};

type PricingAudienceCopy = {
  plans: PricingPlan[];
};

type PricingPageCopy = {
  audienceLabels: Record<LandingAudience, string>;
  billingToggle: Record<BillingCycle, string>;
  audiences: Record<LandingAudience, PricingAudienceCopy>;
  explorerPerksLabel: string;
};

type PublicPricingPageProps = {
  copy: PricingPageCopy;
  languageCode: UiLanguageCode;
};

function authHrefForAudience(
  audience: LandingAudience,
  languageCode: UiLanguageCode,
) {
  return withUiLanguage(
    `/auth?mode=sign_up&role=${audience}`,
    languageCode,
  );
}

function priceForCycle(plan: PricingPlan, billingCycle: BillingCycle) {
  if (billingCycle === "yearly" && plan.yearlyPrice) {
    return plan.yearlyPrice;
  }

  if (billingCycle === "monthly" && plan.monthlyPrice) {
    return plan.monthlyPrice;
  }

  return plan.price;
}

export function PublicPricingPage({
  copy,
  languageCode,
}: PublicPricingPageProps) {
  const [audience, setAudience] = useState<LandingAudience>("parent");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const tutorUnavailableMessage =
    "Tutor accounts are being implemented. Contact us if you want to try it out early.";
  const selectedCopy = copy.audiences[audience];
  const ctaHref = authHrefForAudience(audience, languageCode);

  function showTutorUnavailableToast() {
    setToastMessage(tutorUnavailableMessage);
  }

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(null), 3600);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  return (
    <main className="px-5 pb-16 pt-40 sm:px-8 lg:px-36">
      <div className="mx-auto grid max-w-[92rem] gap-8">
        <nav
          aria-label="Pricing audience"
          className="flex justify-center"
        >
          <div className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-1 text-sm font-medium text-[color:var(--ink-soft)]">
            {(["student", "parent", "tutor"] as LandingAudience[]).map((item) => {
              const isTutor = item === "tutor";

              return (
                <button
                  aria-pressed={!isTutor && audience === item}
                  className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
                    !isTutor && audience === item
                      ? "bg-[color:var(--surface-raised)] text-[color:var(--foreground)] shadow-[var(--shadow-soft)]"
                      : isTutor
                        ? "cursor-not-allowed text-[color:var(--ink-muted)] opacity-60 hover:text-[color:var(--ink-muted)]"
                        : "text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
                  }`}
                  data-unavailable={isTutor ? "true" : undefined}
                  key={item}
                  onClick={() => {
                    if (isTutor) {
                      showTutorUnavailableToast();
                      return;
                    }

                    setAudience(item);
                  }}
                  title={isTutor ? tutorUnavailableMessage : undefined}
                  type="button"
                >
                  {copy.audienceLabels[item]}
                </button>
              );
            })}
          </div>
        </nav>
        {toastMessage ? (
          <div
            aria-live="polite"
            className="fixed left-1/2 top-24 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.35rem] border border-[color:var(--line-strong)] bg-[color:var(--surface-raised)] p-4 text-center text-sm font-semibold text-[color:var(--foreground)] shadow-[var(--shadow-soft)] backdrop-blur-2xl"
            role="status"
          >
            {toastMessage}
          </div>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-3">
          {selectedCopy.plans.map((plan) => {
            const hasBillingToggle = Boolean(plan.monthlyPrice && plan.yearlyPrice);
            const isDisabled = Boolean(plan.disabled);

            return (
              <article
                className={`shell-card page-glow grid grid-rows-[2.5rem_2.75rem_5rem_1fr_auto] rounded-[1.5rem] p-6 ${
                  isDisabled ? "opacity-70" : ""
                }`}
                key={plan.name}
              >
                <div className="flex h-10 items-center justify-between gap-3 overflow-hidden">
                  <p className="min-w-0 truncate font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                    {priceForCycle(plan, billingCycle)}
                  </p>
                  {hasBillingToggle ? (
                    <div className="inline-flex h-8 shrink-0 items-center rounded-full border border-[color:var(--line)] bg-[color:var(--surface-muted)] p-1 text-xs font-semibold text-[color:var(--ink-soft)]">
                      {(["yearly", "monthly"] as BillingCycle[]).map((cycle) => (
                        <button
                          aria-pressed={billingCycle === cycle}
                          className={`h-6 rounded-full px-3 leading-6 transition ${
                            billingCycle === cycle
                              ? "bg-[color:var(--surface-raised)] text-[color:var(--foreground)] shadow-[var(--shadow-soft)]"
                              : "hover:text-[color:var(--foreground)]"
                          }`}
                          key={cycle}
                          onClick={() => setBillingCycle(cycle)}
                          type="button"
                        >
                          {copy.billingToggle[cycle]}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <h2 className="pt-3 font-[family-name:var(--font-heading)] text-3xl leading-none">
                  {plan.name}
                </h2>

                <p className="pt-4 text-sm leading-6 text-[color:var(--ink-soft)]">
                  {plan.body}
                </p>
                <ul className="mt-5 grid content-start gap-2 text-sm leading-6">
                  {plan.includesExplorerPerks ? (
                    <li className="flex gap-3 font-semibold">
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-[color:var(--accent)]"
                      >
                        ✓
                      </span>
                      <span>{copy.explorerPerksLabel}</span>
                    </li>
                  ) : null}
                  {plan.points.map((point) => (
                    <li className="flex gap-3" key={point}>
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                {isDisabled ? (
                  <button
                    className="button-base mt-7 cursor-not-allowed justify-center border border-[color:var(--line)] bg-[color:var(--surface-muted)] text-[color:var(--ink-muted)]"
                    disabled
                    type="button"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    className="button-base button-primary mt-7 justify-center"
                    href={ctaHref}
                  >
                    {plan.cta}
                  </Link>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
