-- Adds missing recurring Karaté Contact sessions for the existing 2026-2027 season.
-- Safe for production: inserts only missing rows and does not alter/delete existing sessions.
-- Safe to rerun: NOT EXISTS prevents duplicates for the same date/time/title.

with days as (
  select generate_series('2026-09-07'::date, '2027-07-02'::date, interval '1 day')::date as day
),
templates(day_of_week, title, start_time, end_time, location, lesson_plan, notes) as (
  values
    (1, 'Karaté Contact', '20:30'::time, '21:30'::time, 'Dojo principal', '', ''),
    (4, 'Karaté Contact', '20:30'::time, '21:30'::time, 'Dojo principal', '', '')
),
holiday_ranges(label, start_date, end_date) as (
  values
    ('Vacances de la Toussaint', '2026-10-17'::date, '2026-11-02'::date),
    ('Vacances de Noël', '2026-12-19'::date, '2027-01-04'::date),
    ('Vacances d''hiver', '2027-02-06'::date, '2027-02-22'::date),
    ('Vacances de printemps', '2027-04-03'::date, '2027-04-19'::date),
    ('Vacances d''été', '2027-07-03'::date, '9999-12-31'::date),
    ('Pont de l''Ascension', '2027-05-07'::date, '2027-05-07'::date),
    ('Toussaint', '2026-11-01'::date, '2026-11-01'::date),
    ('Armistice 1918', '2026-11-11'::date, '2026-11-11'::date),
    ('Noël', '2026-12-25'::date, '2026-12-25'::date),
    ('Jour de l''An', '2027-01-01'::date, '2027-01-01'::date),
    ('Lundi de Pâques', '2027-03-29'::date, '2027-03-29'::date),
    ('Fête du Travail', '2027-05-01'::date, '2027-05-01'::date),
    ('Ascension', '2027-05-06'::date, '2027-05-06'::date),
    ('Victoire 1945', '2027-05-08'::date, '2027-05-08'::date),
    ('Lundi de Pentecôte', '2027-05-17'::date, '2027-05-17'::date),
    ('Fête nationale', '2027-07-14'::date, '2027-07-14'::date),
    ('Assomption', '2027-08-15'::date, '2027-08-15'::date)
)
insert into public.sessions (title, date, start_time, end_time, location, lesson_plan, notes)
select
  templates.title,
  days.day,
  templates.start_time,
  templates.end_time,
  templates.location,
  templates.lesson_plan,
  templates.notes
from days
join templates on extract(isodow from days.day)::int = templates.day_of_week
where not exists (
  select 1
  from holiday_ranges
  where days.day between holiday_ranges.start_date and holiday_ranges.end_date
)
and not exists (
  select 1
  from public.sessions
  where sessions.date = days.day
    and sessions.title = templates.title
    and sessions.start_time = templates.start_time
    and sessions.end_time = templates.end_time
)
order by days.day, templates.start_time;
