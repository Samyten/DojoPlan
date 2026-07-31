-- Row Level Security policies for the dojo planning app.
--
-- Mapping choice:
-- teachers.auth_user_id links a teacher profile to auth.users.id.
-- This avoids relying on email for authorization and keeps teachers.id stable for app data.
--
-- Direct sessions updates remain admin-only under RLS.
-- Teacher lesson-content edits are handled by the narrow RPC in supabase/rpc.sql so normal
-- teachers do not receive broad update access to title, date, time, location, or deletion.

create or replace function public.current_teacher_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.teachers where auth_user_id = auth.uid()
$$;

create or replace function public.current_teacher_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.teachers where auth_user_id = auth.uid()
$$;

create or replace function public.current_teacher_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_teacher_role() in ('admin', 'super_admin'), false)
$$;

create or replace function public.current_teacher_is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_teacher_role() = 'super_admin', false)
$$;

alter table public.teachers enable row level security;
alter table public.sessions enable row level security;
alter table public.availability enable row level security;
alter table public.change_log_entries enable row level security;
alter table public.notification_read_state enable row level security;
alter table public.forum_messages enable row level security;
alter table public.forum_read_state enable row level security;

drop policy if exists "authenticated teachers can read teachers" on public.teachers;
create policy "authenticated teachers can read teachers"
on public.teachers
for select
to authenticated
using (public.current_teacher_id() is not null);

drop policy if exists "admins can insert teachers" on public.teachers;
drop policy if exists "super admins can insert teachers" on public.teachers;
create policy "super admins can insert teachers"
on public.teachers
for insert
to authenticated
with check (
  public.current_teacher_is_super_admin()
  and role in ('admin', 'teacher')
);

drop policy if exists "admins can update teachers" on public.teachers;
drop policy if exists "super admins can update teachers" on public.teachers;
create policy "super admins can update teachers"
on public.teachers
for update
to authenticated
using (
  public.current_teacher_is_super_admin()
)
with check (
  public.current_teacher_is_super_admin()
  and (
    (id = public.current_teacher_id() and role = 'super_admin')
    or (id <> public.current_teacher_id() and role in ('admin', 'teacher'))
  )
);

drop policy if exists "admins can delete teachers" on public.teachers;
drop policy if exists "super admins can delete teachers" on public.teachers;
create policy "super admins can delete teachers"
on public.teachers
for delete
to authenticated
using (
  public.current_teacher_is_super_admin()
  and id <> public.current_teacher_id()
);

drop policy if exists "authenticated teachers can read sessions" on public.sessions;
create policy "authenticated teachers can read sessions"
on public.sessions
for select
to authenticated
using (public.current_teacher_id() is not null);

drop policy if exists "admins can insert sessions" on public.sessions;
create policy "admins can insert sessions"
on public.sessions
for insert
to authenticated
with check (public.current_teacher_is_admin());

drop policy if exists "admins can update sessions" on public.sessions;
create policy "admins can update sessions"
on public.sessions
for update
to authenticated
using (public.current_teacher_is_admin())
with check (public.current_teacher_is_admin());

drop policy if exists "admins can delete sessions" on public.sessions;
create policy "admins can delete sessions"
on public.sessions
for delete
to authenticated
using (public.current_teacher_is_admin());

drop policy if exists "authenticated teachers can read availability" on public.availability;
create policy "authenticated teachers can read availability"
on public.availability
for select
to authenticated
using (public.current_teacher_id() is not null);

drop policy if exists "teachers can insert own availability" on public.availability;
create policy "teachers can insert own availability"
on public.availability
for insert
to authenticated
with check (
  teacher_id = public.current_teacher_id()
  or public.current_teacher_is_admin()
);

drop policy if exists "teachers can update own availability" on public.availability;
create policy "teachers can update own availability"
on public.availability
for update
to authenticated
using (
  teacher_id = public.current_teacher_id()
  or public.current_teacher_is_admin()
)
with check (
  teacher_id = public.current_teacher_id()
  or public.current_teacher_is_admin()
);

drop policy if exists "teachers can delete own availability" on public.availability;
create policy "teachers can delete own availability"
on public.availability
for delete
to authenticated
using (
  teacher_id = public.current_teacher_id()
  or public.current_teacher_is_admin()
);

drop policy if exists "authenticated teachers can read change logs" on public.change_log_entries;
create policy "authenticated teachers can read change logs"
on public.change_log_entries
for select
to authenticated
using (public.current_teacher_id() is not null);

drop policy if exists "teachers can insert own change logs" on public.change_log_entries;
create policy "teachers can insert own change logs"
on public.change_log_entries
for insert
to authenticated
with check (actor_teacher_id = public.current_teacher_id());

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

-- Forum: every linked teacher can read and post. The author is tied to auth.uid() through
-- current_teacher_id(), so clients cannot publish under another teacher's identity.
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

-- Each teacher owns their Forum read marker. Reading the Forum for one account cannot
-- clear the notification badge for any other account.
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
