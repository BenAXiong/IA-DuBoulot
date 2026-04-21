import { NextResponse } from "next/server";
import { getStudentConversationServerCopy } from "@/lib/i18n/student-flow-copy";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { completeConversation } from "@/lib/server/conversations/conversation-service";
import { AppError } from "@/lib/server/errors/app-error";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

type Params = Promise<{ conversationId: string }>;

export const POST = withRouteErrorHandling<{ params: Params }>(
  async (request, { params, requestId }) => {
    const context = await requireAuthenticatedUserContext();
    const copy = getStudentConversationServerCopy(
      context.appUser?.preferred_ui_language ?? "fr",
    );
    const rawBody = await request.text();
    let forceRegenerateSummary = false;

    if (rawBody.trim().length > 0) {
      let parsedBody: unknown;

      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        throw new AppError({
          code: "bad_request",
          message: copy.requestErrors.invalidJson,
          status: 400,
        });
      }

      if (
        !parsedBody ||
        typeof parsedBody !== "object" ||
        Array.isArray(parsedBody)
      ) {
        throw new AppError({
          code: "bad_request",
          message: copy.requestErrors.expectedObject,
          status: 400,
        });
      }

      const candidateForceRegenerate = (parsedBody as Record<string, unknown>)
        .forceRegenerateSummary;

      if (
        candidateForceRegenerate !== undefined &&
        typeof candidateForceRegenerate !== "boolean"
      ) {
        throw new AppError({
          code: "bad_request",
          message: copy.requestErrors.invalidFields,
          status: 400,
        });
      }

      forceRegenerateSummary = candidateForceRegenerate ?? false;
    }

    const resolvedParams = await params;
    const result = await completeConversation({
      context,
      conversationId: resolvedParams.conversationId,
      requestId,
      route: "/api/conversations/[conversationId]/complete",
      forceRegenerateSummary,
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
