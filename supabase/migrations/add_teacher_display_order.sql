-- Adds manual teacher display ordering for the Professeurs page.
alter table public.teachers
add column if not exists display_order integer;

-- Optional one-time initialization for existing rows that do not have an order yet.
with ordered_teachers as (
  select
    id,
    row_number() over (order by name asc) as next_display_order
  from public.teachers
  where display_order is null
)
update public.teachers
set display_order = ordered_teachers.next_display_order
from ordered_teachers
where public.teachers.id = ordered_teachers.id;
