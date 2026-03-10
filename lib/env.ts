function readEnv(name: string) {
  return process.env[name];
}

export const env = {
  NEXT_PUBLIC_APP_URL: readEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: readEnv("NEXT_PUBLIC_SUPABASE_URL") ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? "",
  SUPABASE_SERVICE_ROLE_KEY: readEnv("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  GEMINI_API_KEY: readEnv("GEMINI_API_KEY") ?? "",
  NEXT_PUBLIC_POSTHOG_KEY: readEnv("NEXT_PUBLIC_POSTHOG_KEY") ?? "",
  NEXT_PUBLIC_POSTHOG_HOST:
    readEnv("NEXT_PUBLIC_POSTHOG_HOST") ?? "https://us.i.posthog.com",
  RESEND_API_KEY: readEnv("RESEND_API_KEY") ?? "",
  LEMON_SQUEEZY_API_KEY: readEnv("LEMON_SQUEEZY_API_KEY") ?? "",
  LEMON_SQUEEZY_WEBHOOK_SECRET:
    readEnv("LEMON_SQUEEZY_WEBHOOK_SECRET") ?? "",
};

export function hasSupabaseEnv() {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function assertSupabaseEnv() {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Missing Supabase environment variables. Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first.",
    );
  }
}
