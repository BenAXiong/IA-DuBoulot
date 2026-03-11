# RLS Fixture Verification

Related: [README](../README.md) | [Environment matrix](environment_matrix.md) | [Supabase schema V1](supabase_schema_v1.md) | [Access rules V1](access_rules_v1.md) | [MVP to-do list](mvp_todo.md) | [Decision log](decision_log.md)

## Purpose

This document defines the deterministic hosted-fixture process used to verify real Supabase RLS behavior for student, parent, tutor, and admin roles.

The goal is to test the policies that are actually deployed, not just read the SQL and assume they work.

## Files

- Seed script: `scripts/seed-rls-fixtures.mjs`
- Verification script: `scripts/verify-rls-fixtures.mjs`
- Shared helpers: `scripts/rls-fixture-shared.mjs`
- Student-flow smoke: `scripts/smoke-student-flow.mjs`
- Adult-oversight smoke: `scripts/smoke-adult-oversight.mjs`
- Billing smoke: `scripts/smoke-billing-webhook.mjs`

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

It also ensures the canonical private buckets exist:

- `homework-attachments`
- `processing-artifacts`

## Commands

Run these from the repo root:

```bash
npm run seed:rls-fixtures
npm run verify:rls-fixtures
npm run build
npm run smoke:student-flow
npm run smoke:adult-oversight
npm run smoke:billing
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

The billing smoke script currently checks that:

- the parent-authenticated billing checkout route fails cleanly with `503` while local Lemon checkout config is still blank
- a signed Lemon webhook can persist a subscription row through the real webhook route
- the parent dashboard surfaces the synced billing state after that webhook

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
- 2026-03-11 local student-flow smoke warnings: Gemini extraction, coach, and student-summary fallbacks were exercised in the latest pass, and adult summary variants were missing in that run because those derivations are now best-effort
- 2026-03-11 local adult-oversight smoke: success against a temporary local `next start` instance across parent, tutor, and admin routes
- 2026-03-11 local billing smoke: success against a temporary local `next start` instance for checkout-config failure handling, signed webhook sync, and parent dashboard billing visibility

## Scope Notes

- `A1.4.1` is satisfied by the deterministic hosted fixture set
- `A1.4.3` is satisfied by this documented credential and demo-data workflow
- `A1.2.4` is satisfied by the successful hosted verification run
- `A1.4.2` remains open because the fixture currently seeds attachment metadata, not a committed sample file corpus
