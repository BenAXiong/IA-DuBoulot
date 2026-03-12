import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import {
  appendConversationTurn,
  parseAppendConversationMessageInput,
} from "@/lib/server/conversations/conversation-service";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

type Params = Promise<{ conversationId: string }> | { conversationId: string };

export const POST = withRouteErrorHandling<{ params: Params }>(
  async (request, { params, requestId }) => {
    const context = await requireAuthenticatedUserContext();
    const payload = await parseAppendConversationMessageInput(
      request,
      context.appUser?.preferred_ui_language ?? "fr",
    );
    const resolvedParams = await params;
    const result = await appendConversationTurn({
      context,
      conversationId: resolvedParams.conversationId,
      payload,
      requestId,
      route: "/api/conversations/[conversationId]/messages",
    });

    return NextResponse.json(
      {
        ok: true,
        data: {
          requestId,
          studentMessage: result.studentMessage,
          assistantMessage: result.assistantMessage,
        },
      },
      {
        status: 201,
      },
    );
  },
);
