import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

export const GET = withRouteErrorHandling(async (_request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      authUser: {
        id: context.authUserId,
        email: context.email,
      },
      appUser: context.appUser,
    },
  });
});
