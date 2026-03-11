export const env = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_ENABLE_ANALYTICS:
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  ENABLE_OPENAI_FALLBACK: process.env.ENABLE_OPENAI_FALLBACK === "true",
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  NEXT_PUBLIC_POSTHOG_HOST:
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  ENABLE_RESEND_EMAILS: process.env.ENABLE_RESEND_EMAILS === "true",
  ENABLE_PARENT_AI_ACTIONS:
    process.env.ENABLE_PARENT_AI_ACTIONS === "true",
  LEMON_SQUEEZY_API_KEY: process.env.LEMON_SQUEEZY_API_KEY ?? "",
  LEMON_SQUEEZY_WEBHOOK_SECRET:
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? "",
  LEMON_SQUEEZY_STORE_ID: process.env.LEMON_SQUEEZY_STORE_ID ?? "",
  LEMON_SQUEEZY_VARIANT_ID_FAMILY_MONTHLY:
    process.env.LEMON_SQUEEZY_VARIANT_ID_FAMILY_MONTHLY ?? "",
  LEMON_SQUEEZY_TEST_MODE:
    process.env.LEMON_SQUEEZY_TEST_MODE === "true",
};

export function hasSupabaseEnv() {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasSupabaseServiceRoleEnv() {
  return hasSupabaseEnv() && Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
}

export function assertSupabaseEnv() {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Missing Supabase environment variables. Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first.",
    );
  }
}

export function assertSupabaseServiceRoleEnv() {
  if (!hasSupabaseServiceRoleEnv()) {
    throw new Error(
      "Missing Supabase server environment variables. Fill SUPABASE_SERVICE_ROLE_KEY for privileged server routes.",
    );
  }
}
