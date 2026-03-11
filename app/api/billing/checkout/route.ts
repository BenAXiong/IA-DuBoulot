import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { createBillingCheckout } from "@/lib/server/billing/service";
import { AppError } from "@/lib/server/errors/app-error";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";

async function readCheckoutRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    let body: { planKey?: unknown };

    try {
      body = (await request.json()) as { planKey?: unknown };
    } catch (error) {
      throw new AppError({
        code: "bad_request",
        message: "Invalid JSON body.",
        status: 400,
        cause: error,
      });
    }

    return {
      planKey: typeof body.planKey === "string" ? body.planKey : undefined,
      respondWithJson: true,
    };
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    const planKey = formData.get("planKey");

    return {
      planKey: typeof planKey === "string" ? planKey : undefined,
      respondWithJson: false,
    };
  }

  return {
    planKey: undefined,
    respondWithJson: request.headers.get("accept")?.includes("application/json") ?? false,
  };
}

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const parsed = await readCheckoutRequest(request);
  const result = await createBillingCheckout({
    context,
    planKey: parsed.planKey,
    requestId,
    route: "/api/billing/checkout",
  });

  if (parsed.respondWithJson) {
    return NextResponse.json({
      ok: true,
      data: {
        requestId,
        url: result.url,
        mode: result.mode,
        provider: result.provider,
        planKey: result.planKey,
      },
    });
  }

  return NextResponse.redirect(result.url, {
    status: 303,
  });
});
