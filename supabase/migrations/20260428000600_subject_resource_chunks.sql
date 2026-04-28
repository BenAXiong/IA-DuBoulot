create table if not exists public.subject_resource_chunks (
  id uuid primary key default extensions.gen_random_uuid(),
  resource_id uuid not null references public.subject_resources(id) on delete cascade,
  student_user_id uuid not null references public.users(id) on delete cascade,
  subject_tag text not null,
  chunk_index integer not null check (chunk_index >= 0),
  stable_chunk_id text not null,
  page_start integer check (page_start is null or page_start > 0),
  page_end integer check (
    page_end is null
    or (page_start is not null and page_end >= page_start)
  ),
  section_title text,
  content text not null,
  char_count integer not null check (char_count > 0),
  token_estimate integer not null check (token_estimate > 0),
  extraction_confidence numeric check (
    extraction_confidence is null
    or (extraction_confidence >= 0 and extraction_confidence <= 1)
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (length(trim(subject_tag)) > 0),
  check (length(trim(stable_chunk_id)) > 0),
  check (length(trim(content)) > 0),
  unique (resource_id, chunk_index),
  unique (resource_id, stable_chunk_id)
);

create index if not exists subject_resource_chunks_resource_idx
on public.subject_resource_chunks (resource_id, chunk_index);

create index if not exists subject_resource_chunks_student_subject_idx
on public.subject_resource_chunks (student_user_id, subject_tag, resource_id, chunk_index);

create trigger set_updated_at_on_subject_resource_chunks
before update on public.subject_resource_chunks
for each row execute function public.set_updated_at();

alter table public.subject_resource_chunks enable row level security;

drop policy if exists subject_resource_chunks_select on public.subject_resource_chunks;
create policy subject_resource_chunks_select
on public.subject_resource_chunks
for select
to authenticated
using (
  public.can_manage_student_owned_data(student_user_id)
  or exists (
    select 1
    from public.conversation_resource_links crl
    where crl.resource_id = subject_resource_chunks.resource_id
      and public.can_view_conversation(crl.conversation_id)
  )
);

drop policy if exists subject_resource_chunks_student_manage on public.subject_resource_chunks;
create policy subject_resource_chunks_student_manage
on public.subject_resource_chunks
for all
to authenticated
using (public.can_manage_student_owned_data(student_user_id))
with check (
  public.can_manage_student_owned_data(student_user_id)
  and exists (
    select 1
    from public.subject_resources sr
    where sr.id = subject_resource_chunks.resource_id
      and sr.student_user_id = subject_resource_chunks.student_user_id
      and sr.subject_tag = subject_resource_chunks.subject_tag
  )
);
