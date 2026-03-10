-- A1.2 access rules and RLS policies for IA DuBoulot.
-- These policies intentionally keep direct browser writes conservative.
-- Service-role operations remain responsible for privileged backend flows.

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select u.role
  from public.users u
  where u.id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(public.current_app_role() = 'admin', false)
$$;

create or replace function public.is_active_parent_of(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.parent_student_links p
    where p.parent_user_id = auth.uid()
      and p.student_user_id = target_student_id
      and p.link_status = 'active'
  )
$$;

create or replace function public.is_active_tutor_of(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.tutor_student_links t
    where t.tutor_user_id = auth.uid()
      and t.student_user_id = target_student_id
      and t.link_status = 'active'
  )
$$;

create or replace function public.can_view_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    auth.uid() = target_user_id
    or public.is_admin()
    or public.is_active_parent_of(target_user_id)
    or public.is_active_tutor_of(target_user_id)
$$;

create or replace function public.can_manage_student_owned_data(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() = target_student_id or public.is_admin()
$$;

create or replace function public.can_view_parent_student_link(
  target_parent_user_id uuid,
  target_student_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    auth.uid() = target_parent_user_id
    or auth.uid() = target_student_user_id
    or public.is_admin()
$$;

create or replace function public.can_manage_parent_student_link(
  target_parent_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() = target_parent_user_id or public.is_admin()
$$;

create or replace function public.can_view_tutor_student_link(
  target_tutor_user_id uuid,
  target_student_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    auth.uid() = target_tutor_user_id
    or auth.uid() = target_student_user_id
    or public.is_active_parent_of(target_student_user_id)
    or public.is_admin()
$$;

create or replace function public.can_request_tutor_student_link(
  target_tutor_user_id uuid,
  target_student_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    auth.uid() = target_tutor_user_id
    or auth.uid() = target_student_user_id
    or public.is_active_parent_of(target_student_user_id)
    or public.is_admin()
$$;

create or replace function public.can_manage_tutor_student_link(
  target_tutor_user_id uuid,
  target_student_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    auth.uid() = target_tutor_user_id
    or public.is_active_parent_of(target_student_user_id)
    or public.is_admin()
$$;

create or replace function public.can_view_conversation(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = target_conversation_id
      and public.can_view_user(c.student_user_id)
  )
$$;

create or replace function public.can_manage_conversation(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = target_conversation_id
      and public.can_manage_student_owned_data(c.student_user_id)
  )
$$;

create or replace function public.can_view_summary(
  target_conversation_id uuid,
  target_audience public.summary_audience
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = target_conversation_id
      and (
        public.is_admin()
        or (auth.uid() = c.student_user_id and target_audience = 'student')
        or (public.is_active_parent_of(c.student_user_id) and target_audience = 'parent')
        or (public.is_active_tutor_of(c.student_user_id) and target_audience = 'tutor')
      )
  )
$$;

create or replace function public.can_view_tutor_note(
  target_tutor_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() = target_tutor_user_id or public.is_admin()
$$;

create or replace function public.can_view_subscription(target_payer_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select auth.uid() = target_payer_user_id or public.is_admin()
$$;

create or replace function public.can_view_usage_counter(target_student_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    auth.uid() = target_student_user_id
    or public.is_active_parent_of(target_student_user_id)
    or public.is_admin()
$$;

create or replace function public.can_view_memory(target_student_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    auth.uid() = target_student_user_id
    or public.is_active_parent_of(target_student_user_id)
    or public.is_admin()
$$;

drop policy if exists users_select on public.users;
create policy users_select
on public.users
for select
to authenticated
using (public.can_view_user(id));

drop policy if exists users_insert_self on public.users;
create policy users_insert_self
on public.users
for insert
to authenticated
with check (
  id = auth.uid()
  and role in ('student', 'parent', 'tutor')
);

drop policy if exists users_admin_manage on public.users;
create policy users_admin_manage
on public.users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists student_profiles_select on public.student_profiles;
create policy student_profiles_select
on public.student_profiles
for select
to authenticated
using (public.can_view_user(student_user_id));

drop policy if exists student_profiles_student_manage on public.student_profiles;
create policy student_profiles_student_manage
on public.student_profiles
for all
to authenticated
using (public.can_manage_student_owned_data(student_user_id))
with check (public.can_manage_student_owned_data(student_user_id));

drop policy if exists parent_student_links_select on public.parent_student_links;
create policy parent_student_links_select
on public.parent_student_links
for select
to authenticated
using (public.can_view_parent_student_link(parent_user_id, student_user_id));

drop policy if exists parent_student_links_manage on public.parent_student_links;
create policy parent_student_links_manage
on public.parent_student_links
for all
to authenticated
using (public.can_manage_parent_student_link(parent_user_id))
with check (public.can_manage_parent_student_link(parent_user_id));

drop policy if exists tutor_student_links_select on public.tutor_student_links;
create policy tutor_student_links_select
on public.tutor_student_links
for select
to authenticated
using (public.can_view_tutor_student_link(tutor_user_id, student_user_id));

drop policy if exists tutor_student_links_insert on public.tutor_student_links;
create policy tutor_student_links_insert
on public.tutor_student_links
for insert
to authenticated
with check (
  public.can_request_tutor_student_link(tutor_user_id, student_user_id)
);

drop policy if exists tutor_student_links_update_delete on public.tutor_student_links;
create policy tutor_student_links_update_delete
on public.tutor_student_links
for update
to authenticated
using (public.can_manage_tutor_student_link(tutor_user_id, student_user_id))
with check (public.can_manage_tutor_student_link(tutor_user_id, student_user_id));

drop policy if exists tutor_student_links_delete on public.tutor_student_links;
create policy tutor_student_links_delete
on public.tutor_student_links
for delete
to authenticated
using (public.can_manage_tutor_student_link(tutor_user_id, student_user_id));

drop policy if exists conversations_select on public.conversations;
create policy conversations_select
on public.conversations
for select
to authenticated
using (public.can_view_user(student_user_id));

drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert
on public.conversations
for insert
to authenticated
with check (
  public.is_admin()
  or (
    student_user_id = auth.uid()
    and created_by_user_id = auth.uid()
  )
);

drop policy if exists conversations_update_delete on public.conversations;
create policy conversations_update_delete
on public.conversations
for update
to authenticated
using (public.can_manage_student_owned_data(student_user_id))
with check (public.can_manage_student_owned_data(student_user_id));

drop policy if exists conversations_delete on public.conversations;
create policy conversations_delete
on public.conversations
for delete
to authenticated
using (public.can_manage_student_owned_data(student_user_id));

drop policy if exists messages_select on public.messages;
create policy messages_select
on public.messages
for select
to authenticated
using (public.can_view_conversation(conversation_id));

drop policy if exists messages_insert_student on public.messages;
create policy messages_insert_student
on public.messages
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.can_manage_conversation(conversation_id)
    and author_user_id = auth.uid()
    and role = 'student'
  )
);

drop policy if exists messages_update_student on public.messages;
create policy messages_update_student
on public.messages
for update
to authenticated
using (
  public.is_admin()
  or (
    public.can_manage_conversation(conversation_id)
    and author_user_id = auth.uid()
    and role = 'student'
  )
)
with check (
  public.is_admin()
  or (
    public.can_manage_conversation(conversation_id)
    and author_user_id = auth.uid()
    and role = 'student'
  )
);

drop policy if exists messages_delete_student on public.messages;
create policy messages_delete_student
on public.messages
for delete
to authenticated
using (
  public.is_admin()
  or (
    public.can_manage_conversation(conversation_id)
    and author_user_id = auth.uid()
    and role = 'student'
  )
);

drop policy if exists attachments_select on public.attachments;
create policy attachments_select
on public.attachments
for select
to authenticated
using (public.can_view_conversation(conversation_id));

drop policy if exists attachments_insert on public.attachments;
create policy attachments_insert
on public.attachments
for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.can_manage_conversation(conversation_id)
    and uploaded_by_user_id = auth.uid()
  )
);

drop policy if exists attachments_update on public.attachments;
create policy attachments_update
on public.attachments
for update
to authenticated
using (
  public.is_admin()
  or (
    public.can_manage_conversation(conversation_id)
    and uploaded_by_user_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or (
    public.can_manage_conversation(conversation_id)
    and uploaded_by_user_id = auth.uid()
  )
);

drop policy if exists attachments_delete on public.attachments;
create policy attachments_delete
on public.attachments
for delete
to authenticated
using (
  public.is_admin()
  or (
    public.can_manage_conversation(conversation_id)
    and uploaded_by_user_id = auth.uid()
  )
);

drop policy if exists workspace_states_select on public.workspace_states;
create policy workspace_states_select
on public.workspace_states
for select
to authenticated
using (public.can_view_conversation(conversation_id));

drop policy if exists workspace_states_manage on public.workspace_states;
create policy workspace_states_manage
on public.workspace_states
for all
to authenticated
using (public.can_manage_conversation(conversation_id))
with check (
  public.can_manage_conversation(conversation_id)
  and (
    last_saved_by_user_id is null
    or last_saved_by_user_id = auth.uid()
    or public.is_admin()
  )
);

drop policy if exists session_summaries_select on public.session_summaries;
create policy session_summaries_select
on public.session_summaries
for select
to authenticated
using (public.can_view_summary(conversation_id, audience));

drop policy if exists session_summaries_admin_manage on public.session_summaries;
create policy session_summaries_admin_manage
on public.session_summaries
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists tutor_notes_select on public.tutor_notes;
create policy tutor_notes_select
on public.tutor_notes
for select
to authenticated
using (public.can_view_tutor_note(tutor_user_id));

drop policy if exists tutor_notes_manage on public.tutor_notes;
create policy tutor_notes_manage
on public.tutor_notes
for all
to authenticated
using (public.can_view_tutor_note(tutor_user_id))
with check (public.can_view_tutor_note(tutor_user_id));

drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select
on public.subscriptions
for select
to authenticated
using (
  payer_user_id is not null
  and public.can_view_subscription(payer_user_id)
);

drop policy if exists subscriptions_admin_manage on public.subscriptions;
create policy subscriptions_admin_manage
on public.subscriptions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists usage_counters_select on public.usage_counters;
create policy usage_counters_select
on public.usage_counters
for select
to authenticated
using (public.can_view_usage_counter(student_user_id));

drop policy if exists usage_counters_admin_manage on public.usage_counters;
create policy usage_counters_admin_manage
on public.usage_counters
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists moderation_events_admin_only on public.moderation_events;
create policy moderation_events_admin_only
on public.moderation_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists audit_logs_admin_only on public.audit_logs;
create policy audit_logs_admin_only
on public.audit_logs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists student_memory_profiles_select on public.student_memory_profiles;
create policy student_memory_profiles_select
on public.student_memory_profiles
for select
to authenticated
using (public.can_view_memory(student_user_id));

drop policy if exists student_memory_profiles_admin_manage on public.student_memory_profiles;
create policy student_memory_profiles_admin_manage
on public.student_memory_profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists student_memory_items_select on public.student_memory_items;
create policy student_memory_items_select
on public.student_memory_items
for select
to authenticated
using (public.can_view_memory(student_user_id));

drop policy if exists student_memory_items_admin_manage on public.student_memory_items;
create policy student_memory_items_admin_manage
on public.student_memory_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
