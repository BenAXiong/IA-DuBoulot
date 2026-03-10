import { AuthPanel } from "@/components/auth/auth-panel";
import { PublicShell } from "@/components/layout/public-shell";
import { redirectAuthenticatedUserFromAuthPage } from "@/lib/server/auth/page-guards";

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;
type AuthMode = "sign_in" | "sign_up";
type SignupRole = "student" | "parent" | "tutor";

function readFirstValue(value: SearchParamsValue) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function parseMode(value: string | null): AuthMode {
  return value === "sign_up" ? "sign_up" : "sign_in";
}

function parseRole(value: string | null): SignupRole {
  if (value === "parent" || value === "tutor") {
    return value;
  }

  return "student";
}

function buildIntentLabel(role: SignupRole, intent: string | null) {
  if (intent === "parent_link") {
    return role === "parent"
      ? "Flux parent preselectionne pour creer puis lier un compte supervise."
      : "Flux parent-link detecte. Le role parent est recommande pour continuer.";
  }

  if (intent === "tutor_link") {
    return role === "tutor"
      ? "Flux tuteur preselectionne pour une future liaison eleve-tuteur."
      : "Flux tuteur-link detecte. Le role tuteur est recommande pour continuer.";
  }

  return null;
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
}) {
  await redirectAuthenticatedUserFromAuthPage();

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialError = readFirstValue(resolvedSearchParams.error);
  const initialMessage = readFirstValue(resolvedSearchParams.message);
  const initialMode = parseMode(readFirstValue(resolvedSearchParams.mode));
  const initialRole = parseRole(readFirstValue(resolvedSearchParams.role));
  const inviteToken = readFirstValue(resolvedSearchParams.invite);
  const intentLabel = buildIntentLabel(
    initialRole,
    readFirstValue(resolvedSearchParams.intent),
  );

  return (
    <PublicShell>
      <main className="px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center">
          <AuthPanel
            initialError={initialError}
            initialMessage={initialMessage}
            initialMode={initialMode}
            initialRole={initialRole}
            inviteToken={inviteToken}
            intentLabel={intentLabel}
          />
        </div>
      </main>
    </PublicShell>
  );
}
