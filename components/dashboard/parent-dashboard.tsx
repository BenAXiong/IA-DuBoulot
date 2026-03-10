import { DashboardCard } from "@/components/dashboard/dashboard-card";

const parentCards = [
  {
    eyebrow: "Supervision",
    title: "Vue parent dediee",
    body: "Le shell parent est separe du shell eleve pour que la supervision ne se melange pas avec l'espace de travail enfant.",
  },
  {
    eyebrow: "Liens",
    title: "Invitations accepteables",
    body: "Les parents peuvent deja recevoir un lien, finir leur onboarding puis accepter la relation depuis `/invite/[token]`.",
  },
  {
    eyebrow: "Suite MVP",
    title: "Oversight detail plus tard",
    body: "Les vraies listes d'eleves, resumes et statuts de session arriveront dans la phase A5.",
  },
] as const;

export function ParentDashboard() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="overview">
        {parentCards.map((card) => (
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
        id="students"
      >
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Eleves
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            Surface parent orientee supervision, pas edition du travail.
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            Le modele d&apos;acces reste volontairement asymetrique: un parent voit,
            approuve et supervise, mais n&apos;edite pas la conversation ni l&apos;espace
            de travail eleve.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
          <p>
            A ce stade, l&apos;etat parent principal est l&apos;acceptation d&apos;une invitation
            recue depuis un compte eleve de moins de 13 ans.
          </p>
          <p className="mt-3">
            Les ecrans de liste d&apos;eleves, statut d&apos;abonnement et apercu des
            sessions seront construits dans la phase A5 sans casser ce shell.
          </p>
        </article>
      </section>
    </div>
  );
}
