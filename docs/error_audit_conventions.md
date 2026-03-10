# Error And Audit Conventions

Related: [README](../README.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md) | [Access rules V1](access_rules_v1.md) | [Supabase schema V1](supabase_schema_v1.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document defines how server routes and services should handle:

- public API errors
- internal runtime errors
- sensitive audit events
- moderation and operational logging boundaries

The goal is to keep behavior predictable and avoid hidden ad hoc logging logic across the codebase.

## Core Rules

- Every route should return one consistent JSON shape for errors.
- Do not leak provider SDK errors, SQL text, stack traces, secrets, or raw Supabase failures to the client.
- Sensitive product actions should create `audit_logs` rows.
- `audit_logs` are not a generic debug sink.
- Content safety outcomes belong in `moderation_events`, not `audit_logs`.
- Large payloads, raw attachment text, and full chat bodies should stay out of logs unless there is a tightly scoped operational reason.

## Response Envelope

Successful route responses should use:

```json
{
  "ok": true,
  "data": {}
}
```

Error responses should use:

```json
{
  "ok": false,
  "error": {
    "code": "forbidden",
    "message": "You do not have access to this resource.",
    "requestId": "req_...",
    "retryable": false
  }
}
```

Optional validation detail:

```json
{
  "ok": false,
  "error": {
    "code": "validation_error",
    "message": "One or more fields are invalid.",
    "requestId": "req_...",
    "retryable": false,
    "fieldErrors": {
      "subjectTag": "Required"
    }
  }
}
```

## Canonical Error Codes

| Code | HTTP status | Use when | Retryable |
| --- | --- | --- | --- |
| `bad_request` | `400` | malformed input, unsupported method, bad payload shape | no |
| `validation_error` | `400` | fields fail business validation | no |
| `unauthenticated` | `401` | no valid session | no |
| `forbidden` | `403` | caller is authenticated but lacks access and resource existence is already safe to reveal | no |
| `not_found` | `404` | resource does not exist, or existence should not be disclosed to this caller | no |
| `conflict` | `409` | duplicate link, invalid state transition, already completed action | no |
| `rate_limited` | `429` | app or provider rate limit hit | yes |
| `provider_error` | `502` | upstream AI, email, billing, or storage provider failed unexpectedly | yes |
| `service_unavailable` | `503` | app dependency or background capability unavailable | yes |
| `internal_error` | `500` | unexpected server failure | maybe |

## Error Mapping Rules

- Prefer `401` when there is no valid session.
- Prefer `404` instead of `403` for private resource IDs where revealing existence is unnecessary.
- Use `403` when the caller is already expected to know the resource exists but cannot perform the requested action.
- Use `409` for state conflicts, not validation failures.
- Wrap upstream provider failures into `provider_error` or `service_unavailable`, never raw provider messages.

## Request IDs And Runtime Logs

- Every route should generate or propagate a `requestId`.
- Include `requestId` in error responses, server logs, and audit metadata when the request caused an auditable action.
- Runtime logs should be structured enough to correlate route, actor user id if known, request id, provider name if relevant, and stable error code.

Minimum runtime log fields:

- `requestId`
- `route`
- `method`
- `actorUserId`
- `actorRole`
- `errorCode`
- `provider`
- `targetStudentUserId`

## Audit Log Boundaries

Use `public.audit_logs` for sensitive product and access events that matter later for trust, support, or compliance review.

Audit-worthy actions in MVP:

- parent approval requested, granted, revoked
- parent-student link created, updated, revoked
- tutor link requested, approved, revoked
- parent or tutor opens a student conversation detail view
- parent or tutor opens student memory or summary views
- tutor private note create, update, delete
- account deletion requested or fulfilled
- billing status changes from webhook processing
- admin inspection of sensitive student data
- admin resolution of moderation events
- profile bootstrap or role repair performed by privileged server logic

Do not audit by default:

- student self-reads of their own content
- routine workspace autosaves
- every chat message insert
- every successful anonymous/public page request
- low-level retries and background polling noise

## Audit Metadata Rules

Allowed metadata should stay compact and machine-readable.

Recommended keys:

- `request_id`
- `route`
- `reason`
- `conversation_id`
- `attachment_id`
- `summary_audience`
- `link_id`
- `status_before`
- `status_after`
- `provider`
- `provider_event_id`

Avoid in metadata:

- raw prompt text
- raw extracted homework text
- full assistant outputs
- secrets, tokens, cookies, headers
- full original filenames unless strictly necessary

## Error Handling Placement

Route handlers should:

- parse and validate input
- call a service
- catch typed application errors
- convert them to the shared error envelope

Services should:

- throw typed application errors with stable codes
- decide when an audit event should be emitted
- log provider failures with enough context for debugging

Provider adapters should:

- normalize external failures into internal typed errors
- avoid leaking provider-specific payloads upward

## Planned Implementation Helpers

Target direction:

```text
lib/server/errors/app-error.ts
lib/server/errors/to-error-response.ts
lib/server/errors/with-route-error-handling.ts
lib/server/audit/audit-service.ts
lib/server/audit/runtime-logger.ts
```

## Relationship To Existing Tables

- `audit_logs` records sensitive product and access events
- `moderation_events` records content safety outcomes
- provider/runtime logs stay in application logs, not in either table by default

This separation should stay strict.
