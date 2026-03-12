type StudentStatusPillProps = {
  label: string;
  tone?: "neutral" | "accent" | "warning";
};

const toneClassName: Record<NonNullable<StudentStatusPillProps["tone"]>, string> = {
  neutral:
    "border border-[color:var(--line)] bg-[color:var(--surface-raised)] text-[color:var(--foreground)]",
  accent:
    "border border-[color:var(--accent-soft)] bg-[color:var(--accent-quiet)] text-[color:var(--foreground)]",
  warning:
    "callout-warning border",
};

export function StudentStatusPill({
  label,
  tone = "neutral",
}: StudentStatusPillProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${toneClassName[tone]}`}
    >
      {label}
    </span>
  );
}
