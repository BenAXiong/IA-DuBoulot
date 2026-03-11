import { NextResponse } from "next/server";
import { requireAuthenticatedUserContext } from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import {
  loadVisibleStudentMemory,
  mutateStudentMemory,
  parseStudentMemoryMutation,
} from "@/lib/server/memory/service";

type Params = Promise<{ studentId: string }> | { studentId: string };

export const GET = withRouteErrorHandling<{ params: Params }>(
  async (_request, { params, requestId }) => {
    const context = await requireAuthenticatedUserContext();
    const appUser = context.appUser;

    if (!appUser) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "not_found",
            message: "App profile not found.",
            requestId,
          },
        },
        {
          status: 404,
        },
      );
    }

    const resolvedParams = await params;
    const snapshot = await loadVisibleStudentMemory({
      viewer: appUser,
      studentUserId: resolvedParams.studentId,
      auditContext:
        appUser.role === "parent"
          ? {
              action: "parent_student_memory_view",
              route: "/api/students/[studentId]/memory",
              requestId,
            }
          : appUser.role === "admin"
            ? {
                action: "admin_student_memory_view",
                route: "/api/students/[studentId]/memory",
                requestId,
              }
            : undefined,
    });

    return NextResponse.json({
      ok: true,
      data: {
        requestId,
        snapshot,
      },
    });
  },
);

export const PATCH = withRouteErrorHandling<{ params: Params }>(
  async (request, { params, requestId }) => {
    const context = await requireAuthenticatedUserContext();
    const payload = await parseStudentMemoryMutation(request);
    const resolvedParams = await params;
    const result = await mutateStudentMemory({
      context,
      studentUserId: resolvedParams.studentId,
      payload,
      requestId,
      route: "/api/students/[studentId]/memory",
    });

    return NextResponse.json({
      ok: true,
      data: {
        requestId,
        result,
      },
    });
  },
);
