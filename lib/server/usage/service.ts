import "server-only";

import type { AiUsageSnapshot } from "@/lib/server/ai/types";
import type { BillingSubscriptionRecord } from "@/lib/server/billing/types";
import { resolveEffectiveStudentSubscription } from "@/lib/server/billing/service";
import { AppError } from "@/lib/server/errors/app-error";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  TRIAL_PLAN_KEY,
  USAGE_LIMITS,
  USAGE_TRIAL_DURATION_DAYS,
  USAGE_WARNING_DAYS,
  USAGE_WARNING_RATIO,
} from "@/lib/server/usage/constants";
import type {
  StudentUsageSnapshot,
  UsageCounterSnapshot,
  UsageDelta,
  UsageQuotaAction,
  UsageQuotaBlockReason,
  UsageQuotaMetricSnapshot,
} from "@/lib/server/usage/types";

type UsageRow = {
  period_start: string;
  period_end: string;
  sessions_count: number;
  uploads_count: number;
  assistant_message_count: number;
  input_tokens: number;
  output_tokens: number;
};

type FirstUsageRow = {
  created_at: string;
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

function getCurrentUsagePeriod(now: Date) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const periodStart = new Date(Date.UTC(year, month, 1));
  const periodEnd = new Date(Date.UTC(year, month + 1, 0));

  return {
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
  };
}

function addDays(input: string, days: number) {
  const date = new Date(input);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function subscriptionGrantsAccess(
  subscription: BillingSubscriptionRecord | null,
  now: Date,
) {
  if (!subscription) {
    return false;
  }

  const nowMs = now.getTime();
  const currentPeriodEndsAt = subscription.currentPeriodEndsAt
    ? Date.parse(subscription.currentPeriodEndsAt)
    : Number.POSITIVE_INFINITY;
  const trialEndsAt = subscription.trialEndsAt
    ? Date.parse(subscription.trialEndsAt)
    : Number.POSITIVE_INFINITY;

  switch (subscription.status) {
    case "active":
      return currentPeriodEndsAt >= nowMs;
    case "trialing":
      return trialEndsAt >= nowMs;
    case "past_due":
    case "canceled":
      return currentPeriodEndsAt >= nowMs;
    case "incomplete":
    case "incomplete_expired":
    default:
      return false;
  }
}

function buildMetricSnapshot(input: {
  used: number;
  limit: number;
}): UsageQuotaMetricSnapshot {
  return {
    used: input.used,
    limit: input.limit,
    remaining: Math.max(input.limit - input.used, 0),
  };
}

function findExceededMetric(snapshot: {
  sessions: UsageQuotaMetricSnapshot;
  uploads: UsageQuotaMetricSnapshot;
  assistantMessages: UsageQuotaMetricSnapshot;
  inputTokens: UsageQuotaMetricSnapshot;
  outputTokens: UsageQuotaMetricSnapshot;
}): UsageQuotaBlockReason {
  if ((snapshot.sessions.remaining ?? 0) <= 0) {
    return "sessions";
  }

  if ((snapshot.uploads.remaining ?? 0) <= 0) {
    return "uploads";
  }

  if ((snapshot.assistantMessages.remaining ?? 0) <= 0) {
    return "assistant_messages";
  }

  if ((snapshot.inputTokens.remaining ?? 0) <= 0) {
    return "input_tokens";
  }

  if ((snapshot.outputTokens.remaining ?? 0) <= 0) {
    return "output_tokens";
  }

  return null;
}

function hasLowRemainingBudget(metrics: UsageQuotaMetricSnapshot[]) {
  return metrics.some((metric) => {
    if (metric.limit == null || metric.remaining == null) {
      return false;
    }

    return metric.limit > 0 && metric.remaining / metric.limit <= USAGE_WARNING_RATIO;
  });
}

function buildUsageCounterSnapshot(usage: UsageRow | null): UsageCounterSnapshot {
  if (!usage) {
    return {
      hasUsage: false,
      periodStart: null,
      periodEnd: null,
      sessionsCount: 0,
      uploadsCount: 0,
      assistantMessageCount: 0,
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  return {
    hasUsage: true,
    periodStart: usage.period_start,
    periodEnd: usage.period_end,
    sessionsCount: usage.sessions_count,
    uploadsCount: usage.uploads_count,
    assistantMessageCount: usage.assistant_message_count,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
  };
}

function actionAllowsBlockReason(
  action: UsageQuotaAction,
  blockReason: UsageQuotaBlockReason,
) {
  if (!blockReason) {
    return false;
  }

  if (blockReason === "trial_window_expired") {
    return true;
  }

  switch (action) {
    case "create_conversation":
      return (
        blockReason === "sessions" ||
        blockReason === "assistant_messages" ||
        blockReason === "input_tokens" ||
        blockReason === "output_tokens"
      );
    case "create_upload":
      return (
        blockReason === "uploads" ||
        blockReason === "input_tokens" ||
        blockReason === "output_tokens"
      );
    case "append_message":
      return (
        blockReason === "assistant_messages" ||
        blockReason === "input_tokens" ||
        blockReason === "output_tokens"
      );
    default:
      return false;
  }
}

function buildQuotaErrorMessage(
  action: UsageQuotaAction,
  blockReason: UsageQuotaBlockReason,
) {
  if (blockReason === "trial_window_expired") {
    return "La periode d'essai est terminee. Un parent doit activer l'abonnement Family pour continuer.";
  }

  if (blockReason === "sessions") {
    return "La limite de sessions sur la periode courante est atteinte.";
  }

  if (blockReason === "uploads") {
    return "La limite d'uploads sur la periode courante est atteinte.";
  }

  if (blockReason === "assistant_messages") {
    return "La limite de messages IA sur la periode courante est atteinte.";
  }

  if (blockReason === "input_tokens" || blockReason === "output_tokens") {
    return action === "append_message"
      ? "Le budget IA de la periode courante est atteint."
      : "Le budget IA de la periode courante ne permet plus de lancer cette action.";
  }

  return "Le quota courant ne permet plus cette action.";
}

async function loadCurrentUsageRow(studentUserId: string, now: Date) {
  const { periodStart, periodEnd } = getCurrentUsagePeriod(now);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("usage_counters")
    .select(
      "period_start, period_end, sessions_count, uploads_count, assistant_message_count, input_tokens, output_tokens",
    )
    .eq("student_user_id", studentUserId)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd)
    .maybeSingle<UsageRow>();

  if (error) {
    throw toServiceError("Unable to load the current usage counter.", error);
  }

  return data ?? null;
}

async function loadFirstUsageRow(studentUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("usage_counters")
    .select("created_at")
    .eq("student_user_id", studentUserId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<FirstUsageRow>();

  if (error) {
    throw toServiceError("Unable to load the trial anchor.", error);
  }

  return data ?? null;
}

export async function resolveStudentUsageSnapshot(input: {
  studentUserId: string;
  now?: Date;
}): Promise<StudentUsageSnapshot> {
  const now = input.now ?? new Date();
  const [usage, firstUsage, effectiveSubscription] = await Promise.all([
    loadCurrentUsageRow(input.studentUserId, now),
    loadFirstUsageRow(input.studentUserId),
    resolveEffectiveStudentSubscription(input.studentUserId),
  ]);

  const usageSnapshot = buildUsageCounterSnapshot(usage);
  const paidAccess = subscriptionGrantsAccess(
    effectiveSubscription.subscription,
    now,
  );
  const limits = paidAccess ? USAGE_LIMITS.paid : USAGE_LIMITS.trial;
  const trialStartedAt = firstUsage?.created_at ?? null;
  const trialEndsAt = trialStartedAt
    ? addDays(trialStartedAt, USAGE_TRIAL_DURATION_DAYS)
    : null;
  const sessions = buildMetricSnapshot({
    used: usageSnapshot.sessionsCount,
    limit: limits.sessions,
  });
  const uploads = buildMetricSnapshot({
    used: usageSnapshot.uploadsCount,
    limit: limits.uploads,
  });
  const assistantMessages = buildMetricSnapshot({
    used: usageSnapshot.assistantMessageCount,
    limit: limits.assistantMessages,
  });
  const inputTokens = buildMetricSnapshot({
    used: usageSnapshot.inputTokens,
    limit: limits.inputTokens,
  });
  const outputTokens = buildMetricSnapshot({
    used: usageSnapshot.outputTokens,
    limit: limits.outputTokens,
  });
  let blockReason: UsageQuotaBlockReason = findExceededMetric({
    sessions,
    uploads,
    assistantMessages,
    inputTokens,
    outputTokens,
  });

  if (
    !paidAccess &&
    trialEndsAt &&
    Date.parse(trialEndsAt) < now.getTime()
  ) {
    blockReason = "trial_window_expired";
  }

  const currentStatus = effectiveSubscription.subscription?.status ?? null;
  const trialEndingSoon =
    !paidAccess &&
    trialEndsAt != null &&
    Date.parse(trialEndsAt) - now.getTime() <= USAGE_WARNING_DAYS * 24 * 60 * 60 * 1000;
  const lowBudget = hasLowRemainingBudget([
    sessions,
    uploads,
    assistantMessages,
    inputTokens,
    outputTokens,
  ]);
  const hasBillingWarning =
    currentStatus === "past_due" || currentStatus === "canceled";

  return {
    ...usageSnapshot,
    quota: {
      accessState: blockReason
        ? "blocked"
        : trialEndingSoon || lowBudget || hasBillingWarning
          ? "warning"
          : "available",
      planKind: paidAccess ? "paid" : "trial",
      planKey: paidAccess
        ? effectiveSubscription.subscription?.planKey ?? TRIAL_PLAN_KEY
        : TRIAL_PLAN_KEY,
      payerUserId: effectiveSubscription.payerUserId,
      hasPaidSubscription: paidAccess,
      subscriptionStatus: currentStatus,
      trialStartedAt,
      trialEndsAt,
      blockReason,
      sessions,
      uploads,
      assistantMessages,
      inputTokens,
      outputTokens,
    },
  };
}

export async function assertStudentUsageActionAllowed(input: {
  studentUserId: string;
  action: UsageQuotaAction;
}) {
  const snapshot = await resolveStudentUsageSnapshot({
    studentUserId: input.studentUserId,
  });

  if (actionAllowsBlockReason(input.action, snapshot.quota.blockReason)) {
    throw new AppError({
      code: "conflict",
      message: buildQuotaErrorMessage(input.action, snapshot.quota.blockReason),
      status: 409,
    });
  }

  return snapshot;
}

export async function recordStudentUsageDelta(input: {
  studentUserId: string;
  delta: UsageDelta;
}) {
  const now = new Date();
  const { periodStart, periodEnd } = getCurrentUsagePeriod(now);
  const admin = createSupabaseAdminClient();
  const { data: existing, error: selectError } = await admin
    .from("usage_counters")
    .select(
      "period_start, period_end, sessions_count, uploads_count, assistant_message_count, input_tokens, output_tokens",
    )
    .eq("student_user_id", input.studentUserId)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd)
    .maybeSingle<UsageRow>();

  if (selectError) {
    throw toServiceError("Unable to load usage before update.", selectError);
  }

  const nextRow = {
    student_user_id: input.studentUserId,
    period_start: periodStart,
    period_end: periodEnd,
    sessions_count: Math.max(
      (existing?.sessions_count ?? 0) + (input.delta.sessions ?? 0),
      0,
    ),
    uploads_count: Math.max(
      (existing?.uploads_count ?? 0) + (input.delta.uploads ?? 0),
      0,
    ),
    assistant_message_count: Math.max(
      (existing?.assistant_message_count ?? 0) +
        (input.delta.assistantMessages ?? 0),
      0,
    ),
    input_tokens: Math.max(
      (existing?.input_tokens ?? 0) + (input.delta.inputTokens ?? 0),
      0,
    ),
    output_tokens: Math.max(
      (existing?.output_tokens ?? 0) + (input.delta.outputTokens ?? 0),
      0,
    ),
  };

  const { error: upsertError } = await admin.from("usage_counters").upsert(nextRow, {
    onConflict: "student_user_id,period_start,period_end",
  });

  if (upsertError) {
    throw toServiceError("Unable to persist usage counters.", upsertError);
  }
}

export async function recordStudentUsageDeltaBestEffort(input: {
  studentUserId: string;
  delta: UsageDelta;
}) {
  try {
    await recordStudentUsageDelta(input);
  } catch {
    // Usage tracking should not roll back the already-completed user action.
  }
}

export async function recordStudentAiUsageBestEffort(input: {
  studentUserId: string;
  usage: AiUsageSnapshot | null | undefined;
}) {
  const inputTokens = input.usage?.inputTokens ?? 0;
  const outputTokens = input.usage?.outputTokens ?? 0;

  if (inputTokens <= 0 && outputTokens <= 0) {
    return;
  }

  await recordStudentUsageDeltaBestEffort({
    studentUserId: input.studentUserId,
    delta: {
      inputTokens,
      outputTokens,
    },
  });
}
