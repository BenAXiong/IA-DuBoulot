# API Route Map

Related: [README](../README.md) | [Access rules V1](access_rules_v1.md) | [Supabase schema V1](supabase_schema_v1.md) | [Invitation flows V1](invitation_flows_v1.md) | [Service interfaces](service_interfaces.md) | [Error and audit conventions](error_audit_conventions.md) | [Storage and attachment rules](storage_attachment_rules.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document defines the first server route surface for the MVP.

Current implemented routes:

- `GET /api/auth/me`
- `POST /api/auth/profile/bootstrap`
- `PATCH /api/auth/profile`
- `POST /api/auth/parent-approval/request`
- `POST /api/auth/parent-approval/confirm`
- `POST /api/auth/invitations/accept`
- `POST /api/tutor/links`
- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/[conversationId]`

It exists to prevent accidental drift between:

- direct browser table access allowed by RLS
- server-side privileged operations
- future UI work that needs stable endpoints

## Route Design Rules

- Use Next.js App Router route handlers under `app/api/.../route.ts`.
- Keep route handlers thin: parse input, load session, call service layer, return typed response.
- Do not place billing, moderation, prompt orchestration, or multi-table business logic directly in route handlers.
- Sensitive writes must be server-side even if RLS could theoretically allow them.
- Treat client-supplied role or link context as untrusted; derive authorization from the server session and database.
- Log privileged operations and unusual failures according to [error_audit_conventions.md](error_audit_conventions.md).

## Route Families

### Auth And Account Bootstrap

These routes establish or sync `public.users` and linked role state after Supabase auth events.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/auth/me` | `GET` | authenticated user | return current app user + role context | should read `public.users`, not raw auth metadata |
| `/api/auth/profile/bootstrap` | `POST` | authenticated user | create or repair the caller row in `public.users` | first post-signup bootstrap step |
| `/api/auth/profile` | `PATCH` | authenticated user | update editable profile fields | route must whitelist safe fields |
| `/api/auth/parent-approval/request` | `POST` | under-13 student | start pending parent approval | current V1 issues a shareable invite URL |
| `/api/auth/parent-approval/confirm` | `POST` | parent | activate pending child link/account | creates audit trail |
| `/api/auth/invitations/accept` | `POST` | invited tutor | accept a link invitation | validates token + caller identity |

### Uploads And Extraction Intake

These routes reserve storage locations, confirm uploaded files, and trigger extraction.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/uploads/create` | `POST` | student | create an upload record + signed upload target | route owns file limits and bucket choice |
| `/api/uploads/confirm` | `POST` | student | mark upload complete and attach to conversation | validates ownership + upload metadata |
| `/api/uploads/extract` | `POST` | server-triggered or student | request text extraction for an attachment | should enqueue or async-trigger later |
| `/api/attachments/[attachmentId]/access` | `GET` | visible role | mint short-lived read access for an attachment | required because buckets stay private |

### Conversations And Workspace

These routes power the student core flow.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/conversations` | `GET` | authenticated user | list visible conversations for the caller role | role-aware filtering required |
| `/api/conversations` | `POST` | student | create a new conversation | creates initial conversation shell |
| `/api/conversations/[conversationId]` | `GET` | visible role | load a conversation with messages, attachments, workspace, summaries | server-side auth check still required |
| `/api/conversations/[conversationId]/messages` | `POST` | student | append a student message and trigger assistant response flow | assistant write stays server-side |
| `/api/conversations/[conversationId]/workspace` | `PATCH` | student | save workspace state | supports draft restoration |
| `/api/conversations/[conversationId]/complete` | `POST` | student | mark conversation complete | can trigger summary generation |

### Summaries And Memory

These routes expose generated educational context while keeping raw generation server-controlled.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/conversations/[conversationId]/summaries` | `GET` | visible role | fetch summaries allowed for the caller | audience segregation must match RLS |
| `/api/conversations/[conversationId]/summaries/generate` | `POST` | server/admin | generate student, parent, or tutor summaries | not a browser-direct route in V1 |
| `/api/students/[studentId]/memory` | `GET` | student, linked parent, admin | fetch memory profile and safe items | tutor uses derived insights later |
| `/api/students/[studentId]/memory` | `PATCH` | server/admin | apply curated memory updates or deletions | speculative profiling must stay blocked |

### Parent And Tutor Linking

These routes manage role links and adult visibility setup.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/parent/links` | `POST` | parent | create or confirm parent-student link | under-13 flow depends on this |
| `/api/parent/links/[linkId]` | `PATCH` | parent | update or revoke parent-student link | sensitive access should be audited |
| `/api/parent/students` | `GET` | parent | list linked students and overview state | summary-oriented response |
| `/api/tutor/links` | `POST` | linked parent or eligible student | create a canonical tutor invitation | current V1 returns a shareable invite URL |
| `/api/tutor/links/[linkId]` | `PATCH` | tutor or parent | approve, revoke, or update tutor link | parent approval rules apply |
| `/api/tutor/students` | `GET` | tutor | list linked students with recent status | no raw memory exposure |
| `/api/tutor/notes` | `POST` | tutor | create private tutor note | hidden from parent and student |
| `/api/tutor/notes/[noteId]` | `PATCH` | tutor | update or pin private tutor note | direct browser writes may still be allowed, but route stays canonical |

Current V1 note:

- `POST /api/auth/parent-approval/request`, `POST /api/auth/parent-approval/confirm`, and `/invite/[token]` currently carry the under-13 parent-link flow before a richer parent dashboard exists.

### Billing

These routes isolate provider-specific billing behavior from the rest of the app.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/billing/checkout` | `POST` | parent or payer | create Lemon Squeezy checkout session or redirect payload | payer authorization required |
| `/api/billing/portal` | `POST` | parent or payer | open customer management flow | provider-specific payload stays behind service |
| `/api/billing/webhooks/lemonsqueezy` | `POST` | Lemon Squeezy | receive subscription lifecycle webhooks | signature verification required |

### Admin And Operations

These routes stay narrow and operational.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/admin/users` | `GET` | admin | list or inspect app users | for support/debug only |
| `/api/admin/moderation` | `GET` | admin | inspect flagged moderation events | operational surface |
| `/api/admin/moderation/[eventId]` | `PATCH` | admin | resolve or annotate moderation event | log every action |
| `/api/admin/audit` | `GET` | admin | inspect audit logs | paginate aggressively |

## Planned File Layout

These are route targets, not implemented files yet.

```text
app/api/auth/me/route.ts
app/api/auth/profile/bootstrap/route.ts
app/api/auth/profile/route.ts
app/api/auth/parent-approval/request/route.ts
app/api/auth/parent-approval/confirm/route.ts
app/api/auth/invitations/accept/route.ts
app/api/uploads/create/route.ts
app/api/uploads/confirm/route.ts
app/api/uploads/extract/route.ts
app/api/conversations/route.ts
app/api/conversations/[conversationId]/route.ts
app/api/conversations/[conversationId]/messages/route.ts
app/api/conversations/[conversationId]/workspace/route.ts
app/api/conversations/[conversationId]/complete/route.ts
app/api/conversations/[conversationId]/summaries/route.ts
app/api/conversations/[conversationId]/summaries/generate/route.ts
app/api/students/[studentId]/memory/route.ts
app/api/parent/links/route.ts
app/api/parent/links/[linkId]/route.ts
app/api/parent/students/route.ts
app/api/tutor/links/route.ts
app/api/tutor/links/[linkId]/route.ts
app/api/tutor/students/route.ts
app/api/tutor/notes/route.ts
app/api/tutor/notes/[noteId]/route.ts
app/api/billing/checkout/route.ts
app/api/billing/portal/route.ts
app/api/billing/webhooks/lemonsqueezy/route.ts
app/api/admin/users/route.ts
app/api/admin/moderation/route.ts
app/api/admin/moderation/[eventId]/route.ts
app/api/admin/audit/route.ts
```

## What Stays Out Of Scope For Route Handlers

- direct prompt strings
- provider-specific SDK setup details
- raw SQL spread across handlers
- broad role logic duplicated per route
- storage bucket names hardcoded in multiple files

Those belong in the service layer, constants, or repository helpers.
