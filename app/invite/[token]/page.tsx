import { InvitationAcceptPanel } from "@/components/links/invitation-accept-panel";
import {
  buildAuthHrefFromInvitation,
  buildOnboardingHrefFromInvitation,
  getInvitationPageState,
} from "@/lib/server/links/invitation-service";

type Params = Promise<{ token: string }> | { token: string };

export default async function InvitePage({
  params,
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const token = resolvedParams.token;
  const pageState = await getInvitationPageState(token);
  const landing = pageState.landing;

  const authSignInHref = landing
    ? buildAuthHrefFromInvitation({
        token,
        targetRole: landing.invitation.target_role,
        mode: "sign_in",
        kind: landing.invitation.invitation_kind,
      })
    : "/auth";
  const authSignUpHref = landing
    ? buildAuthHrefFromInvitation({
        token,
        targetRole: landing.invitation.target_role,
        mode: "sign_up",
        kind: landing.invitation.invitation_kind,
      })
    : "/auth?mode=sign_up";
  const onboardingHref = landing
    ? buildOnboardingHrefFromInvitation({
        token,
        targetRole: landing.invitation.target_role,
      })
    : "/onboarding";

  return (
    <main className="px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-center">
        <InvitationAcceptPanel
          appUserRole={pageState.appUser?.role ?? null}
          authSignInHref={authSignInHref}
          authSignUpHref={authSignUpHref}
          email={pageState.context?.email ?? null}
          landing={landing}
          onboardingHref={onboardingHref}
          token={token}
          viewerState={pageState.viewerState}
        />
      </div>
    </main>
  );
}
