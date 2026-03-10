import "server-only";

import { toErrorResponse } from "@/lib/server/errors/to-error-response";

type RouteHandlerContext = {
  requestId: string;
};

type RouteHandler<TContext> = (
  request: Request,
  context: TContext & RouteHandlerContext,
) => Promise<Response>;

export function withRouteErrorHandling<TContext extends object = object>(
  handler: RouteHandler<TContext>,
) {
  return async (request: Request, context: TContext) => {
    const requestId =
      request.headers.get("x-request-id") ?? `req_${crypto.randomUUID()}`;

    try {
      return await handler(request, {
        ...context,
        requestId,
      });
    } catch (error) {
      return toErrorResponse(error, requestId);
    }
  };
}
