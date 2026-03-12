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
      className={["shell-card rounded-[1.5rem] p-5", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}
