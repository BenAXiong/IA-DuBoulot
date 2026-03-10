"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="rounded-full border border-[color:var(--line)] bg-white/80 px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await supabase.auth.signOut();
          router.push("/auth");
          router.refresh();
        });
      }}
      type="button"
    >
      {isPending ? "Deconnexion..." : "Se deconnecter"}
    </button>
  );
}
