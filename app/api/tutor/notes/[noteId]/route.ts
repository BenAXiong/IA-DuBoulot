import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import {
  deleteTutorNote,
  parseUpdateTutorNoteInput,
  updateTutorNote,
} from "@/lib/server/oversight/tutor-note-service";

type Params = Promise<{ noteId: string }> | { noteId: string };

const ROUTE = "/api/tutor/notes/[noteId]";

export const PATCH = withRouteErrorHandling<{ params: Params }>(
  async (request, { params, requestId }) => {
    const context = await requireAuthenticatedUserContext();
    const payload = await parseUpdateTutorNoteInput(request);
    const resolvedParams = await params;
    const note = await updateTutorNote({
      context,
      noteId: resolvedParams.noteId,
      payload,
      requestId,
      route: ROUTE,
    });

    return NextResponse.json({
      ok: true,
      data: {
        requestId,
        note,
      },
    });
  },
);

export const DELETE = withRouteErrorHandling<{ params: Params }>(
  async (_request, { params, requestId }) => {
    const context = await requireAuthenticatedUserContext();
    const resolvedParams = await params;
    await deleteTutorNote({
      context,
      noteId: resolvedParams.noteId,
      requestId,
      route: ROUTE,
    });

    return NextResponse.json({
      ok: true,
      data: {
        requestId,
      },
    });
  },
);
