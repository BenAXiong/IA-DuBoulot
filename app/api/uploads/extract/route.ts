import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import {
  parseConfirmUploadRequest,
  retryAttachmentExtraction,
} from "@/lib/server/uploads/service";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const payload = await parseConfirmUploadRequest(
    request,
    context.appUser?.preferred_ui_language ?? "fr",
  );
  const result = await retryAttachmentExtraction({
    context,
    requestId,
    route: "/api/uploads/extract",
    ...payload,
  });

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      attachment: result.attachment,
      subjectResource: result.subjectResource,
      extractedTextBlock: result.extractedTextBlock,
      warningMessage: result.warningMessage,
    },
  });
});
