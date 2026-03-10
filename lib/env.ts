export const env = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  NEXT_PUBLIC_POSTHOG_HOST:
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  LEMON_SQUEEZY_API_KEY: process.env.LEMON_SQUEEZY_API_KEY ?? "",
  LEMON_SQUEEZY_WEBHOOK_SECRET:
    process.env.LEMON_SQUEEZY_WEBHOOK_SECRET ?? "",
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
