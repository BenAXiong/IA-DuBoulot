import type { ComponentPropsWithoutRef } from "react";

type TextInputProps = ComponentPropsWithoutRef<"input">;

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
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
