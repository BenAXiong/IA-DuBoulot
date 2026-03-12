import { NextResponse } from "next/server";
import {
  createConversationDraft,
  listVisibleConversations,
  parseCreateConversationDraftInput,
} from "@/lib/server/conversations/conversation-service";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

export const GET = withRouteErrorHandling(async (_request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const conversations = await listVisibleConversations({
    context,
  });

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      conversations,
    },
  });
});

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const payload = await parseCreateConversationDraftInput(
    request,
    context.appUser?.preferred_ui_language ?? "fr",
  );
  const result = await createConversationDraft({
    context,
    payload,
    requestId,
    route: "/api/conversations",
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        requestId,
        conversationId: result.conversation.id,
        conversation: result.conversation,
      },
    },
    {
      status: 201,
    },
  );
});
