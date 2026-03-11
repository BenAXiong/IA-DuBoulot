import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { createBillingPortalSession } from "@/lib/server/billing/service";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const result = await createBillingPortalSession({
    context,
    requestId,
    route: "/api/billing/portal",
  });
  const respondWithJson =
    request.headers.get("accept")?.includes("application/json") ?? false;

  if (respondWithJson) {
    return NextResponse.json({
      ok: true,
      data: {
        requestId,
        url: result.url,
        provider: result.provider,
        planKey: result.planKey,
        status: result.status,
      },
    });
  }

  return NextResponse.redirect(result.url, {
    status: 303,
  });
});
