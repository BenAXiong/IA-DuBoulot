create table if not exists public.subject_resources (
  id uuid primary key default extensions.gen_random_uuid(),
  student_user_id uuid not null references public.users(id) on delete cascade,
  created_by_user_id uuid references public.users(id) on delete set null,
  subject_tag text not null,
  source_attachment_id uuid references public.attachments(id) on delete set null,
  source_conversation_id uuid references public.conversations(id) on delete set null,
  source_storage_bucket text,
  source_storage_path text,
  attachment_kind public.attachment_kind not null,
  mime_type text not null,
  original_filename text not null,
  byte_size bigint not null check (byte_size > 0),
  page_count integer check (page_count is null or page_count > 0),
  extraction_status public.extraction_status not null default 'pending',
  raw_extracted_text text,
  source_language public.ui_language_code,
  sha256 text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (length(trim(subject_tag)) > 0),
  unique (student_user_id, subject_tag, sha256)
);

create table if not exists public.conversation_resource_links (
  id uuid primary key default extensions.gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  resource_id uuid not null references public.subject_resources(id) on delete cascade,
  created_by_user_id uuid references public.users(id) on delete set null,
  selected boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (conversation_id, resource_id)
);

create index if not exists subject_resources_student_subject_idx
on public.subject_resources (student_user_id, subject_tag, created_at desc);

create index if not exists subject_resources_source_attachment_idx
on public.subject_resources (source_attachment_id);

create index if not exists conversation_resource_links_conversation_idx
on public.conversation_resource_links (conversation_id, selected);

create trigger set_updated_at_on_subject_resources
before update on public.subject_resources
for each row execute function public.set_updated_at();

create trigger set_updated_at_on_conversation_resource_links
before update on public.conversation_resource_links
for each row execute function public.set_updated_at();

alter table public.subject_resources enable row level security;
alter table public.conversation_resource_links enable row level security;

drop policy if exists subject_resources_select on public.subject_resources;
create policy subject_resources_select
on public.subject_resources
for select
to authenticated
using (
  public.can_manage_student_owned_data(student_user_id)
  or exists (
    select 1
    from public.conversation_resource_links crl
    where crl.resource_id = subject_resources.id
      and public.can_view_conversation(crl.conversation_id)
  )
);

drop policy if exists subject_resources_student_manage on public.subject_resources;
create policy subject_resources_student_manage
on public.subject_resources
for all
to authenticated
using (public.can_manage_student_owned_data(student_user_id))
with check (
  public.can_manage_student_owned_data(student_user_id)
  and (
    public.is_admin()
    or created_by_user_id is null
    or created_by_user_id = auth.uid()
  )
);

drop policy if exists conversation_resource_links_select on public.conversation_resource_links;
create policy conversation_resource_links_select
on public.conversation_resource_links
for select
to authenticated
using (public.can_view_conversation(conversation_id));

drop policy if exists conversation_resource_links_manage on public.conversation_resource_links;
create policy conversation_resource_links_manage
on public.conversation_resource_links
for all
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    join public.subject_resources r on r.id = conversation_resource_links.resource_id
    where c.id = conversation_resource_links.conversation_id
      and c.student_user_id = r.student_user_id
      and c.subject_tag = r.subject_tag
      and public.can_manage_conversation(c.id)
  )
)
with check (
  (
    public.is_admin()
    or created_by_user_id is null
    or created_by_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.conversations c
    join public.subject_resources r on r.id = conversation_resource_links.resource_id
    where c.id = conversation_resource_links.conversation_id
      and c.student_user_id = r.student_user_id
      and c.subject_tag = r.subject_tag
      and public.can_manage_conversation(c.id)
  )
);
