# Supabase Schema V1

Related: [README](../README.md) | [Implementation plan](implementation_plan.md) | [Role and access matrix](role_access_matrix.md) | [Access rules V1](access_rules_v1.md) | [Invitation flows V1](invitation_flows_v1.md) | [Storage and attachment rules](storage_attachment_rules.md) | [Minors privacy baseline](minors_privacy_baseline.md) | [Initial schema SQL](../supabase/migrations/20260310000100_initial_schema.sql)

## Purpose

This document explains the first Supabase schema draft so future sessions do not have to reverse-engineer intent from raw SQL alone.

## File

- SQL migration: [20260310000100_initial_schema.sql](../supabase/migrations/20260310000100_initial_schema.sql)
- Invitation extension: [20260311000300_account_link_invitations.sql](../supabase/migrations/20260311000300_account_link_invitations.sql)
- Onboarding profile fields: [20260513000100_add_onboarding_profile_fields.sql](../supabase/migrations/20260513000100_add_onboarding_profile_fields.sql)

## Main Decisions

### Auth Identity And App Identity Are Split Cleanly

- `auth.users` remains the Supabase authentication source of truth.
- `public.users` stores app-specific role, status, language, under-13 state, and the small learner registration profile needed for school-context defaults.
- All domain tables reference `public.users`, not `auth.users`, after that entry point.

Why:

- it keeps auth mechanics separate from product logic
- it gives the app a central role/status model for RLS and server authorization later

### Adult Access Is Explicit

- parent access is represented by `parent_student_links`
- tutor access is represented by `tutor_student_links`
- pending parent/tutor acceptance now uses `account_link_invitations`
- the SQL adds role-validation triggers so those links cannot silently point at the wrong user roles

### Invitation State Is Explicit And Auditable

- `account_link_invitations` is the canonical pre-link object for parent approval and tutor access
- raw invite tokens are not stored, only `token_hash`
- the table carries `pending`, `accepted`, `revoked`, and `expired` states
- server routes create and accept these rows; browser table writes are not the canonical path

### Session Data Is Normalized By Responsibility

- `conversations`: session shell and intake metadata
- `messages`: chronological chat turns
- `attachments`: uploaded files and raw extraction output
- `subject_resources`: reusable subject-level uploaded source text promoted from successful PDF extraction
- `subject_resource_chunks`: deterministic text chunks used by selected subject-resource retrieval
- `conversation_resource_links`: explicit links between a conversation and selected subject resources
- `workspace_states`: the editable side-panel state
- `session_summaries`: audience-specific summary outputs

This avoids a single giant session table and keeps later policy logic easier to reason about.

### Privacy And Deletion Shape The Schema

- `users.account_status` includes `pending_parent_approval` and `deletion_requested`
- `users.deletion_requested_at` supports queued purge flows
- `users.birth_date`, `country_of_study`, optional `school_name`, and `grade_level` support the current learner onboarding source of truth; the service derives `age_band` and `is_under_13` from `birth_date`
- learning-content tables cascade from student-owned roots, so purge jobs can delete account content cleanly
- deleting a subject resource cascades its chunks and conversation links; storage cleanup is service-owned because promoted chat attachments and resource-owned uploads have different storage ownership
- `subscriptions`, `audit_logs`, `moderation_events`, and the server-owned `ai_generation_debug_captures` table are structured so limited operational/debug records can survive separately when necessary
- the current successful-coach debug capture schema addition lives in [`supabase/migrations/20260408000400_ai_generation_debug_captures.sql`](../supabase/migrations/20260408000400_ai_generation_debug_captures.sql)
- the first subject-wide resource schema addition lives in [`supabase/migrations/20260428000500_subject_resources.sql`](../supabase/migrations/20260428000500_subject_resources.sql)
- the subject-resource chunk schema addition lives in [`supabase/migrations/20260428000600_subject_resource_chunks.sql`](../supabase/migrations/20260428000600_subject_resource_chunks.sql)
- the subject-resource RLS recursion fix lives in [`supabase/migrations/20260429000700_subject_resource_policy_recursion.sql`](../supabase/migrations/20260429000700_subject_resource_policy_recursion.sql)

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
