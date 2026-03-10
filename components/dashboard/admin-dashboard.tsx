import { DashboardCard } from "@/components/dashboard/dashboard-card";

const adminCards = [
  {
    eyebrow: "Operations",
    title: "Surface admin minimale",
    body: "Le shell admin reste volontairement etroit tant que les vues d'audit et moderation ne sont pas implementees.",
  },
  {
    eyebrow: "Contrats",
    title: "Schema et routes avant breadth UI",
    body: "L'ordre d'implementation continue de privilegier les contrats et la tracabilite avant la richesse des panneaux.",
  },
  {
    eyebrow: "Suite MVP",
    title: "Outils ops plus tard",
    body: "Les tables et routes existent dans la roadmap, mais les vraies vues admin viennent apres les parcours coeur.",
  },
] as const;

export function AdminDashboard() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="overview">
        {adminCards.map((card) => (
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
        id="operations"
      >
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Ops
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            Shell en place pour les futures surfaces moderation, audit et support.
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            La valeur ici est surtout structurelle: navigation, zones de contenu
            et separation nette entre chrome applicatif et panels metier.
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
          <p>
            Les vraies listes utilisateurs, moderation events et audit logs
            attendent encore leurs routes et vues dediees.
          </p>
        </article>
      </section>
    </div>
  );
}
