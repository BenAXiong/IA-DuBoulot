import type { ComponentPropsWithoutRef } from "react";

type SelectInputProps = ComponentPropsWithoutRef<"select">;

export function SelectInput({ className, ...props }: SelectInputProps) {
  return (
    <select
      className={[
        "rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
