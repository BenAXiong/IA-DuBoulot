type ProfileAvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizeClassName = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-14 w-14 text-lg",
} as const;

function readInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";
}

export function ProfileAvatar({
  name,
  size = "md",
}: ProfileAvatarProps) {
  return (
    <div
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-[color:var(--line-strong)] bg-[linear-gradient(135deg,var(--brand-soft),var(--accent-quiet))] font-semibold text-[color:var(--foreground)] ${sizeClassName[size]}`}
    >
      {readInitials(name)}
    </div>
  );
}
