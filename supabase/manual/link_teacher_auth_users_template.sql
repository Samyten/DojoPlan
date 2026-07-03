-- Template for linking Supabase Auth users to teacher profiles.
-- 1. Create each user in Supabase Dashboard > Authentication > Users.
-- 2. Copy each user's UID.
-- 3. Replace the placeholder UUIDs below, then run only the relevant statements.
-- Do not store passwords in SQL files or source control.

update public.teachers
set auth_user_id = '<JEAN_RENE_AUTH_USER_UID>'::uuid
where email = 'jeanrene.foulquier@sfr.fr';

update public.teachers
set auth_user_id = '<MATTHIEU_AUTH_USER_UID>'::uuid
where email = 'matthieupiperno@gmail.com';

update public.teachers
set auth_user_id = '<CAMILLE_AUTH_USER_UID>'::uuid
where email = 'camille.piperno@icloud.com';

update public.teachers
set auth_user_id = '<CHRISTIAN_AUTH_USER_UID>'::uuid
where email = 'christian.martinez20@wanadoo.fr';

update public.teachers
set auth_user_id = '<SEBASTIEN_AUTH_USER_UID>'::uuid
where email = 'sebastien.calvet66@free.fr';
