-- Adds/updates real teacher profile emails and creates the Sébastien Calvet profile.
-- Safe for production: this only touches public teacher profiles.
-- It does not create Supabase Auth accounts and does not store passwords.

update public.teachers
set email = 'jeanrene.foulquier@sfr.fr',
    role = 'teacher'
where id = '33333333-3333-4333-8333-333333333333'
   or email = 'jean-rene.foulquier@dojo.local'
   or name = 'Jean-René FOULQUIER';

update public.teachers
set email = 'matthieupiperno@gmail.com',
    role = 'teacher'
where id = '55555555-5555-4555-8555-555555555555'
   or email = 'matthieu.piperno@dojo.local'
   or name = 'Matthieu Piperno';

update public.teachers
set email = 'camille.piperno@icloud.com',
    role = 'teacher'
where id = '88888888-8888-4888-8888-888888888888'
   or email = 'camille.piperno@dojo.local'
   or name = 'Camille Piperno';

update public.teachers
set email = 'christian.martinez20@wanadoo.fr',
    role = 'teacher'
where id = '22222222-2222-4222-8222-222222222222'
   or email = 'christian.martinez@dojo.local'
   or name = 'Christian Martinez';

insert into public.teachers (id, auth_user_id, name, email, role, display_order)
values (
  '99999999-9999-4999-8999-999999999999',
  null,
  'Sébastien Calvet',
  'sebastien.calvet66@free.fr',
  'teacher',
  9
)
on conflict (email) do update
set name = excluded.name,
    role = excluded.role,
    display_order = coalesce(public.teachers.display_order, excluded.display_order);
