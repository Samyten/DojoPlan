-- Development/sample seed data for the dojo planning app.
-- Safe to rerun in a development project.
-- For real production use, create/link real Auth users and update emails before relying on this data.

truncate table change_log_entries, availability, sessions, teachers restart identity cascade;

insert into teachers (id, auth_user_id, name, email, role, display_order) values
  ('11111111-1111-4111-8111-111111111111', null, 'Marc Piperno', 'marc.piperno@dojo.local', 'admin', 1),
  ('22222222-2222-4222-8222-222222222222', null, 'Christian Martinez', 'christian.martinez20@wanadoo.fr', 'teacher', 2),
  ('33333333-3333-4333-8333-333333333333', null, 'Jean-René FOULQUIER', 'jeanrene.foulquier@sfr.fr', 'teacher', 3),
  ('44444444-4444-4444-8444-444444444444', null, 'Hugo Amador', 'hugo.amador@dojo.local', 'teacher', 4),
  ('55555555-5555-4555-8555-555555555555', null, 'Matthieu Piperno', 'matthieupiperno@gmail.com', 'teacher', 5),
  ('66666666-6666-4666-8666-666666666666', null, 'Samy Belkacemi', 'samy.belkacemi@dojo.local', 'super_admin', 6),
  ('77777777-7777-4777-8777-777777777777', null, 'Lohan Amador', 'lohan.amador@dojo.local', 'teacher', 7),
  ('88888888-8888-4888-8888-888888888888', null, 'Camille Piperno', 'camille.piperno@icloud.com', 'teacher', 8),
  ('99999999-9999-4999-8999-999999999999', null, 'Sébastien Calvet', 'sebastien.calvet66@free.fr', 'teacher', 9);

-- After creating Auth users in the Supabase dashboard, link them like this:
-- update teachers set auth_user_id = '<auth.users.id>' where email = '<real-teacher-email>';

with days as (
  select generate_series('2026-09-07'::date, '2027-07-02'::date, interval '1 day')::date as day
),
templates(day_of_week, title, start_time, end_time, location, lesson_plan, notes) as (
  values
    (1, 'Enfants 10 à 14 ans', '18:00'::time, '19:15'::time, 'Dojo principal', '', ''),
    (1, 'Adultes', '19:15'::time, '20:30'::time, 'Dojo principal', '', ''),
    (1, 'Karaté Contact', '20:30'::time, '21:30'::time, 'Dojo principal', '', ''),
    (3, 'Enfants de 5 à 9 ans', '17:15'::time, '18:30'::time, 'Dojo principal', '', ''),
    (4, 'Enfants 10 à 14 ans', '18:00'::time, '19:15'::time, 'Dojo principal', '', ''),
    (4, 'Adultes', '19:15'::time, '20:30'::time, 'Dojo principal', '', ''),
    (4, 'Karaté Contact', '20:30'::time, '21:30'::time, 'Dojo principal', '', '')
),
holiday_ranges(label, start_date, end_date) as (
  values
    ('Vacances de la Toussaint', '2025-10-18'::date, '2025-11-03'::date),
    ('Vacances de Noël', '2025-12-20'::date, '2026-01-05'::date),
    ('Vacances d''hiver', '2026-02-21'::date, '2026-03-09'::date),
    ('Vacances de printemps', '2026-04-18'::date, '2026-05-04'::date),
    ('Vacances d''été', '2026-07-04'::date, '2026-08-31'::date),
    ('Pont de l''Ascension', '2026-05-15'::date, '2026-05-16'::date),
    ('Vacances de la Toussaint', '2026-10-17'::date, '2026-11-02'::date),
    ('Vacances de Noël', '2026-12-19'::date, '2027-01-04'::date),
    ('Vacances d''hiver', '2027-02-06'::date, '2027-02-22'::date),
    ('Vacances de printemps', '2027-04-03'::date, '2027-04-19'::date),
    ('Vacances d''été', '2027-07-03'::date, '9999-12-31'::date),
    ('Pont de l''Ascension', '2027-05-07'::date, '2027-05-07'::date),
    ('Toussaint', '2025-11-01'::date, '2025-11-01'::date),
    ('Armistice', '2025-11-11'::date, '2025-11-11'::date),
    ('Noël', '2025-12-25'::date, '2025-12-25'::date),
    ('Jour de l''An', '2026-01-01'::date, '2026-01-01'::date),
    ('Lundi de Pâques', '2026-04-06'::date, '2026-04-06'::date),
    ('Fête du Travail', '2026-05-01'::date, '2026-05-01'::date),
    ('Victoire 1945', '2026-05-08'::date, '2026-05-08'::date),
    ('Ascension', '2026-05-14'::date, '2026-05-14'::date),
    ('Lundi de Pentecôte', '2026-05-25'::date, '2026-05-25'::date),
    ('Fête nationale', '2026-07-14'::date, '2026-07-14'::date),
    ('Assomption', '2026-08-15'::date, '2026-08-15'::date),
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
insert into sessions (title, date, start_time, end_time, location, lesson_plan, notes)
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
order by days.day, templates.start_time;

-- Availability and recent changes intentionally start empty.
-- They should be created by real teacher actions during testing/use.
