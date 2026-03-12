import "server-only";

import { env } from "@/lib/env";
import { getBillingServerCopy } from "@/lib/i18n/oversight-copy";
import { recordAuditEvent } from "@/lib/server/audit/audit-service";
import { logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import {
  requireActiveAppUser,
  requireAppUserContext,
  requireAppUserRole,
} from "@/lib/server/auth/authorization";
import { AppError } from "@/lib/server/errors/app-error";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  BILLING_PROVIDER_NAME,
  DEFAULT_BILLING_PLAN_KEY,
} from "@/lib/server/billing/constants";
import {
  createLemonSqueezyCheckout,
  createLemonSqueezyPortalUrl,
  lemonSqueezyProviderName,
  normalizeBillingPlanKey,
  parseLemonSqueezyWebhook,
  verifyLemonSqueezyWebhookSignature,
} from "@/lib/server/billing/lemonsqueezy-provider";
import type {
  BillingSnapshot,
  BillingSubscriptionRecord,
  BillingWebhookInput,
  BillingWebhookResult,
  BillingSubscriptionStatus,
  CreateBillingCheckoutInput,
  CreateBillingCheckoutResult,
  CreateBillingPortalSessionInput,
  CreateBillingPortalSessionResult,
  EffectiveStudentSubscription,
} from "@/lib/server/billing/types";

type SubscriptionRow = {
  id: string;
  payer_user_id: string | null;
  provider: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  plan_key: string;
  status: BillingSubscriptionStatus;
  trial_ends_at: string | null;
  current_period_starts_at: string | null;
  current_period_ends_at: string | null;
  canceled_at: string | null;
  updated_at: string;
};

function toServiceError(message: string, cause: unknown) {
  return new AppError({
    code: "service_unavailable",
    message,
    status: 503,
    retryable: true,
    cause,
  });
}

function toBillingSnapshot(subscription: SubscriptionRow | null): BillingSnapshot {
  if (!subscription) {
    return {
      hasSubscription: false,
      provider: null,
      planKey: null,
      status: null,
      trialEndsAt: null,
      currentPeriodStartsAt: null,
      currentPeriodEndsAt: null,
      canceledAt: null,
    };
  }

  return {
    hasSubscription: true,
    provider: subscription.provider,
    planKey: subscription.plan_key,
    status: subscription.status,
    trialEndsAt: subscription.trial_ends_at,
    currentPeriodStartsAt: subscription.current_period_starts_at,
    currentPeriodEndsAt: subscription.current_period_ends_at,
    canceledAt: subscription.canceled_at,
  };
}

function toBillingSubscriptionRecord(
  subscription: SubscriptionRow | null,
): BillingSubscriptionRecord | null {
  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    payerUserId: subscription.payer_user_id,
    provider: subscription.provider,
    providerCustomerId: subscription.provider_customer_id,
    providerSubscriptionId: subscription.provider_subscription_id,
    planKey: subscription.plan_key,
    status: subscription.status,
    trialEndsAt: subscription.trial_ends_at,
    currentPeriodStartsAt: subscription.current_period_starts_at,
    currentPeriodEndsAt: subscription.current_period_ends_at,
    canceledAt: subscription.canceled_at,
    updatedAt: subscription.updated_at,
  };
}

function subscriptionPriority(
  subscription: Pick<
    BillingSubscriptionRecord,
    "status" | "trialEndsAt" | "currentPeriodEndsAt"
  >,
) {
  const now = Date.now();
  const currentPeriodEndsAt = subscription.currentPeriodEndsAt
    ? Date.parse(subscription.currentPeriodEndsAt)
    : Number.POSITIVE_INFINITY;
  const trialEndsAt = subscription.trialEndsAt
    ? Date.parse(subscription.trialEndsAt)
    : Number.POSITIVE_INFINITY;
  const isPeriodLive = currentPeriodEndsAt >= now;
  const isTrialLive = trialEndsAt >= now;

  switch (subscription.status) {
    case "active":
      return isPeriodLive ? 60 : 30;
    case "trialing":
      return isTrialLive ? 55 : 20;
    case "past_due":
      return isPeriodLive ? 45 : 15;
    case "canceled":
      return isPeriodLive ? 40 : 10;
    case "incomplete":
      return 5;
    case "incomplete_expired":
      return 0;
    default:
      return 0;
  }
}

function chooseBestSubscription(
  rows: SubscriptionRow[],
): BillingSubscriptionRecord | null {
  return rows
    .map((row) => toBillingSubscriptionRecord(row))
    .filter((row): row is BillingSubscriptionRecord => row !== null)
    .sort((left, right) => {
      const priorityDelta =
        subscriptionPriority(right) - subscriptionPriority(left);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    })[0] ?? null;
}

async function loadSubscriptionRowsForPayer(payerUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select(
      "id, payer_user_id, provider, provider_customer_id, provider_subscription_id, plan_key, status, trial_ends_at, current_period_starts_at, current_period_ends_at, canceled_at, updated_at",
    )
    .eq("payer_user_id", payerUserId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw toServiceError("Unable to load the payer subscription.", error);
  }

  return (data ?? []) as SubscriptionRow[];
}

async function loadSubscriptionRowsForStudentsParents(studentUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data: links, error: linkError } = await admin
    .from("parent_student_links")
    .select("parent_user_id")
    .eq("student_user_id", studentUserId)
    .eq("link_status", "active");

  if (linkError) {
    throw toServiceError("Unable to load linked parents.", linkError);
  }

  const parentUserIds = (links ?? [])
    .map((row) => row.parent_user_id)
    .filter((value): value is string => typeof value === "string");

  if (parentUserIds.length === 0) {
    return [];
  }

  const { data, error } = await admin
    .from("subscriptions")
    .select(
      "id, payer_user_id, provider, provider_customer_id, provider_subscription_id, plan_key, status, trial_ends_at, current_period_starts_at, current_period_ends_at, canceled_at, updated_at",
    )
    .in("payer_user_id", parentUserIds)
    .order("updated_at", { ascending: false });

  if (error) {
    throw toServiceError("Unable to load linked parent subscriptions.", error);
  }

  return (data ?? []) as SubscriptionRow[];
}

async function loadSubscriptionRowByProviderId(providerSubscriptionId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select(
      "id, payer_user_id, provider, provider_customer_id, provider_subscription_id, plan_key, status, trial_ends_at, current_period_starts_at, current_period_ends_at, canceled_at, updated_at",
    )
    .eq("provider_subscription_id", providerSubscriptionId)
    .maybeSingle<SubscriptionRow>();

  if (error) {
    throw toServiceError("Unable to load the provider subscription row.", error);
  }

  return data ?? null;
}

async function loadSubscriptionRowByProviderCustomerId(providerCustomerId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select(
      "id, payer_user_id, provider, provider_customer_id, provider_subscription_id, plan_key, status, trial_ends_at, current_period_starts_at, current_period_ends_at, canceled_at, updated_at",
    )
    .eq("provider_customer_id", providerCustomerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>();

  if (error) {
    throw toServiceError("Unable to load the provider customer row.", error);
  }

  return data ?? null;
}

async function upsertSubscriptionRow(input: {
  payerUserId: string | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string;
  planKey: string;
  status: BillingSubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodStartsAt: string | null;
  currentPeriodEndsAt: string | null;
  canceledAt: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .upsert(
      {
        payer_user_id: input.payerUserId,
        provider: BILLING_PROVIDER_NAME,
        provider_customer_id: input.providerCustomerId,
        provider_subscription_id: input.providerSubscriptionId,
        plan_key: input.planKey,
        status: input.status,
        trial_ends_at: input.trialEndsAt,
        current_period_starts_at: input.currentPeriodStartsAt,
        current_period_ends_at: input.currentPeriodEndsAt,
        canceled_at: input.canceledAt,
      },
      {
        onConflict: "provider_subscription_id",
      },
    )
    .select(
      "id, payer_user_id, provider, provider_customer_id, provider_subscription_id, plan_key, status, trial_ends_at, current_period_starts_at, current_period_ends_at, canceled_at, updated_at",
    )
    .single<SubscriptionRow>();

  if (error) {
    throw toServiceError("Unable to persist subscription status.", error);
  }

  return data;
}

export async function loadPayerBillingSnapshot(
  payerUserId: string,
): Promise<BillingSnapshot> {
  const rows = await loadSubscriptionRowsForPayer(payerUserId);
  const subscription = chooseBestSubscription(rows);

  return toBillingSnapshot(
    subscription
      ? {
          id: subscription.id,
          payer_user_id: subscription.payerUserId,
          provider: subscription.provider,
          provider_customer_id: subscription.providerCustomerId,
          provider_subscription_id: subscription.providerSubscriptionId,
          plan_key: subscription.planKey,
          status: subscription.status,
          trial_ends_at: subscription.trialEndsAt,
          current_period_starts_at: subscription.currentPeriodStartsAt,
          current_period_ends_at: subscription.currentPeriodEndsAt,
          canceled_at: subscription.canceledAt,
          updated_at: subscription.updatedAt,
        }
      : null,
  );
}

export async function loadLatestSubscriptionForPayer(
  payerUserId: string,
): Promise<BillingSubscriptionRecord | null> {
  const rows = await loadSubscriptionRowsForPayer(payerUserId);
  return chooseBestSubscription(rows);
}

export async function resolveEffectiveStudentSubscription(
  studentUserId: string,
): Promise<EffectiveStudentSubscription> {
  const rows = await loadSubscriptionRowsForStudentsParents(studentUserId);
  const subscription = chooseBestSubscription(rows);

  return {
    payerUserId: subscription?.payerUserId ?? null,
    subscription,
  };
}

export async function createBillingCheckout(
  input: CreateBillingCheckoutInput,
): Promise<CreateBillingCheckoutResult> {
  const appUser = requireAppUserContext(input.context);
  requireAppUserRole(appUser, ["parent"]);
  requireActiveAppUser(appUser);

  const planKey = normalizeBillingPlanKey(input.planKey);
  const existingSubscription = await loadLatestSubscriptionForPayer(appUser.id);

  if (
    existingSubscription?.provider === lemonSqueezyProviderName &&
    existingSubscription.providerSubscriptionId
  ) {
    const portal = await createBillingPortalSession({
      context: input.context,
      requestId: input.requestId,
      route: input.route,
    });

    return {
      url: portal.url,
      mode: "portal",
      planKey: portal.planKey ?? existingSubscription.planKey,
      provider: portal.provider,
    };
  }

  const successUrl = new URL("/app", env.NEXT_PUBLIC_APP_URL).toString();
  const cancelUrl = new URL("/pricing", env.NEXT_PUBLIC_APP_URL).toString();
  const checkout = await createLemonSqueezyCheckout({
    planKey,
    payerUserId: appUser.id,
    email: input.context.email,
    displayName: appUser.display_name,
    successUrl,
    cancelUrl,
  });

  logRuntimeInfo({
    message: "Created billing checkout",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: appUser.id,
    actorRole: appUser.role,
    details: {
      planKey,
      provider: BILLING_PROVIDER_NAME,
    },
  });

  return {
    url: checkout.url,
    mode: "checkout",
    planKey,
    provider: BILLING_PROVIDER_NAME,
  };
}

export async function createBillingPortalSession(
  input: CreateBillingPortalSessionInput,
): Promise<CreateBillingPortalSessionResult> {
  const appUser = requireAppUserContext(input.context);
  const copy = getBillingServerCopy(appUser.preferred_ui_language);
  requireAppUserRole(appUser, ["parent"]);
  requireActiveAppUser(appUser);

  const subscription = await loadLatestSubscriptionForPayer(appUser.id);

  if (!subscription?.providerSubscriptionId) {
    throw new AppError({
      code: "conflict",
      message: copy.noManageableSubscription,
      status: 409,
    });
  }

  const portal = await createLemonSqueezyPortalUrl({
    providerSubscriptionId: subscription.providerSubscriptionId,
  });

  logRuntimeInfo({
    message: "Opened billing portal",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    actorUserId: appUser.id,
    actorRole: appUser.role,
    details: {
      provider: subscription.provider,
      providerSubscriptionId: subscription.providerSubscriptionId,
    },
  });

  return {
    url: portal.url,
    planKey: subscription.planKey,
    provider: subscription.provider,
    status: subscription.status,
  };
}

export async function handleBillingWebhook(
  input: BillingWebhookInput,
): Promise<BillingWebhookResult> {
  verifyLemonSqueezyWebhookSignature({
    rawBody: input.rawBody,
    signature: input.headers.get("x-signature"),
  });

  const event = parseLemonSqueezyWebhook(input.rawBody);

  if (!event?.eventName) {
    return {
      handled: false,
      ignored: true,
      eventName: null,
      providerSubscriptionId: null,
      payerUserId: null,
      status: null,
    };
  }

  if (!event.providerSubscriptionId || !event.status) {
    return {
      handled: false,
      ignored: true,
      eventName: event.eventName,
      providerSubscriptionId: event.providerSubscriptionId,
      payerUserId: event.payerUserId,
      status: event.status,
    };
  }

  const existingById = await loadSubscriptionRowByProviderId(
    event.providerSubscriptionId,
  );
  const existingByCustomer =
    !existingById && event.providerCustomerId
      ? await loadSubscriptionRowByProviderCustomerId(event.providerCustomerId)
      : null;
  const previousStatus = existingById?.status ?? existingByCustomer?.status ?? null;
  const payerUserId =
    event.payerUserId ??
    existingById?.payer_user_id ??
    existingByCustomer?.payer_user_id ??
    null;
  const persisted = await upsertSubscriptionRow({
    payerUserId,
    providerCustomerId: event.providerCustomerId,
    providerSubscriptionId: event.providerSubscriptionId,
    planKey: event.planKey || DEFAULT_BILLING_PLAN_KEY,
    status: event.status,
    trialEndsAt: event.trialEndsAt,
    currentPeriodStartsAt: event.currentPeriodStartsAt,
    currentPeriodEndsAt: event.currentPeriodEndsAt,
    canceledAt: event.canceledAt,
  });

  logRuntimeInfo({
    message: "Processed billing webhook",
    requestId: input.requestId,
    route: input.route,
    method: "POST",
    details: {
      provider: BILLING_PROVIDER_NAME,
      eventName: event.eventName,
      providerSubscriptionId: event.providerSubscriptionId,
      status: event.status,
      payerUserId,
    },
  });

  try {
    await recordAuditEvent({
      actorUserId: null,
      actorRole: null,
      action: "billing_subscription_sync",
      targetTable: "subscriptions",
      targetId: persisted.id,
      metadata: {
        request_id: input.requestId,
        route: input.route,
        provider: BILLING_PROVIDER_NAME,
        provider_event_id: event.providerSubscriptionId,
        status_before: previousStatus,
        status_after: persisted.status,
      },
      requestId: input.requestId,
    });
  } catch {
    // Audit failures should not block webhook persistence.
  }

  return {
    handled: true,
    ignored: false,
    eventName: event.eventName,
    providerSubscriptionId: event.providerSubscriptionId,
    payerUserId,
    status: persisted.status,
  };
}
