-- Exposes only teacher display names explicitly marked present on the public timetable.
-- Anonymous users keep no direct access to teachers or availability rows.

begin;

create or replace function public.get_public_session_attendees()
returns table (
  session_id uuid,
  teacher_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select availability.session_id, teachers.name
  from public.availability
  join public.teachers on teachers.id = availability.teacher_id
  where availability.status = 'present'
  order by
    availability.session_id,
    teachers.display_order asc nulls last,
    teachers.name asc
$$;

revoke all on function public.get_public_session_attendees() from public;
grant execute on function public.get_public_session_attendees() to anon, authenticated;

commit;
