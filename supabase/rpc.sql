-- Narrow RPCs for the dojo planning app.
--
-- This function exists because direct updates to public.sessions remain restricted to admins
-- by RLS. Teachers still need to edit lesson content, so this RPC allows authenticated,
-- linked teachers to update only lesson_plan, optional notes, and updated_at.

create or replace function public.update_session_lesson_content(
  p_session_id uuid,
  p_lesson_plan text,
  p_notes text default null
)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher public.teachers%rowtype;
  v_previous_session public.sessions%rowtype;
  v_updated_session public.sessions%rowtype;
  v_previous_lesson_plan text;
  v_next_lesson_plan text;
  v_change_type text;
  v_description text;
  v_day_name text;
  v_month_name text;
  v_course_date text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into v_teacher
  from public.teachers
  where auth_user_id = auth.uid();

  if v_teacher.id is null then
    raise exception 'No linked teacher profile found for this authenticated user.';
  end if;

  select *
  into v_previous_session
  from public.sessions
  where id = p_session_id;

  if v_previous_session.id is null then
    raise exception 'Session not found.';
  end if;

  v_previous_lesson_plan := coalesce(v_previous_session.lesson_plan, '');
  v_next_lesson_plan := btrim(coalesce(p_lesson_plan, ''));

  if v_previous_lesson_plan = v_next_lesson_plan
    and (p_notes is null or coalesce(v_previous_session.notes, '') = btrim(p_notes)) then
    return v_previous_session;
  end if;

  update public.sessions
  set
    lesson_plan = v_next_lesson_plan,
    notes = case
      when p_notes is null then notes
      else btrim(p_notes)
    end,
    updated_at = now()
  where id = p_session_id
  returning * into v_updated_session;

  v_day_name := case extract(isodow from v_updated_session.date)
    when 1 then 'lundi'
    when 2 then 'mardi'
    when 3 then 'mercredi'
    when 4 then 'jeudi'
    when 5 then 'vendredi'
    when 6 then 'samedi'
    else 'dimanche'
  end;

  v_month_name := case extract(month from v_updated_session.date)
    when 1 then 'janvier'
    when 2 then 'février'
    when 3 then 'mars'
    when 4 then 'avril'
    when 5 then 'mai'
    when 6 then 'juin'
    when 7 then 'juillet'
    when 8 then 'août'
    when 9 then 'septembre'
    when 10 then 'octobre'
    when 11 then 'novembre'
    else 'décembre'
  end;

  v_course_date := concat(v_day_name, ' ', extract(day from v_updated_session.date)::int, ' ', v_month_name);
  v_change_type := case
    when btrim(v_previous_lesson_plan) = '' then 'lesson_plan_added'
    else 'lesson_plan_updated'
  end;
  v_description := case
    when v_change_type = 'lesson_plan_added'
      then concat(v_teacher.name, ' a ajouté le contenu du ', lower(v_updated_session.title), ' du ', v_course_date, '.')
    else concat(v_teacher.name, ' a modifié le contenu du ', lower(v_updated_session.title), ' du ', v_course_date, '.')
  end;

  insert into public.change_log_entries (
    session_id,
    actor_teacher_id,
    type,
    description,
    metadata
  )
  values (
    v_updated_session.id,
    v_teacher.id,
    v_change_type,
    v_description,
    jsonb_build_object(
      'previousLessonPlan', v_previous_lesson_plan,
      'nextLessonPlan', v_next_lesson_plan,
      'previousNotes', coalesce(v_previous_session.notes, ''),
      'nextNotes', coalesce(v_updated_session.notes, '')
    )
  );

  return v_updated_session;
end;
$$;

revoke execute on function public.update_session_lesson_content(uuid, text, text) from public;
revoke execute on function public.update_session_lesson_content(uuid, text, text) from anon;
grant execute on function public.update_session_lesson_content(uuid, text, text) to authenticated;
