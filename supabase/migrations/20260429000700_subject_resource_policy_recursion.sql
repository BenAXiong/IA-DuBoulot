drop policy if exists conversation_resource_links_manage on public.conversation_resource_links;

create policy conversation_resource_links_insert
on public.conversation_resource_links
for insert
to authenticated
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

create policy conversation_resource_links_update
on public.conversation_resource_links
for update
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_resource_links.conversation_id
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

create policy conversation_resource_links_delete
on public.conversation_resource_links
for delete
to authenticated
using (
  exists (
    select 1
    from public.conversations c
    where c.id = conversation_resource_links.conversation_id
      and public.can_manage_conversation(c.id)
  )
);

drop policy if exists subject_resource_chunks_student_manage on public.subject_resource_chunks;

create policy subject_resource_chunks_insert
on public.subject_resource_chunks
for insert
to authenticated
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

create policy subject_resource_chunks_update
on public.subject_resource_chunks
for update
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

create policy subject_resource_chunks_delete
on public.subject_resource_chunks
for delete
to authenticated
using (public.can_manage_student_owned_data(student_user_id));
