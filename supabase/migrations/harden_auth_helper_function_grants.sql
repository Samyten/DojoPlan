-- Authentication helpers are used by RLS for signed-in users only.
-- Remove PostgreSQL's default PUBLIC execution grant so guests cannot call them directly.

begin;

revoke all on function public.current_teacher_id() from public;
revoke all on function public.current_teacher_role() from public;
revoke all on function public.current_teacher_is_admin() from public;
revoke all on function public.current_teacher_is_super_admin() from public;
revoke all on function public.current_teacher_id() from anon;
revoke all on function public.current_teacher_role() from anon;
revoke all on function public.current_teacher_is_admin() from anon;
revoke all on function public.current_teacher_is_super_admin() from anon;

grant execute on function public.current_teacher_id() to authenticated;
grant execute on function public.current_teacher_role() to authenticated;
grant execute on function public.current_teacher_is_admin() to authenticated;
grant execute on function public.current_teacher_is_super_admin() to authenticated;

commit;
