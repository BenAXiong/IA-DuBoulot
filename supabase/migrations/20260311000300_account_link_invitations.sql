-- A2.2.2 canonical invitation objects for parent approval and tutor linkage.
-- These rows are created and consumed by server-side routes, not direct browser writes.

create type public.invitation_kind as enum (
  'parent_approval',
  'parent_link',
  'tutor_link'
);

create type public.invitation_status as enum (
  'pending',
  'accepted',
  'revoked',
  'expired'
);

create table public.account_link_invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  invitation_kind public.invitation_kind not null,
  invitation_status public.invitation_status not null default 'pending',
  student_user_id uuid not null references public.users(id) on delete cascade,
  inviter_user_id uuid not null references public.users(id) on delete cascade,
  target_role public.app_role not null,
  target_email text not null,
  relationship_label text,
  token_hash text not null unique,
  accepted_by_user_id uuid references public.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (
      invitation_kind in ('parent_approval', 'parent_link')
      and target_role = 'parent'
    )
    or (
      invitation_kind = 'tutor_link'
      and target_role = 'tutor'
    )
  ),
  check (target_email <> ''),
  check (expires_at > created_at)
);

create index account_link_invitations_student_status_idx
  on public.account_link_invitations (student_user_id, invitation_status);

create index account_link_invitations_target_email_idx
  on public.account_link_invitations (target_email, invitation_status);

create index account_link_invitations_expires_at_idx
  on public.account_link_invitations (expires_at);

create trigger set_account_link_invitations_updated_at
before update on public.account_link_invitations
for each row execute function public.set_updated_at();

alter table public.account_link_invitations enable row level security;

drop policy if exists account_link_invitations_admin_only on public.account_link_invitations;
create policy account_link_invitations_admin_only
on public.account_link_invitations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
