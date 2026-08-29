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
- `components/dashboard/parent/parent-account-dock.tsx`
- `components/dashboard/parent/parent-learners-rail.tsx`
- `components/dashboard/parent/parent-activity-hub.tsx`
- `components/dashboard/parent/parent-dashboard-presenters.ts`
- `components/dashboard/parent/profile-avatar.tsx`
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
- `lib/i18n/dashboard-copy.ts`
- `lib/i18n/oversight-copy.ts`

Server services:

- `lib/server/oversight/access.ts`
- `lib/server/oversight/parent-service.ts`
- `lib/oversight/summary-selection.ts`
- `lib/server/oversight/tutor-service.ts`
- `lib/server/oversight/tutor-note-service.ts`
- `lib/server/oversight/admin-service.ts`
- `lib/server/oversight/types.ts`
- `lib/server/memory/service.ts`

Verification:

- `scripts/smoke-adult-oversight.mjs`
- `scripts/smoke-memory-profile.mjs`
- `scripts/verify-i18n-contracts.mjs`

## Parent Surface Rules

Dashboard:

- suppresses the generic authenticated shell sidebar and replaces it with a parent-owned left rail plus a grouped right-column activity hub
- keeps the parent account, payer status, and billing/settings actions in a compact account dock instead of repeating a full bottom-of-page account-settings block
- surfaces parent-targeted pending approval requests addressed to the signed-in email in the left rail, with one-click acceptance from `/app`
- includes a parent-owned learner-creation panel in that same rail so a signed-in parent can bootstrap a linked learner account without leaving the dashboard
- shows linked learners in their own rail with visible status, recent activity, open homework count, usage, and recurring difficulty tags
- lets the parent choose the learner's age band, default interface/help languages, optional relationship label, and initial learner sign-in credentials during that bootstrap step
- groups the 7-day parent-summary rollup and cross-student recent sessions in one activity area instead of scattering them across unrelated cards
- surfaces one spotlight learner as the clearest next parent follow-up when recent activity makes that useful
- shows payer subscription status from `subscriptions`
- shows each linked student's quota state from the shared usage service
- keeps the invite-link flow valid, but no longer requires the parent to reopen the raw `/invite/[token]` URL once they are already signed in and the pending request can be resolved from the dashboard
- leaves the richer billing/privacy controls to `/app/settings`, while still surfacing the parent billing status inside the dashboard
- now localizes its own `/app` dashboard copy through `lib/i18n/dashboard-copy.ts`
- the linked-student detail, parent review, and admin audit list now also localize their interface copy through `lib/i18n/oversight-copy.ts`
- the current billing-management conflict path now also localizes its user-facing message through `lib/i18n/oversight-copy.ts`

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
- surfaces top tutor-summary weakness tags with localized human labels instead of raw stored codes
- links into the tutor student detail and session-review flow
- now localizes its own `/app` dashboard copy through `lib/i18n/dashboard-copy.ts`
- the linked-student detail, tutor summary, session-review note surface, and admin audit list now also localize their interface copy through `lib/i18n/oversight-copy.ts`, while the tutor-summary weakness-tag chips reuse the shared student-flow label mapping

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
- tutor-note create, update, and delete validation, not-found, and service-failure messages now localize from the tutor's UI language instead of defaulting to French

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
- the first `/app` admin dashboard summary cards are localized through `lib/i18n/dashboard-copy.ts`
- the dedicated `/app/audit` list now also resolves localized actor-role, action, target-table, and empty-state copy through `lib/i18n/oversight-copy.ts`

## Verification

Current automated coverage now includes:

- `npm run verify:rls-fixtures`
- `npm run smoke:memory`
- `npm run smoke:student-flow`
- `npm run smoke:adult-oversight`
- `npm run smoke:billing`

Latest local results:

- RLS fixture verification passed with `17` checks and `0` failures
- memory smoke passed across student and parent memory surfaces while confirming tutor raw-memory denial
- student-flow smoke passed with provider-fallback warnings
- adult-oversight smoke passed across parent, tutor, and admin surfaces after the localized tutor-note and admin-audit updates
- adult-oversight smoke now also seeds one temporary pending parent approval, verifies that `/app` surfaces it in the parent rail, and confirms that the parent can accept it directly from the dashboard path without reopening the raw invite URL
- 2026-04-02 adult-oversight smoke passed again after the parent-created learner bootstrap slice, including parent-side learner creation, learner-rail visibility, learner sign-in with the parent-chosen credentials, tutor-note mutations, and admin audit visibility
- billing smoke passed against the signed Lemon webhook route and the parent dashboard billing surface after normalizing streamed HTML comments or tags in the assertion layer, while intentionally blanking local checkout env to keep the graceful `503` branch covered and rechecking the localized billing-management conflict path
- deployed Vercel billing verification also passed in Lemon test mode, including checkout open, payment completion, redirect back to `/app`, dashboard subscription visibility, confirmation email, and Lemon order logging

## Known Boundaries

- the local billing smoke still forces `/api/billing/checkout` through the explicit `503` path even though real Lemon env can now be provisioned locally or in Vercel
- parent summary translation depends on the available stored summary variants; no on-demand translation UI exists yet
- pending parent approvals now surface in `/app`, but there is still no separate notifications inbox or background delivery system; Resend-backed delivery remains a later slice
- parent-created learner bootstrap currently creates a real learner auth account with temporary credentials because the product still maps every learner to `auth.users`; a future managed-profile/claim flow would be a separate auth redesign, not an extension of this slice
- tutor raw-memory access remains intentionally blocked even though the linked-parent surface now exposes the same memory panel used on the student dashboard
- tutor notes do not yet support rich categorization, attachments, or admin annotation
- admin audit review is intentionally narrow and does not replace broader moderation or support tooling
