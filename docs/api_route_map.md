# API Route Map

Related: [README](../README.md) | [Access rules V1](access_rules_v1.md) | [Supabase schema V1](supabase_schema_v1.md) | [Student memory profile V1](student_memory_profile_v1.md) | [Invitation flows V1](invitation_flows_v1.md) | [Oversight surfaces V1](oversight_surfaces_v1.md) | [Privacy controls V1](privacy_controls_v1.md) | [Telemetry and feature controls V1](telemetry_feature_controls_v1.md) | [Service interfaces](service_interfaces.md) | [Error and audit conventions](error_audit_conventions.md) | [Storage and attachment rules](storage_attachment_rules.md) | [MVP to-do list](mvp_todo.md)

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
- `POST /api/tutor/notes`
- `PATCH /api/tutor/notes/[noteId]`
- `DELETE /api/tutor/notes/[noteId]`
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/billing/webhooks/lemonsqueezy`
- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/[conversationId]`
- `POST /api/conversations/[conversationId]/complete`
- `POST /api/conversations/[conversationId]/messages`
- `PATCH /api/conversations/[conversationId]/workspace`
- `GET /api/admin/audit/access-events`
- `POST /api/privacy/deletion-requests`
- `GET /api/students/[studentId]/memory`
- `PATCH /api/students/[studentId]/memory`
- `POST /api/telemetry/events`
- `POST /api/uploads/create`
- `POST /api/uploads/confirm`
- `POST /api/uploads/extract`
- `GET /api/attachments/[attachmentId]/access`
- `DELETE /api/attachments/[attachmentId]`

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
| `/api/uploads/create` | `POST` | student | create an upload record + signed upload target | route owns per-MIME file limits, bucket choice, and the upload quota gate |
| `/api/uploads/confirm` | `POST` | student | mark upload complete and attach to conversation | validates ownership + upload metadata; provider extraction failure now returns a warning plus attachment `failed` instead of a hard route error; repeated confirmation reuses the stored extraction result instead of re-running Gemini |
| `/api/uploads/extract` | `POST` | server-triggered or student | request text extraction for an attachment | should enqueue or async-trigger later |
| `/api/attachments/[attachmentId]/access` | `GET` | visible role | mint short-lived read access for an attachment | required because buckets stay private |
| `/api/attachments/[attachmentId]` | `DELETE` | student owner | remove an uploaded file from an active conversation | deletes the attachment record and storage object; hidden workspace text stays untouched for now |

### Conversations And Workspace

These routes power the student core flow.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/conversations` | `GET` | authenticated user | list visible conversations for the caller role | role-aware filtering required |
| `/api/conversations` | `POST` | student | create a new conversation | creates the initial conversation shell, enforces the session quota gate, and is now the first step in the direct homework-launch handoff into the live conversation route |
| `/api/conversations/[conversationId]` | `GET` | visible role | load a conversation with messages, attachments, workspace, summaries | server-side auth check now explicitly revalidates adult links and audits parent/tutor review reads |
| `/api/conversations/[conversationId]/messages` | `POST` | student | append a student message and trigger assistant response flow | current local workspace uses the Gemini-backed provider plus moderation, with deterministic coach fallback if the provider call fails, bounded request/body sizes, a quota gate before new assistant turns, a best-effort successful coach-output debug capture in the dedicated server-owned table, and a best-effort short title refresh on the first successful learner turn |
| `/api/conversations/[conversationId]/workspace` | `PATCH` | student | save workspace state | supports draft restoration, extracted-text sync, and attachment follow-up notes |
| `/api/conversations/[conversationId]/complete` | `POST` | student | mark conversation complete | returns only the student-visible summary; adult variants are generated best-effort and do not block student completion; repeated completion reuses the stored student summary instead of regenerating summaries or memory |

### Summaries And Memory

These routes expose generated educational context while keeping raw generation server-controlled.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/conversations/[conversationId]/summaries` | `GET` | visible role | fetch summaries allowed for the caller | audience segregation must match RLS |
| `/api/conversations/[conversationId]/summaries/generate` | `POST` | server/admin | generate student, parent, or tutor summaries | not a browser-direct route in V1 |
| `/api/students/[studentId]/memory` | `GET` | student, linked parent, admin | fetch the current memory profile and active items | parent and admin reads are audited; tutor raw-memory access stays denied |
| `/api/students/[studentId]/memory` | `PATCH` | student, linked parent, admin | apply manual memory upserts or deletions | completion-triggered generation stays server-owned; speculative profiling must stay blocked |

### Parent And Tutor Linking

These routes manage role links and adult visibility setup.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/parent/links` | `POST` | parent | create or confirm parent-student link | under-13 flow depends on this |
| `/api/parent/links/[linkId]` | `PATCH` | parent | update or revoke parent-student link | sensitive access should be audited |
| `/api/parent/students` | `POST` | parent | create a linked learner account from the parent workspace | additive parent-owned bootstrap path; keeps the learner-created flow valid |
| `/api/tutor/links` | `POST` | linked parent or eligible student | create a canonical tutor invitation | current V1 returns a shareable invite URL |
| `/api/tutor/links/[linkId]` | `PATCH` | tutor or parent | approve, revoke, or update tutor link | parent approval rules apply |
| `/api/tutor/students` | `GET` | tutor | list linked students with recent status | no raw memory exposure |
| `/api/tutor/notes` | `POST` | tutor | create private tutor note | hidden from parent and student |
| `/api/tutor/notes/[noteId]` | `PATCH` | tutor | update or pin private tutor note | route stays canonical and emits audit rows |
| `/api/tutor/notes/[noteId]` | `DELETE` | tutor | delete private tutor note | route stays canonical and emits audit rows |

Current V1 note:

- `POST /api/auth/parent-approval/request`, `POST /api/auth/parent-approval/confirm`, and `/invite/[token]` still carry the canonical under-13 parent-approval flow, but the richer parent dashboard now also exposes pending approvals and the new parent-created learner bootstrap path directly from `/app`.

### Billing

These routes isolate provider-specific billing behavior from the rest of the app.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/billing/checkout` | `POST` | parent | create a Lemon Squeezy checkout redirect or JSON payload | MVP payer role is `parent`; explicit `503` when Lemon checkout config is still blank |
| `/api/billing/portal` | `POST` | parent | open customer management flow | route may redirect directly for form submits or return JSON for scripted callers |
| `/api/billing/webhooks/lemonsqueezy` | `POST` | Lemon Squeezy | receive subscription lifecycle webhooks | signature verification required; sync persists `subscriptions` through the billing service; the deployed Vercel app has now also completed a real Lemon test-mode checkout |

### Privacy And Data Controls

These routes own user-facing privacy controls and queued deletion requests.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/privacy/deletion-requests` | `POST` | authenticated user or linked parent | queue deletion for the caller or a linked child account | updates `users.account_status`, syncs auth metadata, revokes tutor access for child deletion, and returns the queued purge target date |

### Telemetry And Feature Controls

These routes keep product telemetry explicit and keep analytics metadata out of domain routes.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/telemetry/events` | `POST` | browser client | record a whitelisted product event | current MVP sink is structured runtime logging; no raw child content; actual PostHog forwarding remains deferred until a dedicated adapter is implemented |

### Admin And Operations

These routes stay narrow and operational.

| Route | Method | Caller | Purpose | Notes |
| --- | --- | --- | --- | --- |
| `/api/admin/users` | `GET` | admin | list or inspect app users | for support/debug only |
| `/api/admin/moderation` | `GET` | admin | inspect flagged moderation events | operational surface |
| `/api/admin/moderation/[eventId]` | `PATCH` | admin | resolve or annotate moderation event | log every action |
| `/api/admin/audit` | `GET` | admin | inspect audit logs | broader audit route still remains future work |
| `/api/admin/audit/access-events` | `GET` | admin | inspect adult review and tutor-note events | current V1 powers `/app/audit` plus the adult smoke script |

## Planned File Layout

These are the canonical route targets. Several are now implemented in code, including auth, conversations, uploads, and attachment access.

```text
app/api/auth/me/route.ts
app/api/auth/profile/bootstrap/route.ts
app/api/auth/profile/route.ts
app/api/auth/parent-approval/request/route.ts
app/api/auth/parent-approval/confirm/route.ts
app/api/auth/invitations/accept/route.ts
app/api/attachments/[attachmentId]/access/route.ts
app/api/attachments/[attachmentId]/route.ts
app/api/uploads/create/route.ts
app/api/uploads/confirm/route.ts
app/api/uploads/extract/route.ts
app/api/privacy/deletion-requests/route.ts
app/api/telemetry/events/route.ts
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
app/api/admin/audit/access-events/route.ts
```

## What Stays Out Of Scope For Route Handlers

- direct prompt strings
- provider-specific SDK setup details
- raw SQL spread across handlers
- broad role logic duplicated per route
- storage bucket names hardcoded in multiple files

Those belong in the service layer, constants, or repository helpers.
