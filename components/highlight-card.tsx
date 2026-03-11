import { SurfaceCard } from "@/components/ui/surface-card";

type HighlightCardProps = {
  title: string;
  body: string;
};

export function HighlightCard({ title, body }: HighlightCardProps) {
  return (
    <SurfaceCard as="article">
      <p className="font-[family-name:var(--font-heading)] text-xl">{title}</p>
      <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
        {body}
      </p>
    </SurfaceCard>
  );
}
