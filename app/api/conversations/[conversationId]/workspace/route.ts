import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import {
  parseUpdateWorkspaceInput,
  updateWorkspaceState,
} from "@/lib/server/conversations/conversation-service";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

type Params = Promise<{ conversationId: string }> | { conversationId: string };

export const PATCH = withRouteErrorHandling<{ params: Params }>(
  async (request, { params, requestId }) => {
    const context = await requireAuthenticatedUserContext();
    const payload = await parseUpdateWorkspaceInput(
      request,
      context.appUser?.preferred_ui_language ?? "fr",
    );
    const resolvedParams = await params;
    const workspace = await updateWorkspaceState({
      context,
      conversationId: resolvedParams.conversationId,
      payload,
      requestId,
      route: "/api/conversations/[conversationId]/workspace",
    });

    return NextResponse.json({
      ok: true,
      data: {
        requestId,
        workspace,
      },
    });
  },
);
