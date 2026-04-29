import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import {
  parseSubjectResourceSelectionRequest,
  setSubjectResourceConversationSelection,
} from "@/lib/server/subject-resources/service";

export const PATCH = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const payload = await parseSubjectResourceSelectionRequest(
    request,
    context.appUser?.preferred_ui_language ?? "fr",
  );
  const result = await setSubjectResourceConversationSelection({
    context,
    requestId,
    route: "/api/subject-resources/selection",
    ...payload,
  });

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      resource: result.resource,
      link: result.link,
    },
  });
});
