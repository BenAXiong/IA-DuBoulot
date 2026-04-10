# Privacy Controls V1

Related: [README](../README.md) | [Minors privacy baseline](minors_privacy_baseline.md) | [App shell V1](app_shell_v1.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document records the current minimal settings and deletion-control surface that grew out of the first `A6.4` privacy slice.

It exists so later sessions do not have to reconstruct:

- where profile and deletion controls now live
- which roles can request deletion for themselves or linked children
- how queued deletion changes access immediately
- what the current MVP promises about retention and provider disclosures

## Scope

This V1 covers:

- `A6.4.1` through `/app/settings` as the stable minimalist account surface
- `A6.4.2` through queued deletion requests, account freeze, linked-child handling, and immediate tutor-access revocation
- `A6.4.3` through explicit user-facing copy for data categories, retention windows, and provider involvement

## Canonical Routes

Pages:

- `/app/settings`

APIs:

- `POST /api/privacy/deletion-requests`

Protected-route behavior:

- `/app`
- `/app?view=homework`
- `/app/conversations/[conversationId]`
- `/app/students/[studentUserId]`
- `/app/review/[conversationId]`

Current rule:

- non-admin accounts already marked `deletion_requested` are redirected back to `/app/settings`

## Source Files

Pages and UI:

- `app/app/settings/page.tsx`
- `components/dashboard/settings/privacy-settings-view.tsx`
- `components/dashboard/settings/deletion-request-form.tsx`

Server routes and services:

- `app/api/privacy/deletion-requests/route.ts`
- `lib/server/privacy/service.ts`
- `lib/server/privacy/types.ts`
- `lib/i18n/ui-copy.ts`

Shared auth and mutation gates:

- `lib/server/auth/page-guards.ts`
- `lib/server/auth/authorization.ts`
- `lib/server/auth/account-service.ts`
- `lib/server/conversations/conversation-service.ts`
- `lib/server/uploads/service.ts`
- `lib/server/oversight/tutor-note-service.ts`
- `lib/server/billing/service.ts`

Verification:

- `scripts/smoke-privacy-controls.mjs`

## Settings Surface Rules

For every role, `/app/settings` now owns:

- editable app-profile fields when the account is still active
- the self-deletion request entry point when that role is eligible

Parent-specific addition:

- one deletion control per active linked child account

Admin-specific limit:

- no self-service deletion button is exposed

## Deletion Request Rules

Self-deletion:

- student `13+` may request deletion for self
- under-13 student self-deletion is blocked and must come from a linked parent
- tutor may request deletion for self
- parent self-deletion is blocked while active linked students or an active billing relationship remain
- admin self-deletion is blocked from the product UI

Linked-child deletion:

- only a linked parent may request deletion for a child
- the parent link must still be active at request time
- only student accounts are valid child-delete targets

Queued-deletion behavior:

- `users.account_status` becomes `deletion_requested`
- `users.deletion_requested_at` is stored immediately
- auth metadata is synchronized immediately
- tutor links for the affected student are revoked immediately
- new write workflows are blocked through explicit service-layer checks
- the UI shows a 30-day target purge date based on the queued timestamp

## User-Facing Privacy Copy

Current copy rule:

- keep the page operational and minimal
- avoid long explainers, provider lists, or platform-internal wording on the visible settings surface

## Verification

Current automated coverage:

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run smoke:privacy`
- `npm run smoke:student-flow`
- `npm run smoke:adult-oversight`

Latest local result on 2026-03-11:

- the settings page rendered for the fixture parent
- a linked parent successfully queued student deletion through the real route
- the student account moved to `deletion_requested`
- the linked tutor access was revoked immediately
- the deletion-requested student was redirected back to `/app/settings`
- the deletion-requested student could no longer create a new conversation

## Known Boundaries

- the current MVP queues deletion and freezes access immediately, but the final purge execution still needs a real worker or operator workflow
- parent self-deletion remains intentionally conservative while linked students or billing state still exist
- admin deletion stays manual and audited
- the settings shell and deletion-request form now localize their copy through `lib/i18n/ui-copy.ts`, and the main blocked reasons from `lib/server/privacy/service.ts` now follow the viewer language
- some unrelated server-side validation strings elsewhere in the product still remain outside this privacy-specific localization slice
