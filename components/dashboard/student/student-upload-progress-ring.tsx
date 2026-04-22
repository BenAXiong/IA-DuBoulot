"use client";

type StudentUploadProgressRingProps = {
  completedSegments: 1 | 2 | 3;
};

export function StudentUploadProgressRing({
  completedSegments,
}: StudentUploadProgressRingProps) {
  const fillRatio = completedSegments / 3;
  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fillRatio);

  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 -rotate-90"
      viewBox="0 0 20 20"
    >
      <circle
        cx="10"
        cy="10"
        fill="none"
        r={radius}
        stroke="color-mix(in srgb, var(--foreground) 14%, transparent)"
        strokeWidth="2"
      />
      <circle
        cx="10"
        cy="10"
        fill="none"
        r={radius}
        stroke="var(--accent)"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}
