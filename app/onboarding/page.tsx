import { OnboardingForm } from "@/components/auth/onboarding-form";
import { requireOnboardingPageContext } from "@/lib/server/auth/page-guards";

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;

function readFirstValue(value: SearchParamsValue) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function parseDefaultRole(value: string | null) {
  if (value === "parent" || value === "tutor") {
    return value;
  }

  return "student" as const;
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
}) {
  const context = await requireOnboardingPageContext();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const defaultRole = parseDefaultRole(
    readFirstValue(resolvedSearchParams.role),
  );

  return (
    <main className="px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col justify-center gap-6">
        <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] md:grid-cols-[0.8fr_1.2fr] md:p-8">
          <article className="space-y-4">
            <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
              Onboarding
            </p>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight">
              Finaliser le profil applicatif avant d&apos;entrer dans l&apos;espace protege.
            </h1>
            <p className="text-base leading-7 text-[color:var(--ink-soft)]">
              Cette etape cree ou repare la ligne `public.users` et branche le
              compte sur les contraintes de role deja definies dans le schema.
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
            <OnboardingForm
              defaultRole={defaultRole}
              email={context.email}
              inviteToken={readFirstValue(resolvedSearchParams.invite)}
            />
          </article>
        </section>
      </div>
    </main>
  );
}
