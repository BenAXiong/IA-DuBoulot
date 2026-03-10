import Link from "next/link";

type PublicShellProps = {
  children: React.ReactNode;
};

const footerColumns = [
  {
    title: "Produit",
    items: [
      "Aide aux devoirs supervisee",
      "Interface FR / EN / ZH",
      "IA FR-first",
    ],
  },
  {
    title: "Build status",
    items: [
      "Supabase SSR auth reliee",
      "Invitations parent / tuteur en place",
      "Vercel et schema live deja branches",
    ],
  },
  {
    title: "Trajectoire",
    items: [
      "Dashboards role-aware en cours",
      "Intake devoir ensuite",
      "Lemon Squeezy branche plus tard dans le MVP",
    ],
  },
] as const;

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(203,95,44,0.17),transparent_62%)]" />

      <header className="px-5 py-5 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-5 py-3 shadow-[var(--shadow)] backdrop-blur">
          <Link
            className="font-[family-name:var(--font-heading)] text-lg tracking-[0.08em]"
            href="/"
          >
            IA DuBoulot
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--ink-soft)]">
            <Link
              className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[color:var(--foreground)]"
              href="/"
            >
              Produit
            </Link>
            <Link
              className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[color:var(--foreground)]"
              href="/pricing"
            >
              Pricing
            </Link>
            <Link
              className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-[color:var(--foreground)]"
              href="/auth"
            >
              Auth
            </Link>
          </nav>

          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
              href="/auth?mode=sign_up&role=student"
            >
              Commencer
            </Link>
            <Link
              className="rounded-full bg-[color:var(--foreground)] px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5"
              href="/auth"
            >
              Ouvrir l&apos;app
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="px-5 pb-8 pt-10 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.9fr_1.1fr] md:p-8">
          <div className="space-y-4">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.26em] text-[color:var(--ink-soft)]">
              Public shell
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
              Une base publique claire pendant que les flux metier montent en puissance.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-[color:var(--ink-soft)]">
              Cette couche couvre le landing, le pricing, l&apos;auth, l&apos;onboarding
              et les liens d&apos;invitation sans dupliquer la navigation ni la
              structure visuelle.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <article
                className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4"
                key={column.title}
              >
                <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                  {column.title}
                </p>
                <ul className="mt-3 grid gap-2 text-sm leading-6 text-[color:var(--foreground)]">
                  {column.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
