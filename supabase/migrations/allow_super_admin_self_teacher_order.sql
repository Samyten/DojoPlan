-- Allows the super administrator to update their own teacher row for display_order changes.
-- The check still prevents a normal teacher/admin from becoming super_admin.

drop policy if exists "super admins can update teachers" on public.teachers;
create policy "super admins can update teachers"
on public.teachers
for update
to authenticated
using (
  public.current_teacher_is_super_admin()
)
with check (
  public.current_teacher_is_super_admin()
  and (
    (id = public.current_teacher_id() and role = 'super_admin')
    or (id <> public.current_teacher_id() and role in ('admin', 'teacher'))
  )
);
