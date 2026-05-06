# Student Dashboard V1

Related: [README](../README.md) | [MVP to-do list](mvp_todo.md) | [App shell V1](app_shell_v1.md) | [Student memory profile V1](student_memory_profile_v1.md) | [Invitation flows V1](invitation_flows_v1.md) | [Supabase schema V1](supabase_schema_v1.md)

## Purpose

Capture the first real student home screen so future sessions can extend it without re-reading the entire React tree.

## Scope

This document started with `A3.1.1` to `A3.1.3` and now also records the later student-shell redesign:

- student-owned `/app` shell with a collapsible subject rail
- distinct Dashboard view with cards for the left-rail learning sections
- homework-focused home view with recent conversations grouped by subject-tag filters
- disabled placeholder activity slots for future `Recap`, `Exams`, `Forward`, and `Explore` surfaces
- subject-level quick-start that now opens the live chat directly
- legacy `/app/new` compatibility redirect into the homework dashboard
- learner-owned profile editing and deletion controls live on `/app/settings`

## Source Files

- Page shell entry: `app/app/page.tsx`
- Student shell: `components/layout/student-app-shell.tsx`
- Student dashboard container: `components/dashboard/student-dashboard.tsx`
- First-homework launcher: `components/dashboard/student/student-first-homework-launcher.tsx`
- Subject quick start: `components/dashboard/student/student-subject-quick-start.tsx`
- Pending bootstrap store: `lib/conversations/pending-bootstrap-store.ts`
- Compatibility redirect route: `app/app/new/page.tsx`
- Server snapshot service: `lib/server/student-dashboard/student-dashboard-service.ts`
- Conversation list service: `lib/server/conversations/conversation-service.ts`
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
- quota-blocked students stay on the dashboard, but cannot create a fresh session until the next period or a paying adult subscription restores access
- suspended and deletion-requested accounts cannot start new homework
- everyone else is `ready`

## Student Shell Model

The student role no longer inherits the generic authenticated-shell rhythm used by adults.

Current shell behavior:

- left rail owns the distinct Dashboard entry, the enabled Homework entry, and subject-filter navigation
- `Homework` is the only real student activity today
- subject row chevrons reveal the latest five conversation titles for that subject, with `...` when more exist, and opening one subject subsection closes the previous one
- `Recap`, `Exams`, `Forward`, and `Explore` are visible but disabled placeholder modes held in the shell so future learning tools can grow without another shell rewrite; their descriptions are hover-revealed in already-reserved space so the left rail does not shift when hovered
- the bottom profile dock shows placeholder avatar, learner name, and plan label by default; the settings/sign-out actions now open from a hover or focus menu instead of staying permanently visible
- the top bar is intentionally quiet, slimmer than the earlier MVP chrome, and keeps only a simple eyebrow-and-title pair plus the smaller language/theme utility controls
- the Dashboard view is separate from Homework: `/app` or `view=dashboard` shows cards for Homework, Recap, Exams/Tests, Forward, and Explore, while `view=homework` owns subject selection and chat launch

Current boundary:

- subject folders are just UI filters over `subject_tag`
- there is still no canonical learner avatar upload
- the shell does not yet expose a subject-creation model independent of creating or reopening homework

## Student Entry Model

The main learner entry now happens from the subject view itself.

Current role:

- when the learner has no existing subject tags yet, the empty homework state now renders a real first-homework launcher with subject selection instead of a self-link back to the same page
- when the learner already has subjects, the root homework view still exposes subject creation and selection directly, so the left rail no longer needs a separate root Homework `+` affordance
- the left rail uses chevrons, not `+`, for Homework expansion and per-subject recent-conversation expansion
- the root homework view now always keeps the subject pills launcher visible, so adding a new subject is part of the normal homework home rather than the top-level Dashboard card grid
- the subject quick-start on `/app?view=homework&subject=...` creates a bare conversation shell
- it can now complete the real upload-plus-extraction pass before the first learner prompt is handed off to the live chat
- while the subject quick-start is preparing a chat that already has staged files, its submit control now reuses the same tiered ring language as the live composer for the first `prepare` stage instead of flashing a different loading affordance
- once the shell exists, it now routes immediately into `/app/conversations/[conversationId]`
- it hands the first learner prompt, reply mode, and any launcher error state into a small client bootstrap store
- the live conversation view now owns the optimistic first-turn UI and the first real message send, while the subject launcher can front-load attachment preparation so the learner does not spend that first prompt before upload or extraction has either succeeded or failed explicitly
- both the subject quick-start and the live conversation composer now support `Ctrl+Enter` as a submit shortcut while keeping the visible send affordance icon-only

`/app/new` no longer acts as a destination in the product. Old student links now redirect into `/app?view=homework`, preserving optional `subject` and `draft` query params so the learner lands on the current subject launcher instead of the retired intake page.

## Settings Split

The student home no longer owns the heavier learner profile controls.

Current `/app/settings` student surface:

- profile editing still lives there
- deletion controls still live there
- the route is now intentionally minimal and no longer carries student support, adult-link, memory, or billing sections

Why:

- `/app` should feel like a homework workspace, not a control center
- the first revamp pass is easier if `/app/settings` is reduced to core account operations instead of carrying mixed student-support utilities

## Known Boundaries

- recent sessions on `/app` are intentionally short and subject-filtered, and the subject-view recent block no longer duplicates a second history surface with a separate `Open` CTA
- the student dashboard no longer foregrounds quota or adult-link cards on the home surface, but the same server-owned start-state gate still controls the homework launcher
- billing remains a parent-owned workflow, but it is no longer surfaced through the current minimalist `/app/settings` page
- under-13 blocking still depends on the existing parent-approval flow documented in [Invitation flows V1](invitation_flows_v1.md)
- tutor-facing derived insights still belong to the tutor oversight surface; tutors do not receive raw student memory
- the current student-shell subject folders are not canonical entities; they are the existing conversation tags presented as filters
- the subject rail itself no longer expands recent chat lists inline; subject-level recent discussions stay in the main homework canvas
- the subject view itself now keeps a single main column until a chat is actually started
- the empty homework state no longer depends on a pre-existing subject tag to become usable; the first conversation can now establish that first subject from inside the dashboard itself
- the live conversation route now follows the same split-pane rhythm, with the message stream on the left and a lighter summary/sources rail on the right instead of the earlier heavier dashboard stack
- the pre-chat subject quick-start now owns real file staging, but the real first-turn pending state lives on the conversation route after the shell is created

## Next Extension Points

- decide whether subject filters stay lightweight or become canonical subject entities with alias normalization
- decide later whether the client bootstrap handoff should stay in-memory only or gain a more durable cross-refresh recovery path
- decide later whether any richer pre-chat source-review UI should return inside the homework dashboard or remain unnecessary after the `/app/new` retirement
- replace the placeholder learner avatar with a real pilot-level profile media flow if pilot usage justifies it
