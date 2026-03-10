import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseEnv, env } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  assertSupabaseEnv();

  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return browserClient;
}
