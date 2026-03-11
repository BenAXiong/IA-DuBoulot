import "server-only";

export type UsageCounterSnapshot = {
  hasUsage: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  sessionsCount: number;
  uploadsCount: number;
  assistantMessageCount: number;
  inputTokens: number;
  outputTokens: number;
};

export type UsageQuotaMetricName =
  | "sessions"
  | "uploads"
  | "assistant_messages"
  | "input_tokens"
  | "output_tokens";

export type UsageQuotaAction =
  | "create_conversation"
  | "create_upload"
  | "append_message";

export type UsageQuotaMetricSnapshot = {
  used: number;
  limit: number | null;
  remaining: number | null;
};

export type UsageQuotaBlockReason = UsageQuotaMetricName | "trial_window_expired" | null;

export type UsageQuotaSnapshot = {
  accessState: "available" | "warning" | "blocked";
  planKind: "trial" | "paid";
  planKey: string;
  payerUserId: string | null;
  hasPaidSubscription: boolean;
  subscriptionStatus: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  blockReason: UsageQuotaBlockReason;
  sessions: UsageQuotaMetricSnapshot;
  uploads: UsageQuotaMetricSnapshot;
  assistantMessages: UsageQuotaMetricSnapshot;
  inputTokens: UsageQuotaMetricSnapshot;
  outputTokens: UsageQuotaMetricSnapshot;
};

export type StudentUsageSnapshot = UsageCounterSnapshot & {
  quota: UsageQuotaSnapshot;
};

export type UsageDelta = Partial<{
  sessions: number;
  uploads: number;
  assistantMessages: number;
  inputTokens: number;
  outputTokens: number;
}>;
