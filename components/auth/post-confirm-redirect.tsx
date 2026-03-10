"use client";

import { useEffect } from "react";

type PostConfirmRedirectProps = {
  nextPath: string;
};

export function PostConfirmRedirect({
  nextPath,
}: PostConfirmRedirectProps) {
  useEffect(() => {
    window.location.replace(nextPath);
  }, [nextPath]);

  return (
    <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
      Session confirmee. Redirection en cours vers la suite du flux.
    </div>
  );
}
