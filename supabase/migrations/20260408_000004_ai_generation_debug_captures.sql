-- A7.3.4 add a dedicated debug sink for successful AI coach outputs.
-- This is intentionally separate from audit_logs so raw provider text does not drift into the audit trail.

create table public.ai_generation_debug_captures (
  id uuid primary key default extensions.gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  student_user_id uuid not null references public.users(id) on delete cascade,
  student_message_id uuid references public.messages(id) on delete set null,
  assistant_message_id uuid references public.messages(id) on delete set null,
  request_id text not null,
  route text not null,
  provider text not null,
  operation text not null,
  model_name text not null,
  prompt_version text not null,
  reply_mode text,
  raw_output_text text not null,
  final_output_text text not null,
  usage_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index ai_generation_debug_captures_conversation_idx
  on public.ai_generation_debug_captures (conversation_id, created_at desc);

create index ai_generation_debug_captures_student_idx
  on public.ai_generation_debug_captures (student_user_id, created_at desc);

alter table public.ai_generation_debug_captures enable row level security;
