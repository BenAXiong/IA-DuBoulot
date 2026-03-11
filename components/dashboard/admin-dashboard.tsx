import Link from "next/link";

type AdminDashboardProps = {
  auditEventCount: number;
};

export function AdminDashboard({ auditEventCount }: AdminDashboardProps) {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="overview">
        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            Operations
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            Audit sensible
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Les lectures parent/tuteur et les mutations de notes privees sont
            maintenant regroupees dans une vue admin dediee.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            Volume
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            {auditEventCount} evenement(s)
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Le flux actuel couvre les ouvertures de session adulte et les notes
            privees tuteur.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            Route
          </p>
          <h3 className="mt-3 font-[family-name:var(--font-heading)] text-2xl leading-tight">
            /app/audit
          </h3>
          <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
            Surface admin initiale pour revue de confiance et support.
          </p>
        </article>
      </section>

      <section
        className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.92fr_1.08fr]"
        id="operations"
      >
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Ops
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            Le shell admin pointe maintenant vers une vraie revue des acces sensibles.
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            Cette etape ne couvre pas encore toute l&apos;ops du produit, mais elle
            ferme deja la boucle sur les acces adultes et les notes privees.
          </p>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
          <p>
            Les prochaines surfaces admin pourront se brancher ici sans melanger
            moderation, support et audit dans un panneau unique.
          </p>
          <Link
            className="inline-flex justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
            href="/app/audit"
          >
            Ouvrir l&apos;audit
          </Link>
        </article>
      </section>
    </div>
  );
}
