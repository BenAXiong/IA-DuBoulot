import { NextResponse } from "next/server";
import { getAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import {
  parseAnalyticsEventInput,
  recordAnalyticsEvent,
} from "@/lib/server/telemetry/service";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const [context, event] = await Promise.all([
    getAuthenticatedUserContext(),
    parseAnalyticsEventInput(request),
  ]);

  const result = await recordAnalyticsEvent({
    event,
    requestId,
    context,
  });

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      recorded: result.recorded,
      provider: result.provider,
      reason: result.reason,
    },
  });
});
