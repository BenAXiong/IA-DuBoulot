# Student Dashboard V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [App shell V1](app_shell_v1.md) | [Student memory profile V1](student_memory_profile_v1.md) | [Invitation flows V1](invitation_flows_v1.md) | [Supabase schema V1](supabase_schema_v1.md)

## Purpose

Capture the first real student home screen so future sessions can extend it without re-reading the entire React tree.

## Scope

This document started with `A3.1.1` to `A3.1.3` and now also records the later student-shell redesign:

- student-owned `/app` shell with a collapsible subject rail
- homework-focused home view with recent conversations grouped by subject-tag filters
- placeholder `Maps` and `Tests` activity slots
- canonical intake entry route at `/app/new`
- learner-owned profile, adult-link actions, and memory review moved to `/app/settings`

## Source Files

- Page shell entry: `app/app/page.tsx`
- Student shell: `components/layout/student-app-shell.tsx`
- Student dashboard container: `components/dashboard/student-dashboard.tsx`
- Subject quick start: `components/dashboard/student/student-subject-quick-start.tsx`
- Student settings support sections: `components/dashboard/student/student-settings-support-sections.tsx`
- Canonical intake entry route: `app/app/new/page.tsx`
- Intake entry component: `components/dashboard/student/new-homework-entry.tsx`
- Server snapshot service: `lib/server/student-dashboard/student-dashboard-service.ts`
- Conversation list service: `lib/server/conversations/conversation-service.ts`
- Memory service: `lib/server/memory/service.ts`
- Dashboard types: `lib/server/student-dashboard/types.ts`
- Dashboard localization copy: `lib/i18n/dashboard-copy.ts`
- Student flow localization copy: `lib/i18n/student-flow-copy.ts`

## Data Contract

The student dashboard reads one server-side snapshot object:

- app-user identity basics
- `startState` and `canStartHomework`
- quota and trial snapshot resolved through the server-owned usage service

In the current student-shell pass, the visible homework folders and subject views also read the full visible conversation list. Those subject folders are still derived from each conversation's existing `subject_tag`; they are not backed by a canonical subject table yet.

The page does not query Supabase directly. The service owns that logic.

## Start-State Rules

`startState` resolves to one of:

- `ready`
- `pending_parent_approval`
- `quota_blocked`
- `suspended`
- `deletion_requested`

Current rule:

- under-13 students cannot start a new homework flow while `account_status` is `pending_parent_approval` or while no active parent approval is visible yet
- quota-blocked students stay on the dashboard and `/app/new`, but cannot create a fresh session until the next period or a paying adult subscription restores access
- suspended and deletion-requested accounts cannot start new homework
- everyone else is `ready`

## Student Shell Model

The student role no longer inherits the generic authenticated-shell rhythm used by adults.

Current shell behavior:

- left rail owns activity switching and subject-filter navigation
- `Homework` is the only real student activity today
- `Maps` and `Tests` are placeholder modes held in the shell so future learning tools can grow without another shell rewrite
- the bottom profile dock shows placeholder avatar, learner name, and plan label by default; the settings/sign-out actions now open from a hover or focus menu instead of staying permanently visible
- the top bar is intentionally quiet and keeps only a simple eyebrow-and-title pair plus the language/theme utility controls

Current boundary:

- subject folders are just UI filters over `subject_tag`
- there is still no canonical learner avatar upload
- the shell does not yet expose a subject-creation model independent of creating or reopening homework

## Canonical Entry Route

`/app/new` now exists as the stable entry route for the student intake flow.

Current role:

- receives the student from the dashboard CTA
- repeats the current start-state gate
- hosts the real intake form from [Student intake V1](student_intake_v1.md)
- hands off into the persisted student workbench once the intake context is validated

What it does not do yet:

- billing and privacy controls now live on `/app/settings` instead of expanding the student dashboard itself
- learner-owned adult-link actions and memory now also live on `/app/settings`
- the route still creates the persisted conversation before the student enters the chat, even though the visible copy now reads more like "open chat" than "create session"

Those belong to later business and privacy phases rather than the dashboard shell itself.

## Settings Split

The student home no longer owns the heavier learner profile controls.

Current `/app/settings` student additions:

- profile editing still lives in the shared privacy/settings view
- parent-approval and tutor-invite forms now live there for the student role
- the memory panel now lives there for the student role

Why:

- `/app` should feel like a homework workspace, not a control center
- durable memory and adult-link actions are real product features, but they do not belong in the student's first visual scan every time they open the app

## Known Boundaries

- recent sessions on `/app` are intentionally short and subject-filtered; the canonical long-form list now lives at `/app/history`
- the student dashboard no longer foregrounds quota or adult-link cards on the home surface, but the same server-owned start-state gate still controls `/app` and `/app/new`
- billing remains a parent-owned workflow surfaced on `/app/settings`
- under-13 blocking still depends on the existing parent-approval flow documented in [Invitation flows V1](invitation_flows_v1.md)
- tutor-facing derived insights still belong to the tutor oversight surface; tutors do not receive raw student memory
- the current student-shell subject folders are not canonical entities; they are the existing conversation tags presented as filters
- the subject rail itself no longer expands recent chat lists inline; subject-level recent discussions now stay in the main homework canvas, where the student also sees the dedicated right-side panel
- the subject view itself now keeps a two-pane rhythm: chat-entry and recent-discussion list on the left, right-side sources/meta panel on the other side
- the live conversation route now follows the same split-pane rhythm, with the message stream on the left and the summary/sources/workspace stack living inside the right panel instead of a floating dashboard column

## Next Extension Points

- decide whether subject filters stay lightweight or become canonical subject entities with alias normalization
- decide whether the first learner message should implicitly create the conversation instead of routing through `/app/new`
- replace the placeholder learner avatar with a real pilot-level profile media flow if pilot usage justifies it
