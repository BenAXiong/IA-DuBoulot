import type { ButtonHTMLAttributes } from "react";

type ActionButtonVariant = "primary" | "secondary" | "danger";

type ActionButtonProps = {
  variant?: ActionButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClassName: Record<ActionButtonVariant, string> = {
  primary:
    "bg-[color:var(--foreground)] text-white hover:-translate-y-0.5",
  secondary:
    "border border-[color:var(--line)] bg-white text-[color:var(--foreground)] hover:-translate-y-0.5",
  danger:
    "border border-[#b34f32] bg-[#cb5d3c] text-white hover:-translate-y-0.5",
};

export function ActionButton({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={[
        "rounded-full px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70",
        variantClassName[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      type={type}
      {...props}
    />
  );
}
