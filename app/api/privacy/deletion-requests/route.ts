import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import { requestPrivacyDeletion } from "@/lib/server/privacy/service";

const ROUTE = "/api/privacy/deletion-requests";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  let body: { targetUserId?: unknown } = {};

  try {
    body = (await request.json()) as { targetUserId?: unknown };
  } catch {
    body = {};
  }

  const result = await requestPrivacyDeletion({
    context,
    targetUserId:
      typeof body.targetUserId === "string" && body.targetUserId.trim().length > 0
        ? body.targetUserId.trim()
        : undefined,
    requestId,
    route: ROUTE,
  });

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      ...result,
    },
  });
});
