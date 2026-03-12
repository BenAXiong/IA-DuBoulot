import { NextResponse } from "next/server";
import {
  acceptInvitation,
  parseInvitationTokenInput,
} from "@/lib/server/links/invitation-service";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

const ROUTE = "/api/auth/parent-approval/confirm";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const { token } = await parseInvitationTokenInput(
    request,
    context.appUser?.preferred_ui_language ?? "fr",
  );
  const result = await acceptInvitation({
    context,
    requestId,
    route: ROUTE,
    token,
    expectedKinds: ["parent_approval", "parent_link"],
  });

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      invitation: result.invitation,
      student: result.student,
      linkStatus: result.linkStatus,
    },
  });
});
