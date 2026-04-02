import { NextResponse } from "next/server";
import {
  requireAppUserContext,
  requireAuthenticatedUserContext,
  requireAppUserRole,
} from "@/lib/server/auth/authorization";
import { withRouteErrorHandling } from "@/lib/server/errors/with-route-error-handling";
import {
  createParentManagedLearner,
  parseCreateParentManagedLearnerInput,
} from "@/lib/server/oversight/parent-learner-service";

const ROUTE = "/api/parent/students";

export const POST = withRouteErrorHandling(async (request, { requestId }) => {
  const context = await requireAuthenticatedUserContext();
  const appUser = requireAppUserContext(context);
  requireAppUserRole(appUser, ["parent"]);

  const payload = await parseCreateParentManagedLearnerInput(request, {
    languageCode: appUser.preferred_ui_language,
    parentEmail: context.email,
  });
  const result = await createParentManagedLearner({
    parentUser: appUser,
    payload,
    requestId,
    route: ROUTE,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        requestId,
        learner: result.learner,
        relationshipLabel: result.relationshipLabel,
      },
    },
    {
      status: 201,
    },
  );
});
