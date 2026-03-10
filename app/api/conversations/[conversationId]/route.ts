import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { loadConversationDetail } from "@/lib/server/conversations/conversation-service";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

type Params = Promise<{ conversationId: string }> | { conversationId: string };

export const GET = withRouteErrorHandling<{ params: Params }>(
  async (_request, { params, requestId }) => {
    const context = await requireAuthenticatedUserContext();
    const appUser = context.appUser;

    if (!appUser) {
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

    const resolvedParams = await params;
    const detail = await loadConversationDetail({
      viewer: appUser,
      conversationId: resolvedParams.conversationId,
    });

    return NextResponse.json({
      ok: true,
      data: {
        requestId,
        detail,
      },
    });
  },
);
