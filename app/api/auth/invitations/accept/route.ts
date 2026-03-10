import { NextResponse } from "next/server";
import {
  acceptInvitation,
  parseInvitationTokenInput,
} from "@/lib/server/links/invitation-service";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

const ROUTE = "/api/auth/invitations/accept";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const { token } = await parseInvitationTokenInput(request);
  const result = await acceptInvitation({
    context,
    requestId,
    route: ROUTE,
    token,
    expectedKinds: ["tutor_link"],
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
