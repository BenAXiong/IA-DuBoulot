type StudentStatusPillProps = {
  label: string;
  tone?: "neutral" | "accent" | "warning";
};

const toneClassName: Record<NonNullable<StudentStatusPillProps["tone"]>, string> = {
  neutral: "border border-[color:var(--line)] bg-white/70 text-[color:var(--foreground)]",
  accent:
    "border border-[rgba(203,95,44,0.24)] bg-[rgba(203,95,44,0.12)] text-[color:var(--foreground)]",
  warning:
    "border border-[rgba(208,124,91,0.4)] bg-[#fff0ea] text-[#8d3b1f]",
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
