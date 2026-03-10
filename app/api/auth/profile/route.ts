import { NextResponse } from "next/server";
import {
  parseUpdateProfileInput,
  updateProfile,
} from "@/lib/server/auth/account-service";
import {
  requireAppUserContext,
  requireAuthenticatedUserContext,
} from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

export const PATCH = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const appUser = requireAppUserContext(context);
  const input = await parseUpdateProfileInput(request, appUser);
  const updatedUser = await updateProfile(context, appUser, input, requestId);

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      appUser: updatedUser,
    },
  });
});
