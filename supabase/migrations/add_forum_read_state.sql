-- Adds an individual read marker for Forum notifications.
-- Safe additive migration: Forum messages and existing dojo data are unchanged.

begin;

create table if not exists public.forum_read_state (
  teacher_id uuid primary key references public.teachers(id) on delete cascade,
  last_read_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.forum_read_state enable row level security;

drop policy if exists "teachers can read own forum state" on public.forum_read_state;
create policy "teachers can read own forum state"
on public.forum_read_state
for select
to authenticated
using (teacher_id = public.current_teacher_id());

drop policy if exists "teachers can insert own forum state" on public.forum_read_state;
create policy "teachers can insert own forum state"
on public.forum_read_state
for insert
to authenticated
with check (teacher_id = public.current_teacher_id());

drop policy if exists "teachers can update own forum state" on public.forum_read_state;
create policy "teachers can update own forum state"
on public.forum_read_state
for update
to authenticated
using (teacher_id = public.current_teacher_id())
with check (teacher_id = public.current_teacher_id());

revoke all on table public.forum_read_state from anon, authenticated;
grant select, insert, update on table public.forum_read_state to authenticated;

commit;
