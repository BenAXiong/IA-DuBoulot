# Student Dashboard V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [App shell V1](app_shell_v1.md) | [Invitation flows V1](invitation_flows_v1.md) | [Supabase schema V1](supabase_schema_v1.md)

## Purpose

Capture the first real student home screen so future sessions can extend it without re-reading the entire React tree.

## Scope

This document covers `A3.1.1` to `A3.1.3`:

- main `New homework` CTA on the student dashboard
- recent session list with subject tags
- linked-adult status
- usage status from `usage_counters`
- canonical intake entry route at `/app/new`

## Source Files

- Page shell entry: `app/app/page.tsx`
- Student dashboard container: `components/dashboard/student-dashboard.tsx`
- Start panel: `components/dashboard/student/student-dashboard-start-panel.tsx`
- Recent sessions panel: `components/dashboard/student/student-dashboard-recent-sessions.tsx`
- Support and usage panel: `components/dashboard/student/student-dashboard-support-grid.tsx`
- Canonical intake entry route: `app/app/new/page.tsx`
- Intake entry component: `components/dashboard/student/new-homework-entry.tsx`
- Server snapshot service: `lib/server/student-dashboard/student-dashboard-service.ts`
- Dashboard types: `lib/server/student-dashboard/types.ts`

## Data Contract

The student dashboard reads one server-side snapshot object:

- app-user identity basics
- `startState` and `canStartHomework`
- recent conversations
- subject-tag rollup derived from recent conversations
- parent/tutor link counts
- parent-approval status from `student_profiles`
- latest usage period from `usage_counters`

The page does not query Supabase directly. The service owns that logic.

## Start-State Rules

`startState` resolves to one of:

- `ready`
- `pending_parent_approval`
- `suspended`
- `deletion_requested`

Current rule:

- under-13 students cannot start a new homework flow while `account_status` is `pending_parent_approval` or while no active parent approval is visible yet
- suspended and deletion-requested accounts cannot start new homework
- everyone else is `ready`

## Why Link Status Uses Counts Instead Of Adult Names

The current RLS model lets students read their `parent_student_links` and `tutor_student_links`, but it does not broadly expose linked adult `public.users` rows back to the student. Because of that, V1 shows linked-adult counts and states, not adult display names.

If named adult chips become necessary later, add a narrowly-authorized server-side read path instead of weakening the base `users` RLS.

## Canonical Entry Route

`/app/new` now exists as the stable entry route for the student intake flow.

Current role:

- receives the student from the dashboard CTA
- repeats the current start-state gate
- explains the target A3.2 sequence

What it does not do yet:

- no assignment-title persistence
- no subject entry form yet
- no upload step yet
- no conversation creation yet

Those belong to `A3.2` and `A3.3`.

## Known Boundaries

- recent sessions are informational only until `A3.5` adds detail/reopen views
- usage is display-only until `A6.2` adds real trial/quota enforcement
- under-13 blocking still depends on the existing parent-approval flow documented in [Invitation flows V1](invitation_flows_v1.md)

## Next Extension Points

- `A3.2.1`: mount the real title-and-subject form on `/app/new`
- `A3.2.2` to `A3.2.4`: add upload and extraction-review steps
- `A3.3.1`: persist the first conversation shell instead of using a staging route only
