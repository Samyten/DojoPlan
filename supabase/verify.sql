-- Read-only verification queries for first Supabase live testing.
--
-- How to use:
-- 1. Run schema.sql, seed.sql, rls.sql, and rpc.sql first.
-- 2. Open this file in the Supabase SQL editor.
-- 3. Run the sections one by one while setting up live test accounts.
--
-- This file does not modify data and does not require service role secrets.

-- Teachers seeded in the public app profile table.
select id, auth_user_id, name, email, role, created_at
from public.teachers
order by role, name;

-- Teacher/Auth linking status.
select
  name,
  email,
  role,
  case when auth_user_id is null then 'missing auth_user_id' else 'linked' end as auth_link_status,
  auth_user_id
from public.teachers
order by auth_link_status desc, name;

-- Teachers still missing an Auth user link.
select id, name, email, role
from public.teachers
where auth_user_id is null
order by name;

-- Session count and date range.
select
  count(*) as session_count,
  min(date) as first_session_date,
  max(date) as last_session_date
from public.sessions;

-- Upcoming sessions visible in the database.
select id, title, date, start_time, end_time, location, lesson_plan, notes
from public.sessions
order by date, start_time
limit 30;

-- RLS status for expected tables.
select
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  forcerowsecurity as rls_forced
from pg_tables
where schemaname = 'public'
  and tablename in (
    'teachers',
    'sessions',
    'availability',
    'change_log_entries',
    'notification_read_state'
  )
order by tablename;

-- Installed RLS policies.
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'teachers',
    'sessions',
    'availability',
    'change_log_entries',
    'notification_read_state'
  )
order by tablename, policyname;

-- Helper/RPC functions expected by the app.
select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'current_teacher_id',
    'current_teacher_role',
    'current_teacher_is_admin',
    'current_teacher_is_super_admin',
    'update_session_lesson_content'
  )
order by p.proname;

-- Confirm authenticated users can execute the lesson-content RPC.
select has_function_privilege(
  'authenticated',
  'public.update_session_lesson_content(uuid,text,text)',
  'execute'
) as authenticated_can_execute_lesson_content_rpc;

-- Availability and recent change counts.
select count(*) as availability_count from public.availability;
select count(*) as change_log_count from public.change_log_entries;
select count(*) as notification_read_state_count from public.notification_read_state;

-- Most recent changes.
select id, type, description, session_id, teacher_id, actor_teacher_id, created_at
from public.change_log_entries
order by created_at desc
limit 20;
