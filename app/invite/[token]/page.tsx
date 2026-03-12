import { InvitationAcceptPanel } from "@/components/links/invitation-accept-panel";
import { PublicShell } from "@/components/layout/public-shell";
import {
  readFirstSearchParam,
  resolveUiLanguageFromSearchParam,
  withUiLanguage,
} from "@/lib/i18n/ui-language";
import {
  buildAuthHrefFromInvitation,
  buildOnboardingHrefFromInvitation,
  getInvitationPageState,
} from "@/lib/server/links/invitation-service";

type Params = Promise<{ token: string }> | { token: string };
type SearchParamsValue = string | string[] | undefined;
type SearchParamsRecord = Record<string, SearchParamsValue>;

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams?: Promise<SearchParamsRecord> | SearchParamsRecord;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const token = resolvedParams.token;
  const languageCode = resolveUiLanguageFromSearchParam(
    readFirstSearchParam(resolvedSearchParams.lang),
  );
  const pageState = await getInvitationPageState(token, languageCode);
  const landing = pageState.landing;

  const authSignInHref = landing
    ? buildAuthHrefFromInvitation({
        token,
        targetRole: landing.invitation.target_role,
        mode: "sign_in",
        kind: landing.invitation.invitation_kind,
      })
    : "/auth";
  const localizedSignInHref = withUiLanguage(authSignInHref, languageCode);
  const authSignUpHref = landing
    ? buildAuthHrefFromInvitation({
        token,
        targetRole: landing.invitation.target_role,
        mode: "sign_up",
        kind: landing.invitation.invitation_kind,
      })
    : "/auth?mode=sign_up";
  const localizedSignUpHref = withUiLanguage(authSignUpHref, languageCode);
  const onboardingHref = landing
    ? buildOnboardingHrefFromInvitation({
        token,
        targetRole: landing.invitation.target_role,
      })
    : "/onboarding";
  const localizedOnboardingHref = withUiLanguage(onboardingHref, languageCode);

  return (
    <PublicShell
      currentHref={withUiLanguage(`/invite/${token}`, languageCode)}
      languageCode={languageCode}
    >
      <main className="px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center">
          <InvitationAcceptPanel
            appUserRole={pageState.appUser?.role ?? null}
            authSignInHref={localizedSignInHref}
            authSignUpHref={localizedSignUpHref}
            email={pageState.context?.email ?? null}
            landing={landing}
            languageCode={languageCode}
            onboardingHref={localizedOnboardingHref}
            token={token}
            viewerState={pageState.viewerState}
          />
        </div>
      </main>
    </PublicShell>
  );
}
