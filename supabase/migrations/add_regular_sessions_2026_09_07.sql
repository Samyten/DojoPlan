-- Adds the first regular lesson day for the 2026-2027 season.
-- Safe for production: inserts only missing Monday 7 September 2026 sessions.
-- Safe to rerun: NOT EXISTS prevents duplicates for the same date/time/title.

insert into public.sessions (title, date, start_time, end_time, location, lesson_plan, notes)
select *
from (
  values
    ('Enfants 10 à 14 ans', '2026-09-07'::date, '18:00'::time, '19:15'::time, 'Dojo principal', '', ''),
    ('Adultes', '2026-09-07'::date, '19:15'::time, '20:30'::time, 'Dojo principal', '', ''),
    ('Karaté Contact', '2026-09-07'::date, '20:30'::time, '21:30'::time, 'Dojo principal', '', '')
) as first_day_sessions(title, date, start_time, end_time, location, lesson_plan, notes)
where not exists (
  select 1
  from public.sessions
  where sessions.date = first_day_sessions.date
    and sessions.title = first_day_sessions.title
    and sessions.start_time = first_day_sessions.start_time
    and sessions.end_time = first_day_sessions.end_time
);
