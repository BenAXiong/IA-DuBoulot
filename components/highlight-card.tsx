type HighlightCardProps = {
  title: string;
  body: string;
};

export function HighlightCard({ title, body }: HighlightCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
      <p className="font-[family-name:var(--font-heading)] text-xl">{title}</p>
      <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
        {body}
      </p>
    </article>
  );
}
