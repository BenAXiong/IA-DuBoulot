# RLS Fixture Verification

Related: [README](../README.md) | [Environment matrix](environment_matrix.md) | [Supabase schema V1](supabase_schema_v1.md) | [Access rules V1](access_rules_v1.md) | [Student memory profile V1](student_memory_profile_v1.md) | [Smoke checklist V1](smoke_checklist_v1.md) | [Founder walkthrough V1](founder_walkthrough_v1.md) | [MVP to-do list](mvp_todo.md) | [Decision log](decision_log.md)

## Purpose

This document defines the deterministic hosted-fixture process used to verify real Supabase RLS behavior for student, parent, tutor, and admin roles.

The goal is to test the policies that are actually deployed, not just read the SQL and assume they work.

## Files

- Seed script: `scripts/seed-rls-fixtures.mjs`
- Verification script: `scripts/verify-rls-fixtures.mjs`
- Shared helpers: `scripts/rls-fixture-shared.mjs`
- Student-flow smoke: `scripts/smoke-student-flow.mjs`
- Memory smoke: `scripts/smoke-memory-profile.mjs`
- Adult-oversight smoke: `scripts/smoke-adult-oversight.mjs`
- Privacy smoke: `scripts/smoke-privacy-controls.mjs`
- Billing smoke: `scripts/smoke-billing-webhook.mjs`
- Tablet-emulation smoke: `scripts/smoke-tablet-emulation.mjs`

## Local Secret

- `SUPABASE_FIXTURE_PASSWORD` lives in local `.env.local` only
- do not commit the actual password
- do not copy this password into Vercel because these scripts are local operator tools, not runtime app features
- `SUPABASE_SERVICE_ROLE_KEY` must be a real Supabase `service_role` or secret key for these scripts to work; an `anon` key in that variable will fail auth-admin operations

## Fixture Accounts

- student: `rls-student@iaduboulot.local`
- parent: `rls-parent@iaduboulot.local`
- tutor: `rls-tutor@iaduboulot.local`
- admin: `rls-admin@iaduboulot.local`

These accounts are deterministic and may be recreated by rerunning the seed script.

They also form the default role-demo set used by the founder walkthrough, with the billing exception documented in [Founder walkthrough V1](founder_walkthrough_v1.md).

## Seeded Data

The seed script creates one safe demo dataset with:

- one `student`, one linked `parent`, one linked `tutor`, and one `admin`
- one conversation with student and assistant messages
- one attachment metadata row in the canonical private bucket
- one workspace state
- one summary per audience: `student`, `parent`, `tutor`
- one tutor note
- one subscription row
- one usage counter row
- one moderation event
- one audit log row
- one memory profile and multiple memory items
- one linked subject resource, one unlinked subject resource, one conversation-resource link, and one chunk per resource

It also ensures the canonical private buckets exist:

- `homework-attachments`
- `processing-artifacts`

## Commands

Run these from the repo root:

```bash
npm run seed:rls-fixtures
npm run verify:rls-fixtures
npm run build
npm run smoke:memory
npm run smoke:privacy
npm run smoke:student-flow
npm run smoke:adult-oversight
npm run smoke:billing
npm run smoke:tablet-emulation
npm run regress:mvp
```

## What Gets Verified

The verification script currently checks that:

- student can read own user, profile, and conversation
- student cannot read parent user rows
- student only sees `student` summaries
- student cannot read tutor notes or subscriptions
- student can create and delete own conversation rows
- parent can read linked child user, profile, conversation, usage counters, and memory items
- parent only sees `parent` summaries
- parent cannot read tutor notes or update child conversations
- tutor can read linked child conversation and own tutor notes
- tutor only sees `tutor` summaries
- tutor cannot read child memory items or usage counters
- tutor can create and delete own tutor notes
- admin can read moderation events, audit logs, and subscriptions
- admin can update a student conversation through RLS-backed authenticated access
- student can read and manage own subject resources, conversation-resource links, and chunks
- parent and tutor can read conversation-linked subject resources and chunks, but not the unlinked subject-library-only resource
- parent cannot update the conversation-resource link selection
- admin can read all fixture subject resources

The student-flow smoke script currently checks that:

- the seeded fixture student can authenticate through the same Supabase SSR cookie shape the app expects
- `POST /api/conversations` creates a new persisted student draft
- `POST /api/uploads/create` plus signed upload plus `POST /api/uploads/confirm` works against the real route flow
- extraction failure now degrades to attachment `failed` plus a warning instead of breaking the upload flow
- `PATCH /api/conversations/[conversationId]/workspace` persists the expected extracted-text state
- `POST /api/conversations/[conversationId]/messages` appends a real turn and falls back to the deterministic coach if Gemini fails
- `POST /api/conversations/[conversationId]/complete` returns only the student-visible summary and keeps completion available through a deterministic student-summary fallback
- the completed conversation becomes read-only for new student turns
- audit rows persist, summary visibility stays student-only on the response, and any missing adult summary variants are reported as warnings instead of hiding the successful student flow

The adult-oversight smoke script currently checks that:

- parent student-detail and session-review pages render through the real `/app` route tree
- parent conversation reads stay filtered to `parent` summaries only
- parent cannot create tutor private notes
- tutor student-detail and session-review pages render through the real `/app` route tree
- tutor conversation reads stay filtered to `tutor` summaries only
- tutor private notes create, update, and delete through the canonical routes
- admin can read the sensitive access feed and the `/app/audit` page after those events

The memory smoke script currently checks that:

- the seeded fixture student dashboard renders the memory panel through the real `/app` page
- `POST /api/conversations/[conversationId]/complete` refreshes memory without blocking completion
- `GET /api/students/[studentId]/memory` returns the current snapshot for the student
- `PATCH /api/students/[studentId]/memory` supports create, update, and delete for safe manual items
- the linked-parent student detail page renders the same memory panel
- tutor raw-memory access through the canonical memory route stays denied

The billing smoke script currently checks that:

- the parent-authenticated billing checkout route fails cleanly with `503` while the smoke intentionally blanks local Lemon checkout config
- a signed Lemon webhook can persist a subscription row through the real webhook route
- the parent dashboard surfaces the synced billing state after that webhook

The privacy smoke script currently checks that:

- the parent settings page renders through the real `/app/settings` route
- a linked parent can queue child deletion through the canonical privacy route
- the child account is marked `deletion_requested`
- tutor access is revoked immediately for that child
- the deletion-requested child is redirected back to `/app/settings`
- the deletion-requested child cannot create a new conversation

The tablet-emulation smoke script currently checks that:

- the seeded fixture student can authenticate through the same Supabase SSR cookie shape the app expects
- a local production-build `next start` instance is started automatically when no URL override is provided
- `/app`, the subject-level homework launcher on `/app?view=homework&subject=...`, and `/app/conversations/[conversationId]` render in portrait and landscape tablet viewports without horizontal overflow
- key student controls stay reachable and the tracked critical controls meet the `44x44` tap-target floor
- screenshots are written for later review while real iPad Safari remains a separate required manual step

## Safety Rules

- use only safe fictional demo content
- treat the seed script as destructive for matching fixture rows and auth accounts
- rerun the seed script before verification if schema or policy changes touched fixture tables
- rerun the verification script after any schema, RLS, or server-authorization change
- if a fixture account leaks beyond the development team, rotate the local password and reseed
- if the scripts fail with `not_admin`, replace `SUPABASE_SERVICE_ROLE_KEY` with the correct Supabase admin key before retrying

## Latest Result

- 2026-03-10 hosted reseed: success
- 2026-03-10 hosted verification: `17` checks passed, `0` failed
- 2026-03-11 local student-flow smoke: success against a temporary local `next start` instance
- 2026-03-11 local memory smoke: success against a temporary local `next start` instance for student dashboard memory, parent linked-student memory, manual mutations, and tutor raw-memory denial
- 2026-03-11 local student-flow smoke warnings: the latest pass completed successfully with optional adult summary variants missing in that run, and earlier passes have also exercised the Gemini fallback paths now kept in the student contract
- 2026-03-11 local adult-oversight smoke: success against a temporary local `next start` instance across parent, tutor, and admin routes
- 2026-03-11 local privacy smoke: success against a temporary local `next start` instance for `/app/settings`, linked-child deletion queueing, tutor-link revocation, redirect-to-settings behavior, and write blocking after deletion request
- 2026-03-11 local billing smoke: success against a temporary local `next start` instance for checkout-config failure handling, signed webhook sync, and parent dashboard billing visibility
- 2026-03-11 local tablet-emulation smoke: success against a temporary local `next start` instance for `/app`, the subject-level homework launcher on `/app?view=homework&subject=...`, and `/app/conversations/[conversationId]`, with no horizontal overflow or detected sub-`44x44` controls on those checked student surfaces
- 2026-03-11 local `npm run regress:mvp`: success across typecheck, lint, build, deterministic fixture reseed, hosted RLS verification, and the full non-device smoke suite
- 2026-03-11 deployed billing verification: success on `https://ia-du-boulot.vercel.app` with real Lemon test-mode checkout open, completed payment, redirect back to `/app`, parent dashboard subscription visibility, Lemon confirmation email, and Lemon dashboard order logging
- 2026-04-29 hosted subject-resource migration push: success for `20260428000500`, `20260428000600`, and the recursion-fix migration `20260429000700`
- 2026-04-29 hosted reseed: success with linked and unlinked subject-resource fixtures
- 2026-04-29 hosted RLS verification: `20` checks passed, `0` failed, including subject-resource, conversation-resource-link, and chunk visibility

## Scope Notes

- `A1.4.1` is satisfied by the deterministic hosted fixture set
- `A1.4.3` is satisfied by this documented credential and demo-data workflow
- `A1.2.4` is satisfied by the successful hosted verification run
- `A7.2.3` now uses `npm run regress:mvp` as the canonical pre-demo regression pass
- `A1.4.2` remains open because the fixture currently seeds attachment metadata, not a committed sample file corpus
