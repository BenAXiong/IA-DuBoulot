# Invitation Flows V1

Related: [README](../README.md) | [API route map](api_route_map.md) | [Service interfaces](service_interfaces.md) | [Role and access matrix](role_access_matrix.md) | [Minors privacy baseline](minors_privacy_baseline.md) | [Supabase schema V1](supabase_schema_v1.md) | [MVP to-do list](mvp_todo.md)

## Purpose

This document defines the first canonical invitation and approval flow for:

- under-13 parent approval
- parent-linked adult access
- tutor linkage

The goal is to keep invitation state explicit, auditable, and queryable instead of burying it inside ad hoc auth metadata or unsigned query params.

## Canonical Data Object

Migration:

- [20260311_000003_account_link_invitations.sql](../supabase/migrations/20260311_000003_account_link_invitations.sql)

Table:

- `public.account_link_invitations`

Core fields:

- `invitation_kind`: `parent_approval`, `parent_link`, `tutor_link`
- `invitation_status`: `pending`, `accepted`, `revoked`, `expired`
- `student_user_id`
- `inviter_user_id`
- `target_role`
- `target_email`
- `token_hash`
- `expires_at`
- `accepted_by_user_id`
- `metadata`

Rules:

- only parent-targeted invitation kinds may target role `parent`
- only `tutor_link` may target role `tutor`
- raw token values are never stored, only `token_hash`
- direct browser table access is not the canonical path; server routes own creation and acceptance

## Current Implemented Surfaces

Routes:

- `POST /api/auth/parent-approval/request`
- `POST /api/auth/parent-approval/confirm`
- `POST /api/auth/invitations/accept`
- `POST /api/tutor/links`

Pages:

- `/invite/[token]`
- `/auth`
- `/auth/complete`
- `/onboarding`
- `/app`

Server modules:

- `lib/server/links/invitation-service.ts`
- `lib/server/links/types.ts`

UI modules:

- `components/links/parent-approval-request-form.tsx`
- `components/links/tutor-invite-form.tsx`
- `components/links/invitation-accept-panel.tsx`

## Flow Definitions

### 1. Under-13 Parent Approval

1. Under-13 student completes bootstrap and lands in `pending_parent_approval`.
2. Student uses `POST /api/auth/parent-approval/request` with parent email.
3. Server creates one `account_link_invitations` row and returns a shareable `/invite/[token]` URL.
4. Parent creates or signs into a `parent` account.
5. Parent finishes onboarding if needed.
6. Parent accepts via `POST /api/auth/parent-approval/confirm`.
7. Server:
- upserts `parent_student_links`
- sets `student_profiles.parent_approved_at`
- activates the child `public.users.account_status`
- syncs the child auth metadata from the canonical app profile
- marks the invitation `accepted`

### 2. Tutor Link Invitation

1. Eligible actor creates a tutor invite with `POST /api/tutor/links`.
2. Server creates one `account_link_invitations` row and returns a shareable `/invite/[token]` URL.
3. Tutor creates or signs into a `tutor` account.
4. Tutor finishes onboarding if needed.
5. Tutor accepts via `POST /api/auth/invitations/accept`.
6. Server upserts `tutor_student_links` and marks the invitation `accepted`.

Eligibility rules in V1:

- a 13+ student may invite a tutor for self
- a linked parent may invite a tutor for a linked child
- an under-13 student may not directly invite a tutor
- under-13 tutor access must originate from an active parent link

## Invite Delivery Rule In V1

The product now creates canonical invitation URLs, but it does not yet send them through a transactional email provider.

Current behavior:

- the route returns `inviteUrl`
- the current UI exposes that URL for copy/share
- acceptance and auditing work immediately once the recipient opens the link

Why:

- this delivers the access-control and traceability core now
- it avoids coupling link-state correctness to unfinished email-provider work

Follow-up:

- wire provider-backed delivery later through Resend or another dedicated mail path

## Auth Template And Recovery Behavior

The baseline Supabase confirm-signup email template that points to:

- `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

is correct for the current SSR confirmation route.

Current recovery behavior:

- the email template still does not preserve invite-specific `next` redirects by itself
- the product now stores the pending invite token in the browser before signup and uses `/auth/complete` as a post-confirm bridge
- this means same-browser confirmation can recover back to `/invite/[token]` automatically even when the email template is generic

Remaining caveat:

- cross-browser or cross-device confirmation still loses the local pending-invite cookie
- in that case the recipient may still need to reopen the original `/invite/[token]` link after confirming email

Validation note:

- same-browser recovery was verified on 2026-03-11 in a local browser pass against the live auth flow using a real tutor invitation and confirmation-token handoff

## Audit Expectations

These events should remain auditable:

- parent approval request creation
- tutor invitation creation
- invitation acceptance
- resulting parent/tutor link activation

Runtime logs may include invite domain and status metadata, but should not log raw invitation tokens.

## Known Follow-Ups

- add provider-backed invite email delivery
- add parent dashboard issuance for tutor invites against linked children
- add invitation cleanup jobs for expired and stale pending rows
- decide whether cross-device invite recovery is worth adding before beta
- decide whether future parent-link flows should reuse `parent_link` or stay inside dedicated parent dashboards only
