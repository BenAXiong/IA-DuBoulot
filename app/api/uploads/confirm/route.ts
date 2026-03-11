import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import { confirmUpload, parseConfirmUploadRequest } from "@/lib/server/uploads/service";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const payload = await parseConfirmUploadRequest(request);
  const result = await confirmUpload({
    context,
    requestId,
    route: "/api/uploads/confirm",
    ...payload,
  });

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      attachment: result.attachment,
      extractedTextBlock: result.extractedTextBlock,
      warningMessage: result.warningMessage,
    },
  });
});
