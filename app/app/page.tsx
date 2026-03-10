import { AccountSettingsForm } from "@/components/auth/account-settings-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireAppPageContext } from "@/lib/server/auth/page-guards";

const nextSlices = [
  "Relier les flux role-aware d'invitation et d'approbation.",
  "Brancher l'intake devoir sur le corpus d'attachments source-controlled.",
  "Remplacer ce tableau de bord temporaire par les shells eleve / parent / tuteur.",
];

export default async function AppHomePage() {
  const { context, appUser } = await requireAppPageContext();

  return (
    <main className="px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-6">
        <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[1.15fr_0.85fr] md:p-8">
          <article className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm text-[color:var(--ink-soft)]">
              <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-1">
                Role: {appUser.role}
              </span>
              <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-1">
                Statut: {appUser.account_status}
              </span>
              <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-1">
                Interface: {appUser.preferred_ui_language}
              </span>
            </div>

            <div>
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                Auth connected
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl leading-tight">
                La session Supabase et le profil applicatif sont maintenant relies.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--ink-soft)]">
                Cette page est le point d&apos;entree protege temporaire pendant
                que les dashboards role-aware ne sont pas encore construits.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SignOutButton />
              <span className="text-sm text-[color:var(--ink-soft)]">
                Connecte en tant que {context.email ?? "email inconnu"}
              </span>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              Profil courant
            </p>
            <dl className="mt-4 grid gap-4 text-sm">
              <div>
                <dt className="text-[color:var(--ink-soft)]">Display name</dt>
                <dd className="mt-1 font-medium">{appUser.display_name}</dd>
              </div>
              <div>
                <dt className="text-[color:var(--ink-soft)]">AI help language</dt>
                <dd className="mt-1 font-medium">{appUser.ai_help_language}</dd>
              </div>
              <div>
                <dt className="text-[color:var(--ink-soft)]">Age band</dt>
                <dd className="mt-1 font-medium">{appUser.age_band ?? "non renseigne"}</dd>
              </div>
              <div>
                <dt className="text-[color:var(--ink-soft)]">Under 13</dt>
                <dd className="mt-1 font-medium">
                  {appUser.is_under_13 ? "oui" : "non"}
                </dd>
              </div>
            </dl>
          </article>
        </section>

        <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)]">
          <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
            Next slices
          </p>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[color:var(--foreground)]">
            {nextSlices.map((slice) => (
              <li className="flex gap-3" key={slice}>
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                <span>{slice}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.7fr_1.3fr]">
          <article className="space-y-3">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.22em] text-[color:var(--ink-soft)]">
              Account settings
            </p>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl leading-tight">
              Les champs editables passent maintenant par `PATCH /api/auth/profile`.
            </h2>
            <p className="text-sm leading-6 text-[color:var(--ink-soft)]">
              Cette surface reste simple, mais elle exerce deja la persistence
              du profil applicatif et la synchronisation de metadata cote auth.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <AccountSettingsForm appUser={appUser} />
          </article>
        </section>
      </div>
    </main>
  );
}
