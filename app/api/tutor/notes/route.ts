import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import {
  createTutorNote,
  parseCreateTutorNoteInput,
} from "@/lib/server/oversight/tutor-note-service";

const ROUTE = "/api/tutor/notes";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const payload = await parseCreateTutorNoteInput(
    request,
    context.appUser?.preferred_ui_language ?? "fr",
  );
  const note = await createTutorNote({
    context,
    payload,
    requestId,
    route: ROUTE,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        requestId,
        note,
      },
    },
    {
      status: 201,
    },
  );
});
