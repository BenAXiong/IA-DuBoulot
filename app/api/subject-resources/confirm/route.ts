import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import {
  confirmSubjectResourceUpload,
  parseConfirmSubjectResourceRequest,
} from "@/lib/server/subject-resources/service";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const payload = await parseConfirmSubjectResourceRequest(
    request,
    context.appUser?.preferred_ui_language ?? "fr",
  );
  const result = await confirmSubjectResourceUpload({
    context,
    requestId,
    route: "/api/subject-resources/confirm",
    ...payload,
  });

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      resource: result.resource,
      link: result.link,
      chunkCount: result.chunkCount,
      warningMessage: result.warningMessage,
    },
  });
});
