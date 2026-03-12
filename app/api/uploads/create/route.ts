import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import {
  createUploadTarget,
  parseCreateUploadTargetRequest,
} from "@/lib/server/uploads/service";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const payload = await parseCreateUploadTargetRequest(
    request,
    context.appUser?.preferred_ui_language ?? "fr",
  );
  const result = await createUploadTarget({
    context,
    requestId,
    route: "/api/uploads/create",
    ...payload,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        requestId,
        attachment: result.attachment,
        uploadTarget: result.uploadTarget,
      },
    },
    {
      status: 201,
    },
  );
});
