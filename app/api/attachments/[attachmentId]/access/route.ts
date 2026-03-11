import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import { createAttachmentAccessUrl } from "@/lib/server/uploads/service";

type Params = Promise<{ attachmentId: string }> | { attachmentId: string };

export const GET = withRouteErrorHandling<{ params: Params }>(
  async (_request, { params, requestId }) => {
    const context = await requireAuthenticatedUserContext();
    const resolvedParams = await params;
    const result = await createAttachmentAccessUrl({
      context,
      requestId,
      route: "/api/attachments/[attachmentId]/access",
      attachmentId: resolvedParams.attachmentId,
    });

    return NextResponse.redirect(result.signedUrl, {
      status: 307,
    });
  },
);
