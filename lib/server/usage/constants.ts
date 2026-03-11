import "server-only";

export const USAGE_TRIAL_DURATION_DAYS = 30;
export const USAGE_WARNING_DAYS = 5;
export const USAGE_WARNING_RATIO = 0.2;

export const TRIAL_PLAN_KEY = "trial_free";

export const USAGE_LIMITS = {
  trial: {
    sessions: 20,
    uploads: 40,
    assistantMessages: 200,
    inputTokens: 500_000,
    outputTokens: 250_000,
  },
  paid: {
    sessions: 120,
    uploads: 240,
    assistantMessages: 1_200,
    inputTokens: 3_000_000,
    outputTokens: 1_500_000,
  },
} as const;
