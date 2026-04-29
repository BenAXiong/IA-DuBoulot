import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import {
  createSubjectResourceUploadTarget,
  deleteSubjectResource,
  listSubjectResourceLibrary,
  parseCreateSubjectResourceTargetRequest,
  parseSubjectResourceDeleteRequest,
} from "@/lib/server/subject-resources/service";

export const GET = withRouteErrorHandling(async (request) => {
  const context = await requireAuthenticatedUserContext();
  const url = new URL(request.url);
  const subjectTag = url.searchParams.get("subjectTag") ?? "";
  const conversationId = url.searchParams.get("conversationId");
  const resources = await listSubjectResourceLibrary({
    context,
    subjectTag,
    conversationId,
  });

  return NextResponse.json({
    ok: true,
    data: {
      resources,
    },
  });
});

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const payload = await parseCreateSubjectResourceTargetRequest(
    request,
    context.appUser?.preferred_ui_language ?? "fr",
  );
  const result = await createSubjectResourceUploadTarget({
    context,
    requestId,
    route: "/api/subject-resources",
    ...payload,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        requestId,
        resource: result.resource,
        uploadTarget: result.uploadTarget,
      },
    },
    {
      status: 201,
    },
  );
});

export const DELETE = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const payload = await parseSubjectResourceDeleteRequest(
    request,
    context.appUser?.preferred_ui_language ?? "fr",
  );
  const result = await deleteSubjectResource({
    context,
    requestId,
    route: "/api/subject-resources",
    ...payload,
  });

  return NextResponse.json({
    ok: true,
    data: {
      requestId,
      ...result,
    },
  });
});
