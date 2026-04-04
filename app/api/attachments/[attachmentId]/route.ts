import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import { deleteAttachment } from "@/lib/server/uploads/service";

type Params = Promise<{ attachmentId: string }>;

export const DELETE = withRouteErrorHandling<{ params: Params }>(
  async (_request, { params, requestId }) => {
    const context = await requireAuthenticatedUserContext();
    const resolvedParams = await params;
    const result = await deleteAttachment({
      context,
      requestId,
      route: "/api/attachments/[attachmentId]",
      attachmentId: resolvedParams.attachmentId,
    });

    return NextResponse.json({
      ok: true,
      data: {
        requestId,
        attachmentId: result.attachmentId,
        conversationId: result.conversationId,
      },
    });
  },
);
