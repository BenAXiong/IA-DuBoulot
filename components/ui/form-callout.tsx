import type { ReactNode } from "react";

type FormCalloutVariant = "error" | "success" | "info";

type FormCalloutProps = {
  children: ReactNode;
  variant?: FormCalloutVariant;
};

const variantClassName: Record<FormCalloutVariant, string> = {
  error: "border-[#d07c5b] bg-[#fff0ea] text-[#8d3b1f]",
  success: "border-[#8cb88b] bg-[#eef8ee] text-[#295a2a]",
  info: "border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--ink-soft)]",
};

export function FormCallout({
  children,
  variant = "info",
}: FormCalloutProps) {
  return (
    <p
      className={[
        "rounded-2xl border px-4 py-3 text-sm leading-6",
        variantClassName[variant],
      ].join(" ")}
    >
      {children}
    </p>
  );
}
