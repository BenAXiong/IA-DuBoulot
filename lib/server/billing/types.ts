import "server-only";

import type { AuthenticatedUserContext } from "@/lib/server/auth/types";

export type BillingSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired";

export type BillingSubscriptionRecord = {
  id: string;
  payerUserId: string | null;
  provider: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  planKey: string;
  status: BillingSubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodStartsAt: string | null;
  currentPeriodEndsAt: string | null;
  canceledAt: string | null;
  updatedAt: string;
};

export type BillingSnapshot = {
  hasSubscription: boolean;
  provider: string | null;
  planKey: string | null;
  status: BillingSubscriptionStatus | null;
  trialEndsAt: string | null;
  currentPeriodStartsAt: string | null;
  currentPeriodEndsAt: string | null;
  canceledAt: string | null;
};

export type EffectiveStudentSubscription = {
  payerUserId: string | null;
  subscription: BillingSubscriptionRecord | null;
};

export type CreateBillingCheckoutInput = {
  context: AuthenticatedUserContext;
  planKey?: string;
  requestId: string;
  route: string;
};

export type CreateBillingCheckoutResult = {
  url: string;
  mode: "checkout" | "portal";
  planKey: string;
  provider: string;
};

export type CreateBillingPortalSessionInput = {
  context: AuthenticatedUserContext;
  requestId: string;
  route: string;
};

export type CreateBillingPortalSessionResult = {
  url: string;
  planKey: string | null;
  provider: string;
  status: BillingSubscriptionStatus;
};

export type BillingWebhookInput = {
  headers: Headers;
  rawBody: string;
  requestId: string;
  route: string;
};

export type BillingWebhookResult = {
  handled: boolean;
  ignored: boolean;
  eventName: string | null;
  providerSubscriptionId: string | null;
  payerUserId: string | null;
  status: BillingSubscriptionStatus | null;
};
