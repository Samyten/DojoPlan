-- Updates the existing Hugo and Lohan teacher profiles and links them to Auth users.
-- Create both users in Supabase Authentication first. Passwords must never be stored here.

update public.teachers
set email = 'amadorhugo31@gmail.com',
    role = 'teacher'
where id = '44444444-4444-4444-8444-444444444444'
   or lower(email) = 'hugo.amador@dojo.local'
   or lower(name) = 'hugo amador';

update public.teachers
set email = 'lohanamador66@gmail.com',
    role = 'teacher'
where id = '77777777-7777-4777-8777-777777777777'
   or lower(email) = 'lohan.amador@dojo.local'
   or lower(name) = 'lohan amador';

update public.teachers as teacher
set auth_user_id = auth_account.id
from auth.users as auth_account
where lower(auth_account.email) = lower(teacher.email)
  and lower(teacher.email) in (
    'amadorhugo31@gmail.com',
    'lohanamador66@gmail.com'
  );

-- Both rows should display "linked" after the Auth users have been created.
select
  name,
  email,
  role,
  case when auth_user_id is null then 'missing Auth user' else 'linked' end as auth_status
from public.teachers
where lower(email) in (
  'amadorhugo31@gmail.com',
  'lohanamador66@gmail.com'
)
order by name;
