"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SignOutButtonProps = {
  label: string;
  pendingLabel: string;
  redirectHref: string;
  className?: string;
};

export function SignOutButton({
  label,
  pendingLabel,
  redirectHref,
  className,
}: SignOutButtonProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className={className ?? "button-base button-secondary"}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await supabase.auth.signOut();
          router.push(redirectHref);
          router.refresh();
        });
      }}
      type="button"
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}
