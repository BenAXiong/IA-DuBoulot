import type { ButtonHTMLAttributes } from "react";

type ActionButtonVariant = "primary" | "secondary" | "danger";

type ActionButtonProps = {
  variant?: ActionButtonVariant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClassName: Record<ActionButtonVariant, string> = {
  primary: "button-primary",
  secondary: "button-secondary",
  danger: "button-danger",
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
        "button-base",
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
