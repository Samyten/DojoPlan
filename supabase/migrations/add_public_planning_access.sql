-- Adds anonymous read-only access to the public timetable.
-- Lesson content, notes, teacher data and availability remain inaccessible.

begin;

alter table public.sessions enable row level security;

drop policy if exists "public can read session timetable" on public.sessions;
create policy "public can read session timetable"
on public.sessions
for select
to anon
using (true);

revoke all on table public.sessions from anon;
grant select (id, title, date, start_time, end_time, location)
on table public.sessions to anon;

revoke all on table public.teachers from anon;
revoke all on table public.availability from anon;
revoke all on table public.change_log_entries from anon;

commit;
