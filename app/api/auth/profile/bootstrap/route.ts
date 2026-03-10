import { NextResponse } from "next/server";
import { bootstrapProfile, parseBootstrapProfileInput } from "@/lib/server/auth/account-service";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const input = await parseBootstrapProfileInput(request);
  const result = await bootstrapProfile(context, input, requestId);

  return NextResponse.json(
    {
      ok: true,
      data: {
        requestId,
        created: result.created,
        appUser: result.appUser,
      },
    },
    {
      status: result.created ? 201 : 200,
    },
  );
});
