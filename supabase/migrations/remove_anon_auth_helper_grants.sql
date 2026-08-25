-- Some existing projects have explicit anon grants in addition to PUBLIC grants.
-- Remove those grants while keeping the helpers available to authenticated RLS policies.

begin;

revoke all on function public.current_teacher_id() from anon;
revoke all on function public.current_teacher_role() from anon;
revoke all on function public.current_teacher_is_admin() from anon;
revoke all on function public.current_teacher_is_super_admin() from anon;

grant execute on function public.current_teacher_id() to authenticated;
grant execute on function public.current_teacher_role() to authenticated;
grant execute on function public.current_teacher_is_admin() to authenticated;
grant execute on function public.current_teacher_is_super_admin() to authenticated;

commit;
