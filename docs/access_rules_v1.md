# Access Rules V1

Related: [README](../README.md) | [Role and access matrix](role_access_matrix.md) | [Supabase schema V1](supabase_schema_v1.md) | [RLS migration](../supabase/migrations/20260310000200_access_rules_and_rls.sql)

## Purpose

This document translates the product role matrix into direct database access rules for Supabase.

Important:

- these rules describe direct database access through authenticated app clients
- some product behaviors will still use server-side or service-role operations later
- when in doubt, the direct database layer is intentionally more restrictive than the eventual product UX

## Table-By-Table Rules

| Table | Select | Insert | Update | Delete | Notes |
| --- | --- | --- | --- | --- | --- |
| `users` | own row, linked child row, admin | self row only, admin | admin only | admin only | direct self-profile updates stay server-controlled for now |
| `student_profiles` | own row, linked child row, admin | own row, admin | own row, admin | own row, admin | parent read only at DB level |
| `parent_student_links` | linked parent, linked student, admin | parent owner, admin | parent owner, admin | parent owner, admin | student can read but not mutate |
| `tutor_student_links` | linked tutor, linked student, linked parent, admin | tutor, student, linked parent, admin | tutor, linked parent, admin | tutor, linked parent, admin | parent approval path stays possible |
| `conversations` | student owner, linked parent, linked tutor, admin | student owner, admin | student owner, admin | student owner, admin | parent and tutor are review-only |
| `messages` | anyone who can read the conversation, admin | student author in own conversation, admin | student author in own conversation, admin | student author in own conversation, admin | assistant/system writes are expected from server or service role |
| `attachments` | anyone who can read the conversation, admin | student uploader in own conversation, admin | student uploader in own conversation, admin | student uploader in own conversation, admin | storage cleanup remains a backend job |
| `subject_resources` | student owner, admin, or visible conversation link | student owner, admin or service role | student owner, admin or service role | student owner, admin or service role | parent/tutor visibility comes only through `conversation_resource_links`; full subject library is not adult-browseable |
| `conversation_resource_links` | anyone who can read the linked conversation, admin | student owner of linked conversation/resource, admin or service role | student owner of linked conversation/resource, admin or service role | student owner of linked conversation/resource, admin or service role | deleting a link removes coach retrieval and adult/tutor visibility for that conversation |
| `subject_resource_chunks` | student owner, admin, or visible conversation link | student owner, admin or service role | student owner, admin or service role | student owner, admin or service role | cascades when the subject resource is deleted |
| `workspace_states` | anyone who can read the conversation, admin | student owner, admin | student owner, admin | student owner, admin | parent and tutor stay read-only |
| `session_summaries` | role-matched summary audience, admin | admin or service role | admin or service role | admin or service role | student sees student summary, parent sees parent summary, tutor sees tutor summary |
| `tutor_notes` | owning tutor, admin | owning tutor, admin | owning tutor, admin | owning tutor, admin | hidden from student and parent |
| `subscriptions` | payer, admin | admin or service role | admin or service role | admin or service role | billing writes should come from backend/webhooks |
| `usage_counters` | student, linked parent, admin | admin or service role | admin or service role | admin or service role | tutor does not read raw usage counters by default |
| `moderation_events` | admin only | admin or service role | admin or service role | admin or service role | operational surface only |
| `audit_logs` | admin only | admin or service role | admin or service role | admin or service role | operational surface only |
| `student_memory_profiles` | student, linked parent, admin | admin or service role | admin or service role | admin or service role | tutor sees summary surfaces, not raw memory tables |
| `student_memory_items` | student, linked parent, admin | admin or service role | admin or service role | admin or service role | conservative privacy stance |

## Design Choices

### 1. Browser Access Is Conservative

- parent/tutor review access is allowed where the product promise requires it
- writes that shape billing, moderation, audit, or system-generated content stay server-oriented

### 2. Summary Audiences Stay Segregated

- students see `student` summaries
- parents see `parent` summaries
- tutors see `tutor` summaries

This prevents tutor-only insights from leaking to students or parents by default.

### 3. Raw Memory Access Stays Narrow

- parents can read child memory tables
- tutors do not read raw memory tables in V1
- tutors should consume summary or insight surfaces later instead

## Migration

- SQL migration: [20260310000200_access_rules_and_rls.sql](../supabase/migrations/20260310000200_access_rules_and_rls.sql)
