import { NextResponse } from "next/server";
import { handleBillingWebhook } from "@/lib/server/billing/service";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const rawBody = await request.text();
  const result = await handleBillingWebhook({
    headers: request.headers,
    rawBody,
    requestId,
    route: "/api/billing/webhooks/lemonsqueezy",
  });

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      ...result,
    },
  });
});
