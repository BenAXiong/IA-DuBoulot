# Oversight Surfaces V1

Related: [README](../README.md) | [App shell V1](app_shell_v1.md) | [Student memory profile V1](student_memory_profile_v1.md) | [Invitation flows V1](invitation_flows_v1.md) | [Role and access matrix](role_access_matrix.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md) | [Error and audit conventions](error_audit_conventions.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document records the first real parent, tutor, and admin oversight surfaces delivered in `A5`, plus the `A6.1` parent memory extension.

It exists so later sessions do not have to reconstruct:

- which adult routes are canonical
- which data each role can review
- where tutor-note mutations happen
- where sensitive access auditing now lives

## Scope

This V1 covers:

- `A5.1.1` to `A5.1.3` through the already-live invitation and linking model plus parent-issued tutor invites from the linked-student view
- `A5.2.1` to `A5.2.3` through the parent dashboard, linked-student detail, read-only session review, summary language toggle, and billing-status display
- `A5.3.1` to `A5.3.4` through the tutor dashboard, linked-student detail, tutor-summary review, and private tutor notes
- `A5.4.1` to `A5.4.3` through adult session-view audit rows, the first admin audit page, and automated route smoke coverage
- `A6.1` parent extension through the linked-student pedagogical memory panel and raw-memory audit path

## Canonical Routes

Pages:

- `/app` for role-specific dashboards
- `/app/students/[studentUserId]` for linked parent/tutor student detail
- `/app/review/[conversationId]` for parent/tutor read-only session review
- `/app/audit` for admin-sensitive access review

APIs:

- `GET /api/conversations/[conversationId]`
- `GET /api/students/[studentId]/memory`
- `PATCH /api/students/[studentId]/memory`
- `POST /api/tutor/notes`
- `PATCH /api/tutor/notes/[noteId]`
- `DELETE /api/tutor/notes/[noteId]`
- `GET /api/admin/audit/access-events`

## Source Files

Pages:

- `app/app/page.tsx`
- `app/app/students/[studentUserId]/page.tsx`
- `app/app/review/[conversationId]/page.tsx`
- `app/app/audit/page.tsx`

Dashboard and review components:

- `components/dashboard/parent-dashboard.tsx`
- `components/dashboard/tutor-dashboard.tsx`
- `components/dashboard/admin-dashboard.tsx`
- `components/dashboard/oversight/parent-student-detail.tsx`
- `components/dashboard/oversight/tutor-student-detail.tsx`
- `components/dashboard/oversight/adult-conversation-review.tsx`
- `components/dashboard/oversight/summary-language-panel.tsx`
- `components/dashboard/oversight/tutor-summary-panel.tsx`
- `components/dashboard/oversight/tutor-notes-panel.tsx`
- `components/dashboard/oversight/admin-access-audit-list.tsx`
- `components/dashboard/oversight/billing-status-card.tsx`
- `components/dashboard/memory/memory-panel.tsx`

Server services:

- `lib/server/oversight/access.ts`
- `lib/server/oversight/parent-service.ts`
- `lib/server/oversight/tutor-service.ts`
- `lib/server/oversight/tutor-note-service.ts`
- `lib/server/oversight/admin-service.ts`
- `lib/server/oversight/types.ts`
- `lib/server/memory/service.ts`

Verification:

- `scripts/smoke-adult-oversight.mjs`
- `scripts/smoke-memory-profile.mjs`

## Parent Surface Rules

Dashboard:

- shows linked students
- shows cross-student recent sessions
- shows a 7-day parent-summary rollup
- shows payer subscription status from `subscriptions`
- shows each linked student's quota state from the shared usage service
- leaves the richer billing/privacy controls to `/app/settings`, while still surfacing the parent billing status inside the dashboard

Student detail:

- stays read-only for session content
- links to session review
- includes the pedagogical memory panel with manual edit and delete controls for the linked parent
- exposes the canonical parent-issued tutor invite form for that linked child
- repeats the linked student's current quota state and remaining period budget
- emits audit rows when the parent reads raw memory

Session review:

- uses the same conversation/workspace/attachment data contract as the student flow
- shows only parent-visible summaries
- exposes a language toggle across stored parent summary variants
- repeats billing status in the side panel

## Tutor Surface Rules

Dashboard:

- shows linked students with recent-session counts
- surfaces top tutor-summary weakness tags
- links into the tutor student detail and session-review flow

Student detail:

- shows recent sessions and derived next topics
- includes a persistent private-note panel for that student
- does not expose raw student memory; tutor views stay limited to derived summary and note surfaces

Session review:

- remains read-only for conversation/workspace content
- shows only tutor-visible summaries
- includes tutor-note creation for the specific session

## Tutor Note Rules

- note ownership is always the signed-in tutor
- notes may be general to the student or linked to one conversation
- notes stay invisible to student and parent
- mutations go through canonical server routes even though RLS already restricts direct access
- create, update, and delete actions emit audit rows

## Audit Rules

Current auditable actions in this slice:

- `parent_session_review_view`
- `tutor_session_review_view`
- `tutor_note_create`
- `tutor_note_update`
- `tutor_note_delete`

Current review surface:

- `/app/audit` for admin
- `GET /api/admin/audit/access-events` for machine-readable inspection and smoke coverage

## Verification

Current automated coverage now includes:

- `npm run verify:rls-fixtures`
- `npm run smoke:memory`
- `npm run smoke:student-flow`
- `npm run smoke:adult-oversight`
- `npm run smoke:billing`

Latest local result on 2026-03-11:

- RLS fixture verification passed with `17` checks and `0` failures
- memory smoke passed across student and parent memory surfaces while confirming tutor raw-memory denial
- student-flow smoke passed with provider-fallback warnings
- adult-oversight smoke passed across parent, tutor, and admin surfaces
- billing smoke passed against the signed Lemon webhook route and the parent dashboard billing surface, while intentionally blanking local checkout env to keep the graceful `503` branch covered
- deployed Vercel billing verification also passed in Lemon test mode, including checkout open, payment completion, redirect back to `/app`, dashboard subscription visibility, confirmation email, and Lemon order logging

## Known Boundaries

- the local billing smoke still forces `/api/billing/checkout` through the explicit `503` path even though real Lemon env can now be provisioned locally or in Vercel
- parent summary translation depends on the available stored summary variants; no on-demand translation UI exists yet
- tutor raw-memory access remains intentionally blocked even though the linked-parent surface now exposes the same memory panel used on the student dashboard
- tutor notes do not yet support rich categorization, attachments, or admin annotation
- admin audit review is intentionally narrow and does not replace broader moderation or support tooling
