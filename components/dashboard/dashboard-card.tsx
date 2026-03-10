type DashboardCardProps = {
  eyebrow: string;
  title: string;
  body: string;
};

export function DashboardCard({ eyebrow, title, body }: DashboardCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
        {eyebrow}
      </p>
      <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
        {body}
      </p>
    </article>
  );
}
