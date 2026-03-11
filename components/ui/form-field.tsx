import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  error?: string | null;
  className?: string;
  children: ReactNode;
};

export function FormField({
  label,
  error = null,
  className,
  children,
}: FormFieldProps) {
  return (
    <label
      className={["grid gap-2 text-sm", className].filter(Boolean).join(" ")}
    >
      <span className="font-medium">{label}</span>
      {children}
      {error ? <span className="text-[#8d3b1f]">{error}</span> : null}
    </label>
  );
}
