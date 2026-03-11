import "server-only";

import { logRuntimeInfo } from "@/lib/server/audit/runtime-logger";
import { AppError } from "@/lib/server/errors/app-error";
import { isAnalyticsEnabled, isPostHogConfigured } from "@/lib/feature-flags";
import { isAnalyticsEventName, type AnalyticsEventInput } from "@/lib/analytics/types";
import type { AuthenticatedUserContext } from "@/lib/server/auth/types";

function requireBodyObject(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new AppError({
      code: "bad_request",
      message: "Telemetry event payload must be an object.",
      status: 400,
    });
  }

  return body as Record<string, unknown>;
}

function sanitizeProperties(
  value: unknown,
): AnalyticsEventInput["properties"] | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value).slice(0, 8);
  const sanitizedEntries = entries
    .map(([key, entryValue]) => {
      if (
        typeof entryValue === "string" ||
        typeof entryValue === "number" ||
        typeof entryValue === "boolean" ||
        entryValue === null
      ) {
        return [
          key.slice(0, 40),
          typeof entryValue === "string" ? entryValue.slice(0, 120) : entryValue,
        ] as const;
      }

      return null;
    })
    .filter((entry): entry is readonly [string, string | number | boolean | null] =>
      Boolean(entry),
    );

  return sanitizedEntries.length > 0
    ? Object.fromEntries(sanitizedEntries)
    : undefined;
}

export async function parseAnalyticsEventInput(
  request: Request,
): Promise<AnalyticsEventInput> {
  const body = requireBodyObject(await request.json().catch(() => null));
  const name = typeof body.name === "string" ? body.name : "";
  const route = typeof body.route === "string" ? body.route : "";

  if (!isAnalyticsEventName(name)) {
    throw new AppError({
      code: "validation_error",
      message: "Analytics event name is invalid.",
      status: 400,
      fieldErrors: {
        name: "Use one of the documented analytics event names.",
      },
    });
  }

  if (!route.startsWith("/")) {
    throw new AppError({
      code: "validation_error",
      message: "Analytics event route is invalid.",
      status: 400,
      fieldErrors: {
        route: "Route must be an app-relative path.",
      },
    });
  }

  return {
    name,
    route: route.slice(0, 160),
    properties: sanitizeProperties(body.properties),
  };
}

export async function recordAnalyticsEvent(input: {
  event: AnalyticsEventInput;
  requestId: string;
  context: AuthenticatedUserContext | null;
}) {
  if (!isAnalyticsEnabled()) {
    return {
      recorded: false,
      provider: null,
      reason: "disabled" as const,
    };
  }

  logRuntimeInfo({
    message: "Captured analytics event",
    requestId: input.requestId,
    route: "/api/telemetry/events",
    method: "POST",
    actorUserId: input.context?.appUser?.id ?? null,
    actorRole: input.context?.appUser?.role ?? null,
    details: {
      event_name: input.event.name,
      event_route: input.event.route,
      event_properties: input.event.properties ?? null,
      provider: isPostHogConfigured() ? "posthog_pending_adapter" : "runtime_only",
    },
  });

  return {
    recorded: true,
    provider: isPostHogConfigured() ? "posthog_pending_adapter" : "runtime_only",
    reason: null,
  };
}
