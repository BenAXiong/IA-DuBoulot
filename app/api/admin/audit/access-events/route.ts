import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import { loadAdminAccessAuditSnapshot } from "@/lib/server/oversight/admin-service";

const ROUTE = "/api/admin/audit/access-events";

export const GET = withRouteErrorHandling(async (_request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();

  if (!context.appUser) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "not_found",
          message: "App profile not found.",
          requestId,
        },
      },
      {
        status: 404,
      },
    );
  }

  const snapshot = await loadAdminAccessAuditSnapshot(context.appUser);

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      route: ROUTE,
      snapshot,
    },
  });
});
