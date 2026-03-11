import { AccountSettingsForm } from "@/components/auth/account-settings-form";
import { BillingStatusCard } from "@/components/dashboard/oversight/billing-status-card";
import { formatDateLabel } from "@/components/dashboard/student/student-dashboard-presenters";
import { DeletionRequestForm } from "@/components/dashboard/settings/deletion-request-form";
import type { AppUserRecord } from "@/lib/server/auth/types";
import type { PrivacySettingsSnapshot } from "@/lib/server/privacy/types";

type PrivacySettingsViewProps = {
  appUser: AppUserRecord;
  snapshot: PrivacySettingsSnapshot;
};

const retentionRules = [
  {
    title: "Demandes en attente",
    body: "Les approbations parentales non finalisees visent une purge apres 7 jours.",
  },
  {
    title: "Contenu eleve inactif",
    body: "Les contenus eleve inactifs passent en revue a 180 jours avant suppression.",
  },
  {
    title: "Acces sensibles",
    body: "Les audits d'acces parent, tuteur, admin et billing restent conserves 12 mois.",
  },
  {
    title: "Suppression demandee",
    body: "Le compte est gele tout de suite et la purge des contenus d'apprentissage vise 30 jours hors sauvegardes et obligations billing/securite.",
  },
];

const providerRules = [
  {
    title: "Supabase",
    body: "Heberge l'authentification, les profils, les conversations, les liens et les fichiers prives.",
  },
  {
    title: "Gemini",
    body: "Recoit uniquement le contenu utile au devoir, avec assemblage des prompts cote serveur.",
  },
  {
    title: "Lemon Squeezy",
    body: "Traite la facturation parentale. Les traces billing peuvent survivre a la purge des contenus eleve si la loi ou l'operation l'exige.",
  },
  {
    title: "PostHog et Resend",
    body: "Resteront limites aux evenements produit et aux emails transactionnels une fois configures, sans contenu brut de devoir.",
  },
];

function buildDataCategories(appUser: AppUserRecord) {
  const common = [
    "profil applicatif limite au nom affiche, langues, role et tranche d'age",
    "liens parent-eleve et tuteur-eleve explicites et auditables",
    "sessions, messages, pieces jointes, texte extrait et resumes",
  ];

  if (appUser.role === "student") {
    return [
      ...common,
      "etat de quota, essais et consommation IA",
      "memoire pedagogique reservee aux signaux educatifs utiles",
    ];
  }

  if (appUser.role === "parent") {
    return [
      ...common,
      "etat payeur et abonnement Family du compte parent",
      "visibilite sur les donnees enfant liees et les demandes de suppression",
    ];
  }

  if (appUser.role === "tutor") {
    return [
      ...common,
      "notes privees tuteur invisibles a l'eleve et au parent",
      "aucune lecture brute des tables memoire ou des compteurs d'usage enfant",
    ];
  }

  return [
    "audit des acces sensibles et moderation",
    "gestion exceptionelle des donnees via surfaces admin dediees",
    "pas de parcours libre-service pour la suppression du compte admin",
  ];
}

function buildRoleIntro(appUser: AppUserRecord) {
  if (appUser.role === "student" && appUser.is_under_13) {
    return "Le compte eleve de moins de 13 ans reste sous controle parental. Le parent lie pilote la suppression et voit les categories de donnees conservees.";
  }

  if (appUser.role === "student") {
    return "Le compte eleve peut voir les donnees utiles a l'apprentissage, comprendre les regles de retention et demander sa suppression s'il n'est pas sous controle parental.";
  }

  if (appUser.role === "parent") {
    return "Le compte parent centralise la facturation, la supervision enfant et les demandes de suppression des donnees d'apprentissage liees.";
  }

  if (appUser.role === "tutor") {
    return "Le compte tuteur garde un acces pedagogique limite: sessions visibles, notes privees et suppression du compte sans toucher aux donnees parentales.";
  }

  return "Le compte admin garde une vue operationnelle. Les controles libre-service restent bloques pour eviter les suppressions accidentelles du role le plus sensible.";
}

function buildSelfDeletionButtonLabel(appUser: AppUserRecord) {
  if (appUser.role === "parent") {
    return "Demander la suppression du compte parent";
  }

  if (appUser.role === "tutor") {
    return "Demander la suppression du compte tuteur";
  }

  return "Demander la suppression du compte";
}

export function PrivacySettingsView({
  appUser,
  snapshot,
}: PrivacySettingsViewProps) {
  const isFrozen = appUser.account_status === "deletion_requested";
  const dataCategories = buildDataCategories(appUser);

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] lg:grid-cols-[1.1fr_0.9fr]">
        <article className="space-y-4">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Reglages et confidentialite
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight sm:text-5xl">
            Un point d&apos;entree stable pour le profil, la facturation et les
            controles de donnees.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--ink-soft)]">
            {buildRoleIntro(appUser)}
          </p>
        </article>

        <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
          <p>
            Le MVP explique ici ce qui est stocke, pourquoi, pendant combien de
            temps, et qui peut demander une suppression.
          </p>
          <p>
            Le produit limite la collecte aux donnees d&apos;apprentissage et garde
            les traces billing ou securite separees des contenus eleve.
          </p>
          {isFrozen ? (
            <p className="rounded-[1.25rem] border border-[#d6c48d] bg-[#fff8e5] px-4 py-3 text-[#6b5320]">
              Une suppression est deja en file pour ce compte depuis le{" "}
              {formatDateLabel(appUser.deletion_requested_at, appUser.preferred_ui_language)}.
              Les autres workflows restent bloques tant que cette file n&apos;est
              pas relevee.
            </p>
          ) : null}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article
          className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
          id="settings"
        >
          <div className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              Profil
            </p>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              Les champs editables restent limites au profil applicatif utile.
            </p>
          </div>

          {isFrozen ? (
            <div className="rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
              Le profil n&apos;est plus editable pendant la file de suppression.
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <AccountSettingsForm appUser={appUser} />
            </div>
          )}
        </article>

        {appUser.role === "parent" && snapshot.billing ? (
          <BillingStatusCard
            billing={snapshot.billing}
            languageCode={appUser.preferred_ui_language}
          />
        ) : (
          <article className="grid gap-4 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
                Confidentialite
              </p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                Les traces sensibles et les suppressions demandent des etapes explicites, pas des effets caches.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
              {appUser.role === "admin"
                ? "Le role admin garde les surfaces d'audit, mais la suppression libre-service reste desactivee."
                : "Ce compte n'a pas de panneau billing dedie. La priorite ici est la lisibilite des donnees et des controles de suppression."}
            </div>
          </article>
        )}
      </section>

      <section
        className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
        id="privacy"
      >
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Donnees et retention
          </p>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            La collecte reste limitee aux donnees utiles au coaching, a la supervision et a la securite du produit.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <p className="font-medium">Categories visibles</p>
            <ul className="grid gap-2 text-sm leading-6 text-[color:var(--ink-soft)]">
              {dataCategories.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <p className="font-medium">Fenetres de retention</p>
            <ul className="grid gap-3 text-sm leading-6 text-[color:var(--ink-soft)]">
              {retentionRules.map((rule) => (
                <li key={rule.title}>
                  <span className="font-medium text-[color:var(--foreground)]">
                    {rule.title}:{" "}
                  </span>
                  {rule.body}
                </li>
              ))}
            </ul>
          </article>

          <article className="grid gap-3 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <p className="font-medium">Prestataires utilises</p>
            <ul className="grid gap-3 text-sm leading-6 text-[color:var(--ink-soft)]">
              {providerRules.map((rule) => (
                <li key={rule.title}>
                  <span className="font-medium text-[color:var(--foreground)]">
                    {rule.title}:{" "}
                  </span>
                  {rule.body}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section
        className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]"
        id="deletion"
      >
        <div className="space-y-3">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Suppression et gel
          </p>
          <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
            Une demande de suppression gele le compte tout de suite, coupe les
            nouveaux workflows, puis lance une purge ciblee des contenus
            d&apos;apprentissage.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <div className="space-y-2">
              <p className="font-medium">Mon compte</p>
              <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                {snapshot.selfDeletion
                  ? "La demande supprime les contenus pedagogiques, coupe les acces relies et garde seulement les traces billing ou securite strictement necessaires."
                  : "Le compte admin ne propose pas de suppression libre-service."}
              </p>
            </div>

            {snapshot.selfDeletion ? (
              <DeletionRequestForm
                buttonLabel={buildSelfDeletionButtonLabel(appUser)}
                disabledReason={snapshot.selfDeletion.blockedReason}
                languageCode={appUser.preferred_ui_language}
                purgeTargetDate={snapshot.selfDeletion.purgeTargetDate}
                requestedAt={snapshot.selfDeletion.requestedAt}
                targetDisplayName={snapshot.selfDeletion.displayName}
              />
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                La suppression du compte admin reste une operation manuelle et auditee.
              </div>
            )}
          </article>

          {appUser.role === "parent" ? (
            <article className="grid gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
              <div className="space-y-2">
                <p className="font-medium">Eleves lies</p>
                <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                  Le parent peut demander la suppression d&apos;un compte eleve lie.
                  Le compte eleve est gele tout de suite et les acces tuteur sont
                  revoques.
                </p>
              </div>

              {snapshot.linkedStudentDeletionTargets.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                  Aucun eleve lie ne peut etre gere depuis ce compte parent.
                </div>
              ) : (
                <div className="grid gap-3">
                  {snapshot.linkedStudentDeletionTargets.map((target) => (
                    <div
                      className="grid gap-3 rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-4"
                      key={target.targetUserId}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{target.displayName}</p>
                        <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
                          Statut actuel: {target.requestedAt ? "suppression demandee" : "actif ou supervise"}.
                        </p>
                      </div>

                      <DeletionRequestForm
                        buttonLabel="Demander la suppression des donnees eleve"
                        disabledReason={target.blockedReason}
                        languageCode={appUser.preferred_ui_language}
                        purgeTargetDate={target.purgeTargetDate}
                        requestedAt={target.requestedAt}
                        targetDisplayName={target.displayName}
                        targetUserId={target.targetUserId}
                      />
                    </div>
                  ))}
                </div>
              )}
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
