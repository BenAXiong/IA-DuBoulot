import { env } from "@/lib/env";

export function isAnalyticsEnabled() {
  return env.NEXT_PUBLIC_ENABLE_ANALYTICS;
}

export function isPostHogConfigured() {
  return Boolean(env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function isOpenAiFallbackEnabled() {
  return env.ENABLE_OPENAI_FALLBACK && Boolean(env.OPENAI_API_KEY);
}

export function isResendEmailEnabled() {
  return env.ENABLE_RESEND_EMAILS && Boolean(env.RESEND_API_KEY);
}

export function isParentAiActionsEnabled() {
  return env.ENABLE_PARENT_AI_ACTIONS;
}

export function getRiskyIntegrationFlags() {
  return {
    analytics: isAnalyticsEnabled(),
    posthogConfigured: isPostHogConfigured(),
    openAiFallback: isOpenAiFallbackEnabled(),
    resendEmail: isResendEmailEnabled(),
    parentAiActions: isParentAiActionsEnabled(),
  };
}
