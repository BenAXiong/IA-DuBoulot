import type { ReactNode } from "react";

type FormCalloutVariant = "error" | "success" | "info";

type FormCalloutProps = {
  children: ReactNode;
  variant?: FormCalloutVariant;
};

const variantClassName: Record<FormCalloutVariant, string> = {
  error: "callout-error",
  success: "callout-success",
  info: "callout-info",
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
