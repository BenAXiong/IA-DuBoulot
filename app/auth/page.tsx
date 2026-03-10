import { AuthPanel } from "@/components/auth/auth-panel";
import { redirectAuthenticatedUserFromAuthPage } from "@/lib/server/auth/page-guards";

type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;

function readFirstValue(value: SearchParamsValue) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
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

  return (
    <main className="px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center">
        <AuthPanel
          initialError={initialError}
          initialMessage={initialMessage}
        />
      </div>
    </main>
  );
}
