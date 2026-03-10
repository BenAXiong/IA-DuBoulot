import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { completeConversation } from "@/lib/server/conversations/conversation-service";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

type Params = Promise<{ conversationId: string }>;

export const POST = withRouteErrorHandling<{ params: Params }>(
  async (_request, { params, requestId }) => {
    const context = await requireAuthenticatedUserContext();
    const resolvedParams = await params;
    const result = await completeConversation({
      context,
      conversationId: resolvedParams.conversationId,
      requestId,
      route: "/api/conversations/[conversationId]/complete",
    });

    return NextResponse.json({
      ok: true,
      data: {
        requestId,
        conversation: result.conversation,
        summaries: result.summaries,
      },
    });
  },
);
