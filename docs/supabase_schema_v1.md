# Supabase Schema V1

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [Role and access matrix](role_access_matrix.md) | [Access rules V1](access_rules_v1.md) | [Storage and attachment rules](storage_attachment_rules.md) | [Minors privacy baseline](minors_privacy_baseline.md) | [Initial schema SQL](../supabase/migrations/20260310_000001_initial_schema.sql)

## Purpose

This document explains the first Supabase schema draft so future sessions do not have to reverse-engineer intent from raw SQL alone.

## File

- SQL migration: [20260310_000001_initial_schema.sql](../supabase/migrations/20260310_000001_initial_schema.sql)

## Main Decisions

### Auth Identity And App Identity Are Split Cleanly

- `auth.users` remains the Supabase authentication source of truth.
- `public.users` stores app-specific role, status, language, and under-13 state.
- All domain tables reference `public.users`, not `auth.users`, after that entry point.

Why:

- it keeps auth mechanics separate from product logic
- it gives the app a central role/status model for RLS and server authorization later

### Adult Access Is Explicit

- parent access is represented by `parent_student_links`
- tutor access is represented by `tutor_student_links`
- the SQL adds role-validation triggers so those links cannot silently point at the wrong user roles

### Session Data Is Normalized By Responsibility

- `conversations`: session shell and intake metadata
- `messages`: chronological chat turns
- `attachments`: uploaded files and raw extraction output
- `workspace_states`: the editable side-panel state
- `session_summaries`: audience-specific summary outputs

This avoids a single giant session table and keeps later policy logic easier to reason about.

### Privacy And Deletion Shape The Schema

- `users.account_status` includes `pending_parent_approval` and `deletion_requested`
- `users.deletion_requested_at` supports queued purge flows
- learning-content tables cascade from student-owned roots, so purge jobs can delete account content cleanly
- `subscriptions`, `audit_logs`, and `moderation_events` are structured so limited operational records can survive separately when necessary

### RLS Is Enabled Immediately

- the migration enables Row Level Security on every app table in `public`
- no policies are created yet, so browser access remains effectively closed until `A1.2`

Why:

- raw SQL tables in Supabase do not auto-enable RLS the way dashboard-created tables often do
- enabling RLS now is safer than trying to remember it later

### Memory Is Split Into Profile And Items

- `student_memory_profiles` keeps compact rollups
- `student_memory_items` stores discrete strengths, weaknesses, preferences, and topics with expirations and source references

## What This Migration Does Not Do Yet

- no RLS policies yet
- no storage buckets yet
- no auth triggers yet for auto-creating `public.users`
- no seed data yet
- no API contracts yet

Those belong to `A1.2`, `A1.4`, and `A1.3`.

## Review Result

This draft was reviewed against:

- [role_access_matrix.md](role_access_matrix.md)
- [minors_privacy_baseline.md](minors_privacy_baseline.md)
- the table list and scope in [project_brief_codex.txt](../project_brief_codex.txt)

## Known Follow-Ups

- write RLS table-by-table before exposing any table through the app
- decide whether `parent` should see tutor notes in any narrow admin or escalation case later
- implement the bucket plan and route/service rules documented in [storage_attachment_rules.md](storage_attachment_rules.md)
- add seed fixtures covering student, parent, tutor, and admin flows
