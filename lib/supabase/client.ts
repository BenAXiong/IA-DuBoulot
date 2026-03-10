import { createClient } from "@supabase/supabase-js";
import { assertSupabaseEnv, env } from "@/lib/env";

export function createSupabaseBrowserClient() {
  assertSupabaseEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
