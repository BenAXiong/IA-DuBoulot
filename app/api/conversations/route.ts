import { NextResponse } from "next/server";
import {
  createConversationDraft,
  createConversationShell,
  listVisibleConversations,
  parseCreateConversationDraftInput,
  parseCreateConversationShellInput,
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
  const languageCode = context.appUser?.preferred_ui_language ?? "fr";
  const mode = new URL(request.url).searchParams.get("mode");
  const result =
    mode === "shell"
      ? await createConversationShell({
          context,
          payload: await parseCreateConversationShellInput(request, languageCode),
          requestId,
          route: "/api/conversations?mode=shell",
        })
      : await createConversationDraft({
          context,
          payload: await parseCreateConversationDraftInput(request, languageCode),
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
