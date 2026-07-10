-- Per-teacher read state for the shared recent-changes feed.
-- Run once in the Supabase SQL Editor for an existing project.

create table if not exists public.notification_read_state (
  teacher_id uuid primary key references public.teachers(id) on delete cascade,
  last_read_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.notification_read_state enable row level security;

drop policy if exists "teachers can read own notification state" on public.notification_read_state;
create policy "teachers can read own notification state"
on public.notification_read_state
for select
to authenticated
using (teacher_id = public.current_teacher_id());

drop policy if exists "teachers can insert own notification state" on public.notification_read_state;
create policy "teachers can insert own notification state"
on public.notification_read_state
for insert
to authenticated
with check (teacher_id = public.current_teacher_id());

drop policy if exists "teachers can update own notification state" on public.notification_read_state;
create policy "teachers can update own notification state"
on public.notification_read_state
for update
to authenticated
using (teacher_id = public.current_teacher_id())
with check (teacher_id = public.current_teacher_id());

revoke all on table public.notification_read_state from anon;
grant select, insert, update on table public.notification_read_state to authenticated;
