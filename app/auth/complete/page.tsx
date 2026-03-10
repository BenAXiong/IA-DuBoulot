import { PostConfirmRedirect } from "@/components/auth/post-confirm-redirect";
import { PublicShell } from "@/components/layout/public-shell";
import { sanitizeRelativeRedirectPath } from "@/lib/auth/redirect-path";

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;

function readFirstValue(value: SearchParamsValue) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function AuthCompletePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const nextPath = sanitizeRelativeRedirectPath(
    readFirstValue(resolvedSearchParams.next),
  );

  return (
    <PublicShell>
      <main className="px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl flex-col justify-center">
          <section className="grid gap-6 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
            <div className="space-y-3">
              <p className="font-[family-name:var(--font-heading)] text-sm uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
                Confirmation
              </p>
              <h1 className="font-[family-name:var(--font-heading)] text-4xl leading-tight">
                La session est validee.
              </h1>
              <p className="text-base leading-7 text-[color:var(--ink-soft)]">
                Le navigateur finalise la reprise du flux avant de revenir sur
                la page utile.
              </p>
            </div>

            <PostConfirmRedirect nextPath={nextPath} />
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
