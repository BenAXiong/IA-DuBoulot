-- A1.1 initial Supabase schema draft for IA DuBoulot.
-- This migration defines the core relational model only.
-- RLS policies and auth route wiring come in A1.2 and A2.2.

create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('student', 'parent', 'tutor', 'admin');
create type public.account_status as enum (
  'pending_parent_approval',
  'active',
  'suspended',
  'deletion_requested'
);
create type public.link_status as enum ('pending', 'active', 'revoked');
create type public.conversation_status as enum ('active', 'completed', 'archived');
create type public.message_role as enum ('student', 'assistant', 'system');
create type public.attachment_kind as enum ('image', 'screenshot', 'pdf', 'document');
create type public.extraction_status as enum ('pending', 'ready', 'failed');
create type public.summary_audience as enum ('student', 'parent', 'tutor');
create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired'
);
create type public.moderation_status as enum ('allowed', 'flagged', 'blocked');
create type public.moderation_source as enum ('user_input', 'assistant_output', 'attachment_extraction');
create type public.memory_category as enum ('strength', 'weakness', 'preference', 'topic', 'learning_note');
create type public.age_band as enum ('six_eight', 'nine_ten', 'eleven_twelve', 'thirteen_fifteen', 'sixteen_eighteen');

create domain public.ui_language_code as text
  check (value in ('fr', 'en', 'zh'));

create domain public.ai_language_code as text
  check (value in ('fr', 'en'));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.assert_user_role(
  subject_user_id uuid,
  expected_role public.app_role,
  field_name text
)
returns void
language plpgsql
as $$
declare
  actual_role public.app_role;
begin
  select role
  into actual_role
  from public.users
  where id = subject_user_id;

  if actual_role is null then
    raise exception '% must reference an existing app user', field_name;
  end if;

  if actual_role <> expected_role then
    raise exception '% must reference a % user', field_name, expected_role;
  end if;
end;
$$;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  account_status public.account_status not null default 'active',
  display_name text not null,
  preferred_ui_language public.ui_language_code not null default 'fr',
  ai_help_language public.ai_language_code not null default 'fr',
  age_band public.age_band,
  is_under_13 boolean not null default false,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    is_under_13 = false
    or age_band in ('six_eight', 'nine_ten', 'eleven_twelve')
  )
);

create table public.student_profiles (
  student_user_id uuid primary key references public.users(id) on delete cascade,
  current_grade_level text,
  preferred_help_style text,
  recurring_subjects text[] not null default '{}',
  parental_approval_required boolean not null default false,
  parent_approved_at timestamptz,
  learning_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.parent_student_links (
  id uuid primary key default extensions.gen_random_uuid(),
  parent_user_id uuid not null references public.users(id) on delete cascade,
  student_user_id uuid not null references public.users(id) on delete cascade,
  link_status public.link_status not null default 'active',
  relationship_label text,
  approved_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (parent_user_id, student_user_id),
  check (parent_user_id <> student_user_id)
);

create table public.tutor_student_links (
  id uuid primary key default extensions.gen_random_uuid(),
  tutor_user_id uuid not null references public.users(id) on delete cascade,
  student_user_id uuid not null references public.users(id) on delete cascade,
  approved_by_parent_user_id uuid references public.users(id) on delete set null,
  link_status public.link_status not null default 'pending',
  approved_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tutor_user_id, student_user_id),
  check (tutor_user_id <> student_user_id)
);

create table public.conversations (
  id uuid primary key default extensions.gen_random_uuid(),
  student_user_id uuid not null references public.users(id) on delete cascade,
  created_by_user_id uuid not null references public.users(id) on delete restrict,
  title text not null,
  subject_tag text not null,
  status public.conversation_status not null default 'active',
  graded_homework boolean not null default true,
  assignment_text text,
  edited_extracted_text text,
  source_language public.ui_language_code,
  last_message_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.messages (
  id uuid primary key default extensions.gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_user_id uuid references public.users(id) on delete set null,
  role public.message_role not null,
  content_text text not null,
  content_language public.ui_language_code,
  model_provider text,
  model_name text,
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  moderation_status public.moderation_status not null default 'allowed',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.attachments (
  id uuid primary key default extensions.gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  uploaded_by_user_id uuid not null references public.users(id) on delete restrict,
  storage_bucket text not null,
  storage_path text not null,
  attachment_kind public.attachment_kind not null,
  mime_type text not null,
  original_filename text not null,
  byte_size bigint not null check (byte_size > 0),
  page_count integer check (page_count is null or page_count > 0),
  extraction_status public.extraction_status not null default 'pending',
  raw_extracted_text text,
  source_language public.ui_language_code,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (storage_bucket, storage_path)
);

create table public.workspace_states (
  id uuid primary key default extensions.gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations(id) on delete cascade,
  assignment_text text,
  edited_extracted_text text,
  plan_text text,
  draft_answer_text text,
  student_notes text,
  last_saved_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.session_summaries (
  id uuid primary key default extensions.gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  audience public.summary_audience not null,
  language_code public.ui_language_code not null,
  summary_text text not null,
  weakness_tags text[] not null default '{}',
  next_step_recommendation text,
  generated_model_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (conversation_id, audience, language_code)
);

create table public.tutor_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  tutor_user_id uuid not null references public.users(id) on delete cascade,
  student_user_id uuid not null references public.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  note_text text not null,
  is_pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  payer_user_id uuid references public.users(id) on delete set null,
  provider text not null default 'lemonsqueezy',
  provider_customer_id text,
  provider_subscription_id text unique,
  plan_key text not null,
  status public.subscription_status not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.usage_counters (
  id uuid primary key default extensions.gen_random_uuid(),
  student_user_id uuid not null references public.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  sessions_count integer not null default 0 check (sessions_count >= 0),
  uploads_count integer not null default 0 check (uploads_count >= 0),
  assistant_message_count integer not null default 0 check (assistant_message_count >= 0),
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (student_user_id, period_start, period_end),
  check (period_end >= period_start)
);

create table public.moderation_events (
  id uuid primary key default extensions.gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  attachment_id uuid references public.attachments(id) on delete set null,
  actor_user_id uuid references public.users(id) on delete set null,
  event_source public.moderation_source not null,
  status public.moderation_status not null,
  provider text,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  actor_role public.app_role,
  action text not null,
  target_table text not null,
  target_id uuid,
  student_user_id uuid references public.users(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.student_memory_profiles (
  student_user_id uuid primary key references public.users(id) on delete cascade,
  strengths_summary text,
  weaknesses_summary text,
  preferences_summary text,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.student_memory_items (
  id uuid primary key default extensions.gen_random_uuid(),
  student_user_id uuid not null references public.users(id) on delete cascade,
  source_conversation_id uuid references public.conversations(id) on delete set null,
  category public.memory_category not null,
  title text not null,
  detail text,
  confidence numeric(3,2) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.ensure_student_profile_role()
returns trigger
language plpgsql
as $$
begin
  perform public.assert_user_role(new.student_user_id, 'student', 'student_user_id');
  return new;
end;
$$;

create or replace function public.ensure_parent_student_link_roles()
returns trigger
language plpgsql
as $$
begin
  perform public.assert_user_role(new.parent_user_id, 'parent', 'parent_user_id');
  perform public.assert_user_role(new.student_user_id, 'student', 'student_user_id');
  return new;
end;
$$;

create or replace function public.ensure_tutor_student_link_roles()
returns trigger
language plpgsql
as $$
begin
  perform public.assert_user_role(new.tutor_user_id, 'tutor', 'tutor_user_id');
  perform public.assert_user_role(new.student_user_id, 'student', 'student_user_id');

  if new.approved_by_parent_user_id is not null then
    perform public.assert_user_role(
      new.approved_by_parent_user_id,
      'parent',
      'approved_by_parent_user_id'
    );
  end if;

  return new;
end;
$$;

create or replace function public.ensure_conversation_student_role()
returns trigger
language plpgsql
as $$
begin
  perform public.assert_user_role(new.student_user_id, 'student', 'student_user_id');
  return new;
end;
$$;

create or replace function public.ensure_tutor_note_roles()
returns trigger
language plpgsql
as $$
begin
  perform public.assert_user_role(new.tutor_user_id, 'tutor', 'tutor_user_id');
  perform public.assert_user_role(new.student_user_id, 'student', 'student_user_id');
  return new;
end;
$$;

create or replace function public.ensure_usage_counter_student_role()
returns trigger
language plpgsql
as $$
begin
  perform public.assert_user_role(new.student_user_id, 'student', 'student_user_id');
  return new;
end;
$$;

create or replace function public.ensure_student_memory_profile_role()
returns trigger
language plpgsql
as $$
begin
  perform public.assert_user_role(new.student_user_id, 'student', 'student_user_id');
  return new;
end;
$$;

create or replace function public.ensure_student_memory_item_role()
returns trigger
language plpgsql
as $$
begin
  perform public.assert_user_role(new.student_user_id, 'student', 'student_user_id');
  return new;
end;
$$;

create trigger set_updated_at_on_users
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_student_profiles
before update on public.student_profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_parent_student_links
before update on public.parent_student_links
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_tutor_student_links
before update on public.tutor_student_links
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_conversations
before update on public.conversations
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_attachments
before update on public.attachments
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_workspace_states
before update on public.workspace_states
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_session_summaries
before update on public.session_summaries
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_tutor_notes
before update on public.tutor_notes
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_subscriptions
before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_usage_counters
before update on public.usage_counters
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_student_memory_profiles
before update on public.student_memory_profiles
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_student_memory_items
before update on public.student_memory_items
for each row execute function public.set_updated_at();

create trigger ensure_student_profile_role_trigger
before insert or update on public.student_profiles
for each row execute function public.ensure_student_profile_role();

create trigger ensure_parent_student_link_roles_trigger
before insert or update on public.parent_student_links
for each row execute function public.ensure_parent_student_link_roles();

create trigger ensure_tutor_student_link_roles_trigger
before insert or update on public.tutor_student_links
for each row execute function public.ensure_tutor_student_link_roles();

create trigger ensure_conversation_student_role_trigger
before insert or update on public.conversations
for each row execute function public.ensure_conversation_student_role();

create trigger ensure_tutor_note_roles_trigger
before insert or update on public.tutor_notes
for each row execute function public.ensure_tutor_note_roles();

create trigger ensure_usage_counter_student_role_trigger
before insert or update on public.usage_counters
for each row execute function public.ensure_usage_counter_student_role();

create trigger ensure_student_memory_profile_role_trigger
before insert or update on public.student_memory_profiles
for each row execute function public.ensure_student_memory_profile_role();

create trigger ensure_student_memory_item_role_trigger
before insert or update on public.student_memory_items
for each row execute function public.ensure_student_memory_item_role();

alter table public.users enable row level security;
alter table public.student_profiles enable row level security;
alter table public.parent_student_links enable row level security;
alter table public.tutor_student_links enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.workspace_states enable row level security;
alter table public.session_summaries enable row level security;
alter table public.tutor_notes enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_counters enable row level security;
alter table public.moderation_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.student_memory_profiles enable row level security;
alter table public.student_memory_items enable row level security;

create index idx_users_role_status
  on public.users (role, account_status);

create index idx_parent_student_links_student_status
  on public.parent_student_links (student_user_id, link_status);

create index idx_tutor_student_links_student_status
  on public.tutor_student_links (student_user_id, link_status);

create index idx_conversations_student_status_last_message
  on public.conversations (student_user_id, status, last_message_at desc nulls last);

create index idx_messages_conversation_created_at
  on public.messages (conversation_id, created_at);

create index idx_attachments_conversation_created_at
  on public.attachments (conversation_id, created_at);

create index idx_session_summaries_conversation_audience
  on public.session_summaries (conversation_id, audience);

create index idx_tutor_notes_student_conversation
  on public.tutor_notes (student_user_id, conversation_id);

create index idx_subscriptions_payer_status
  on public.subscriptions (payer_user_id, status);

create index idx_usage_counters_student_period
  on public.usage_counters (student_user_id, period_start desc);

create index idx_moderation_events_conversation_created_at
  on public.moderation_events (conversation_id, created_at);

create index idx_audit_logs_student_created_at
  on public.audit_logs (student_user_id, created_at desc);

create index idx_audit_logs_conversation_created_at
  on public.audit_logs (conversation_id, created_at desc);

create index idx_student_memory_items_student_active_category
  on public.student_memory_items (student_user_id, is_active, category);
