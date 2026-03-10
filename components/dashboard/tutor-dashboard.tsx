import { DashboardCard } from "@/components/dashboard/dashboard-card";

const tutorCards = [
  {
    eyebrow: "Acces",
    title: "Role tuteur cloisonne",
    body: "Le shell tuteur reste distinct du parent et de l'eleve pour garder des attentes d'acces claires.",
  },
  {
    eyebrow: "Invitation",
    title: "Lien trace avant dashboard complet",
    body: "Un tuteur peut deja accepter un lien canoniquement persiste avant meme l'arrivee du suivi detaille.",
  },
  {
    eyebrow: "Notes",
    title: "Espace de notes plus tard",
    body: "La vraie surface notes et apercus eleve arrive en phase A5 sans detruire la structure actuelle.",
  },
] as const;

export function TutorDashboard() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="overview">
        {tutorCards.map((card) => (
          <DashboardCard
            body={card.body}
            eyebrow={card.eyebrow}
            key={card.title}
            title={card.title}
          />
        ))}
      </section>

      <section
        className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.92fr_1.08fr]"
        id="links"
      >
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Liens
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            Les invitations tuteur vivent deja en base et s&apos;acceptent cote serveur.
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            Cela donne une piste de navigation stable pour les futures listes
            d&apos;eleves, notes privees et insights pedagogiques.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
          <p>
            Pour un eleve de moins de 13 ans, seul un parent deja lie peut
            initier l&apos;invitation tuteur. Ce garde-fou est deja porte par le
            service serveur, pas par une simple contrainte UI.
          </p>
        </article>
      </section>
    </div>
  );
}
