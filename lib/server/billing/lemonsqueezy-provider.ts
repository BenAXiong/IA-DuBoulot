import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { AppError } from "@/lib/server/errors/app-error";
import {
  BILLING_PROVIDER_NAME,
  DEFAULT_BILLING_PLAN_KEY,
  type BillingPlanKey,
} from "@/lib/server/billing/constants";
import type { BillingSubscriptionStatus } from "@/lib/server/billing/types";

type LemonCheckoutRequestInput = {
  planKey: string;
  payerUserId: string;
  email: string | null;
  displayName: string;
  successUrl: string;
  cancelUrl: string;
};

type LemonCheckoutResponse = {
  url: string;
};

type LemonPortalResponse = {
  url: string;
};

type LemonWebhookEvent = {
  eventName: string | null;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  planKey: string;
  status: BillingSubscriptionStatus | null;
  trialEndsAt: string | null;
  currentPeriodStartsAt: string | null;
  currentPeriodEndsAt: string | null;
  canceledAt: string | null;
  payerUserId: string | null;
};

type LemonSubscriptionAttributes = {
  customer_id?: number | string | null;
  variant_id?: number | string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  trial_ends_at?: string | null;
  renews_at?: string | null;
  ends_at?: string | null;
  urls?: {
    customer_portal?: string | null;
    update_payment_method?: string | null;
  } | null;
};

type LemonWebhookPayload = {
  meta?: {
    event_name?: string | null;
    custom_data?: Record<string, unknown> | null;
  } | null;
  data?: {
    id?: string | number | null;
    type?: string | null;
    attributes?: LemonSubscriptionAttributes | null;
  } | null;
};

function requireApiConfig() {
  if (
    !env.LEMON_SQUEEZY_API_KEY ||
    !env.LEMON_SQUEEZY_STORE_ID ||
    !env.LEMON_SQUEEZY_VARIANT_ID_FAMILY_MONTHLY
  ) {
    throw new AppError({
      code: "service_unavailable",
      message:
        "Billing checkout is not configured yet. Fill the Lemon Squeezy API key, store id, and Family variant id first.",
      status: 503,
      retryable: false,
    });
  }
}

function requireWebhookSecret() {
  if (!env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
    throw new AppError({
      code: "service_unavailable",
      message:
        "Billing webhook verification is not configured yet. Fill the Lemon Squeezy webhook secret first.",
      status: 503,
      retryable: false,
    });
  }
}

function mapPlanToVariantId(planKey: string) {
  if (planKey === DEFAULT_BILLING_PLAN_KEY) {
    return env.LEMON_SQUEEZY_VARIANT_ID_FAMILY_MONTHLY;
  }

  throw new AppError({
    code: "validation_error",
    message: "Unknown billing plan.",
    status: 400,
    fieldErrors: {
      planKey: "Unsupported billing plan.",
    },
  });
}

function buildApiHeaders() {
  return {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${env.LEMON_SQUEEZY_API_KEY}`,
  };
}

function mapProviderStatus(
  rawStatus: string | null | undefined,
): BillingSubscriptionStatus | null {
  switch (rawStatus) {
    case "on_trial":
      return "trialing";
    case "active":
    case "paused":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "incomplete";
    case "cancelled":
      return "canceled";
    case "expired":
      return "incomplete_expired";
    default:
      return null;
  }
}

function parseProviderResponseError(body: string) {
  try {
    const parsed = JSON.parse(body) as {
      errors?: Array<{ detail?: string }>;
    };
    return parsed.errors?.[0]?.detail ?? body;
  } catch {
    return body;
  }
}

function toProviderError(message: string, responseText: string) {
  return new AppError({
    code: "provider_error",
    message,
    status: 502,
    retryable: true,
    cause: new Error(parseProviderResponseError(responseText)),
  });
}

function resolveWebhookPlanKey(input: {
  customData: Record<string, unknown> | null | undefined;
  variantId: number | string | null | undefined;
}) {
  const customPlanKey =
    typeof input.customData?.plan_key === "string"
      ? input.customData.plan_key
      : null;

  if (customPlanKey) {
    return customPlanKey;
  }

  if (
    input.variantId != null &&
    String(input.variantId) === env.LEMON_SQUEEZY_VARIANT_ID_FAMILY_MONTHLY
  ) {
    return DEFAULT_BILLING_PLAN_KEY;
  }

  return DEFAULT_BILLING_PLAN_KEY;
}

function readPortalUrl(attributes: LemonSubscriptionAttributes | null | undefined) {
  return (
    attributes?.urls?.customer_portal ??
    attributes?.urls?.update_payment_method ??
    null
  );
}

export async function createLemonSqueezyCheckout(
  input: LemonCheckoutRequestInput,
): Promise<LemonCheckoutResponse> {
  requireApiConfig();
  const variantId = mapPlanToVariantId(input.planKey);

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: buildApiHeaders(),
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: input.email ?? undefined,
            name: input.displayName,
            custom: {
              payer_user_id: input.payerUserId,
              plan_key: input.planKey,
            },
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: true,
          },
          product_options: {
            redirect_url: input.successUrl,
            receipt_button_text: "Retour a l'application",
            receipt_link_url: input.successUrl,
          },
          expires_at: null,
          preview: false,
          test_mode: env.LEMON_SQUEEZY_TEST_MODE,
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: env.LEMON_SQUEEZY_STORE_ID,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw toProviderError("Unable to create the billing checkout.", responseText);
  }

  const parsed = JSON.parse(responseText) as {
    data?: {
      attributes?: {
        url?: string | null;
      } | null;
    } | null;
  };
  const url = parsed.data?.attributes?.url ?? null;

  if (!url) {
    throw new AppError({
      code: "provider_error",
      message: "Billing checkout URL was missing from the provider response.",
      status: 502,
      retryable: true,
    });
  }

  return { url };
}

export async function createLemonSqueezyPortalUrl(input: {
  providerSubscriptionId: string;
}): Promise<LemonPortalResponse> {
  requireApiConfig();
  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/subscriptions/${input.providerSubscriptionId}`,
    {
      method: "GET",
      headers: buildApiHeaders(),
    },
  );
  const responseText = await response.text();

  if (!response.ok) {
    throw toProviderError("Unable to load the billing portal URL.", responseText);
  }

  const parsed = JSON.parse(responseText) as {
    data?: {
      attributes?: LemonSubscriptionAttributes | null;
    } | null;
  };
  const url = readPortalUrl(parsed.data?.attributes);

  if (!url) {
    throw new AppError({
      code: "provider_error",
      message: "Billing portal URL was missing from the provider response.",
      status: 502,
      retryable: true,
    });
  }

  return { url };
}

export function verifyLemonSqueezyWebhookSignature(input: {
  rawBody: string;
  signature: string | null;
}) {
  requireWebhookSecret();

  if (!input.signature) {
    throw new AppError({
      code: "forbidden",
      message: "Missing billing webhook signature.",
      status: 403,
    });
  }

  const expected = createHmac("sha256", env.LEMON_SQUEEZY_WEBHOOK_SECRET)
    .update(input.rawBody)
    .digest("hex");

  const left = Buffer.from(input.signature);
  const right = Buffer.from(expected);

  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    throw new AppError({
      code: "forbidden",
      message: "Invalid billing webhook signature.",
      status: 403,
    });
  }
}

export function parseLemonSqueezyWebhook(rawBody: string): LemonWebhookEvent | null {
  const payload = JSON.parse(rawBody) as LemonWebhookPayload;
  const eventName = payload.meta?.event_name ?? null;
  const attributes = payload.data?.attributes ?? null;

  if (payload.data?.type !== "subscriptions") {
    return {
      eventName,
      providerSubscriptionId: null,
      providerCustomerId: null,
      planKey: DEFAULT_BILLING_PLAN_KEY,
      status: null,
      trialEndsAt: null,
      currentPeriodStartsAt: null,
      currentPeriodEndsAt: null,
      canceledAt: null,
      payerUserId: null,
    };
  }

  const providerSubscriptionId =
    payload.data?.id != null ? String(payload.data.id) : null;
  const providerCustomerId =
    attributes?.customer_id != null ? String(attributes.customer_id) : null;
  const rawStatus = attributes?.status ?? null;
  const status = mapProviderStatus(rawStatus);
  const customData = payload.meta?.custom_data ?? null;
  const planKey = resolveWebhookPlanKey({
    customData,
    variantId: attributes?.variant_id,
  });
  const payerUserId =
    typeof customData?.payer_user_id === "string"
      ? customData.payer_user_id
      : null;
  const updatedAt = attributes?.updated_at ?? null;

  return {
    eventName,
    providerSubscriptionId,
    providerCustomerId,
    planKey,
    status,
    trialEndsAt: attributes?.trial_ends_at ?? null,
    currentPeriodStartsAt: attributes?.created_at ?? null,
    currentPeriodEndsAt: attributes?.renews_at ?? attributes?.ends_at ?? null,
    canceledAt:
      rawStatus === "cancelled" || rawStatus === "expired" ? updatedAt : null,
    payerUserId,
  };
}

export function normalizeBillingPlanKey(planKey: string | null | undefined) {
  if (!planKey) {
    return DEFAULT_BILLING_PLAN_KEY;
  }

  if (planKey === DEFAULT_BILLING_PLAN_KEY) {
    return planKey as BillingPlanKey;
  }

  throw new AppError({
    code: "validation_error",
    message: "Unknown billing plan.",
    status: 400,
    fieldErrors: {
      planKey: "Unsupported billing plan.",
    },
  });
}

export const lemonSqueezyProviderName = BILLING_PROVIDER_NAME;
