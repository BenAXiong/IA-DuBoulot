# RLS Fixture Verification

Related: [README](../README.md) | [Environment matrix](environment_matrix.md) | [Supabase schema V1](supabase_schema_v1.md) | [Access rules V1](access_rules_v1.md) | [MVP to-do list](mvp_todo.md) | [Decision log](decision_log.md)

## Purpose

This document defines the deterministic hosted-fixture process used to verify real Supabase RLS behavior for student, parent, tutor, and admin roles.

The goal is to test the policies that are actually deployed, not just read the SQL and assume they work.

## Files

- Seed script: `scripts/seed-rls-fixtures.mjs`
- Verification script: `scripts/verify-rls-fixtures.mjs`
- Shared helpers: `scripts/rls-fixture-shared.mjs`

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

## Safety Rules

- use only safe fictional demo content
- treat the seed script as destructive for matching fixture rows and auth accounts
- rerun the seed script before verification if schema or policy changes touched fixture tables
- rerun the verification script after any schema, RLS, or server-authorization change
- if a fixture account leaks beyond the development team, rotate the local password and reseed
- if the scripts fail with `not_admin`, replace `SUPABASE_SERVICE_ROLE_KEY` with the correct Supabase admin key before retrying

## Scope Notes

- `A1.4.1` will be complete after the first successful hosted reseed
- `A1.4.3` is satisfied by this documented credential and demo-data workflow
- `A1.2.4` will be complete after the first successful hosted verification run
- `A1.4.2` remains open because the fixture currently seeds attachment metadata, not a committed sample file corpus
