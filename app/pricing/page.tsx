import Link from "next/link";
import { HighlightCard } from "@/components/highlight-card";
import { PublicShell } from "@/components/layout/public-shell";

const tiers = [
  {
    name: "Pilot",
    price: "Free / invite",
    body: "Pour la phase de construction et les premiers retours terrain avant un packaging stable.",
    points: [
      "Acces supervise",
      "Auth et invitations reelles",
      "Quota d'essai actif",
    ],
  },
  {
    name: "Family",
    price: "TBD MVP",
    body: "Cible parent payeur avec suivi enfant, resumes et futur portail de facturation.",
    points: [
      "Compte parent payeur",
      "Historique et supervision",
      "Checkout et portail Lemon Squeezy",
    ],
  },
  {
    name: "Tutor",
    price: "TBD later",
    body: "Surface tuteur liee a un eleve, pensee pour suivi pedagogique plutot que marketplace.",
    points: [
      "Lien invite trace",
      "Acces restreint par role",
      "Notes privees a venir",
    ],
  },
] as const;

export default function PricingPage() {
  return (
    <PublicShell>
      <main className="px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[1fr_0.9fr] md:p-8">
            <article className="space-y-4">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                Pricing shell
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
                Une page pricing credible sans figer trop tot le business model.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[color:var(--ink-soft)]">
                Le MVP ne vend pas encore un abonnement final. Cette page sert a
                poser le vocabulaire public et a preparer l&apos;integration Lemon
                Squeezy sans surpromettre les offres.
              </p>
            </article>

            <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <HighlightCard
                body="Le parcours parent pointe maintenant vers le vrai chemin de checkout et de portail. Le parametrage Lemon final reste a activer selon l'environnement."
                title="MVP posture"
              />
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {tiers.map((tier) => (
              <article
                className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
                key={tier.name}
              >
                <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
                  {tier.name}
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-heading)] text-3xl">
                  {tier.price}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                  {tier.body}
                </p>
                <ul className="mt-5 grid gap-2 text-sm leading-6">
                  {tier.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5"
              href="/auth"
            >
              Tester l&apos;auth
            </Link>
            <Link
              className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-medium transition hover:-translate-y-0.5"
              href="/"
            >
              Retour produit
            </Link>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
