# Telemetry And Feature Controls V1

Related: [README](../README.md) | [Environment matrix](environment_matrix.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md) | [Error and audit conventions](error_audit_conventions.md) | [Minors privacy baseline](minors_privacy_baseline.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document defines the MVP telemetry and risky-integration control layer.

It closes the repository-owned part of:

- `A2.4.1` basic analytics hooks
- `A2.4.2` server/runtime logging conventions
- `A2.4.3` feature flags and integration toggles

## Telemetry Contract

Current event route:

- `POST /api/telemetry/events`

Current event hook:

- `components/telemetry/route-view-tracker.tsx`

Current client helper:

- `lib/analytics/client.ts`

Current server sink:

- `lib/server/telemetry/service.ts`

Current MVP behavior:

- page views are the first wired event
- events are whitelisted and validated server-side
- properties stay small and metadata-only
- raw child content, raw prompts, attachment text, and summaries stay out of analytics payloads
- until a real PostHog project exists, events land in structured runtime logs rather than a third-party analytics warehouse

## Allowed Event Names

- `page_view`
- `cta_click`
- `student_new_homework_start`
- `student_session_complete`
- `billing_checkout_start`

Rules:

- add new event names in `lib/analytics/types.ts` before using them
- keep event properties flat and compact
- keep route-relative paths in the `route` field
- prefer product-usage metadata over content metadata

## Runtime Logging Boundary

Runtime logging remains canonical in:

- `lib/server/audit/runtime-logger.ts`
- `lib/server/errors/with-route-error-handling.ts`
- `lib/server/errors/to-error-response.ts`

Telemetry does not replace runtime logs.

Runtime logs remain responsible for:

- request IDs
- stable error codes
- provider failures
- actor and route context

Telemetry remains responsible for:

- coarse product-usage metadata
- page-view and future CTA/event tracking

## Feature Flags

Current env-driven flags:

- `NEXT_PUBLIC_ENABLE_ANALYTICS`
- `ENABLE_OPENAI_FALLBACK`
- `ENABLE_RESEND_EMAILS`
- `ENABLE_PARENT_AI_ACTIONS`

Current helper:

- `lib/feature-flags.ts`

Rules:

- do not read risky integration toggles ad hoc throughout the app
- add a variable to [environment_matrix.md](environment_matrix.md) before using it in code
- keep disabled-by-default behavior for unfinished or externally blocked integrations

Current MVP interpretation:

- analytics can be enabled without immediately wiring a third-party sink
- OpenAI is selected as the fallback AI provider, but the adapter stays disabled until implemented and provisioned
- Resend remains disabled until the account and sender setup exist
- parent-initiated AI remains disabled until that paid surface is intentionally built
