# Oversight Surfaces V1

Related: [README](../README.md) | [App shell V1](app_shell_v1.md) | [Invitation flows V1](invitation_flows_v1.md) | [Role and access matrix](role_access_matrix.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md) | [Error and audit conventions](error_audit_conventions.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document records the first real parent, tutor, and admin oversight surfaces delivered in `A5`.

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

## Canonical Routes

Pages:

- `/app` for role-specific dashboards
- `/app/students/[studentUserId]` for linked parent/tutor student detail
- `/app/review/[conversationId]` for parent/tutor read-only session review
- `/app/audit` for admin-sensitive access review

APIs:

- `GET /api/conversations/[conversationId]`
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

Server services:

- `lib/server/oversight/access.ts`
- `lib/server/oversight/parent-service.ts`
- `lib/server/oversight/tutor-service.ts`
- `lib/server/oversight/tutor-note-service.ts`
- `lib/server/oversight/admin-service.ts`
- `lib/server/oversight/types.ts`

Verification:

- `scripts/smoke-adult-oversight.mjs`

## Parent Surface Rules

Dashboard:

- shows linked students
- shows cross-student recent sessions
- shows a 7-day parent-summary rollup
- shows payer subscription status from `subscriptions`
- shows each linked student's quota state from the shared usage service and exposes billing action buttons

Student detail:

- stays read-only
- links to session review
- exposes the canonical parent-issued tutor invite form for that linked child
- repeats the linked student's current quota state and remaining period budget

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
- `npm run smoke:student-flow`
- `npm run smoke:adult-oversight`
- `npm run smoke:billing`

Latest local result on 2026-03-11:

- RLS fixture verification passed with `17` checks and `0` failures
- student-flow smoke passed with provider-fallback warnings
- adult-oversight smoke passed across parent, tutor, and admin surfaces
- billing smoke passed against the signed Lemon webhook route and the parent dashboard billing surface, while the checkout route still failed cleanly in local because the Lemon checkout env remains blank

## Known Boundaries

- parent billing actions now exist, but local `/api/billing/checkout` still returns `503` until the Lemon API key, store id, and Family variant id are provisioned
- parent summary translation depends on the available stored summary variants; no on-demand translation UI exists yet
- tutor notes do not yet support rich categorization, attachments, or admin annotation
- admin audit review is intentionally narrow and does not replace broader moderation or support tooling
