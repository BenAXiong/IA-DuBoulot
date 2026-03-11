import type { ElementType, ReactNode } from "react";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
} & Record<string, unknown>;

export function SurfaceCard({
  children,
  className,
  as: Component = "div",
  ...props
}: SurfaceCardProps) {
  return (
    <Component
      className={[
        "rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}
