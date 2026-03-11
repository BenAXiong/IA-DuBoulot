import "server-only";

export const BILLING_PROVIDER_NAME = "lemonsqueezy" as const;
export const DEFAULT_BILLING_PLAN_KEY = "family_monthly" as const;
export const BILLING_PLAN_KEYS = [DEFAULT_BILLING_PLAN_KEY] as const;

export type BillingPlanKey = (typeof BILLING_PLAN_KEYS)[number];

export const BILLING_PLAN_LABELS: Record<BillingPlanKey, string> = {
  family_monthly: "Family",
};
