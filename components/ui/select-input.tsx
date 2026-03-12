import type { ComponentPropsWithoutRef } from "react";

type SelectInputProps = ComponentPropsWithoutRef<"select">;

export function SelectInput({ className, ...props }: SelectInputProps) {
  return (
    <select
      className={[
        "field-control rounded-2xl px-4 py-3 outline-none transition focus:border-[color:var(--accent)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
