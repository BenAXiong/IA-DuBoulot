import { ParentApprovalRequestForm } from "@/components/links/parent-approval-request-form";
import { TutorInviteForm } from "@/components/links/tutor-invite-form";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import type { AppUserRecord } from "@/lib/server/auth/types";

type StudentDashboardProps = {
  appUser: AppUserRecord;
};

export function StudentDashboard({ appUser }: StudentDashboardProps) {
  const cards = appUser.is_under_13
    ? [
        {
          eyebrow: "Etat",
          title: "Compte supervise",
          body: "Le profil est configure pour un usage sous supervision parentale avec activation liee a un adulte.",
        },
        {
          eyebrow: "Lien adulte",
          title: "Approbation parentale requise",
          body: "Le prochain jalon est la creation d'un lien parent valide via invitation.",
        },
        {
          eyebrow: "Suite MVP",
          title: "Dashboard eleve avant le chat",
          body: "Cette surface sert deja de tremplin pour l'intake devoir et la reprise de session qui arrivent en phase A3.",
        },
      ]
    : [
        {
          eyebrow: "Etat",
          title: "Compte eleve actif",
          body: "Le compte est pret pour les prochaines etapes produit, avec un shell protege deja role-aware.",
        },
        {
          eyebrow: "Tutorat",
          title: "Invitations tuteur deja branchees",
          body: "Un eleve de 13 ans et plus peut maintenant emettre un lien tuteur tracable depuis cette surface.",
        },
        {
          eyebrow: "Suite MVP",
          title: "Intake devoir ensuite",
          body: "Le prochain gros bloc produit reste la creation de session, les uploads et la conversation de coaching.",
        },
      ];

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" id="overview">
        {cards.map((card) => (
          <DashboardCard
            body={card.body}
            eyebrow={card.eyebrow}
            key={card.title}
            title={card.title}
          />
        ))}
      </section>

      <section
        className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.85fr_1.15fr]"
        id="actions"
      >
        <article className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Actions
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
            {appUser.is_under_13
              ? "Activer la supervision parentale"
              : "Brancher un adulte de confiance autour du compte"}
          </h2>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            {appUser.is_under_13
              ? "Le flux parent devient concret maintenant: une invitation persistante, un lien acceptee cote parent, puis activation du compte eleve."
              : "Le shell et les autorisations sont prets pour un usage encadre avec tuteur, avant meme l'arrivee du vrai dashboard devoir."}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
          {appUser.is_under_13 ? <ParentApprovalRequestForm /> : <TutorInviteForm />}
        </article>
      </section>
    </div>
  );
}
