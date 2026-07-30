-- Adds the persistent teacher Forum to an existing Supabase project.
-- Safe additive migration: no existing dojo data is modified.

begin;

create table if not exists public.forum_messages (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.teachers(id) on delete set null,
  author_name text not null,
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists forum_messages_created_at_desc_idx
  on public.forum_messages(created_at desc);

alter table public.forum_messages enable row level security;

drop policy if exists "authenticated teachers can read forum messages" on public.forum_messages;
create policy "authenticated teachers can read forum messages"
on public.forum_messages
for select
to authenticated
using (public.current_teacher_id() is not null);

drop policy if exists "teachers can post forum messages as themselves" on public.forum_messages;
create policy "teachers can post forum messages as themselves"
on public.forum_messages
for insert
to authenticated
with check (
  teacher_id = public.current_teacher_id()
  and author_name = (
    select teacher.name
    from public.teachers as teacher
    where teacher.id = public.current_teacher_id()
  )
);

revoke all on table public.forum_messages from anon, authenticated;
grant select, insert on table public.forum_messages to authenticated;

commit;
