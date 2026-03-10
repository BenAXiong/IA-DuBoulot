import { NextResponse } from "next/server";
import {
  createTutorInvitation,
  parseCreateTutorInviteInput,
} from "@/lib/server/links/invitation-service";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

const ROUTE = "/api/tutor/links";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const invitation = await parseCreateTutorInviteInput(request);
  const result = await createTutorInvitation({
    context,
    requestId,
    route: ROUTE,
    invitation,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        requestId,
        invitation: result.invitation,
        inviteUrl: result.inviteUrl,
      },
    },
    {
      status: 201,
    },
  );
});
