-- Adds a narrow RPC for bulk availability and admin-on-behalf availability edits.
-- This keeps direct availability RLS narrow while deriving the trusted actor from auth.uid().

create or replace function public.bulk_update_availability(
  p_target_teacher_id uuid,
  p_session_ids uuid[],
  p_status text,
  p_comment text default null,
  p_overwrite_existing boolean default false
)
returns table (
  target_teacher_id uuid,
  status text,
  matched_count integer,
  updated_count integer,
  skipped_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.teachers%rowtype;
  v_target public.teachers%rowtype;
  v_distinct_input_count integer;
  v_matched_count integer;
  v_updated_count integer;
  v_skipped_count integer;
  v_first_session public.sessions%rowtype;
  v_description text;
  v_status_phrase_self text;
  v_status_phrase_target text;
  v_day_name text;
  v_month_name text;
  v_course_date text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if p_status not in ('present', 'absent', 'maybe', 'unknown') then
    raise exception 'Invalid availability status: %', p_status;
  end if;

  select *
  into v_actor
  from public.teachers
  where auth_user_id = auth.uid();

  if v_actor.id is null then
    raise exception 'No linked teacher profile found for this authenticated user.';
  end if;

  select *
  into v_target
  from public.teachers
  where id = p_target_teacher_id;

  if v_target.id is null then
    raise exception 'Target teacher not found.';
  end if;

  if v_actor.id <> v_target.id and v_actor.role not in ('admin', 'super_admin') then
    raise exception 'Only admins can update availability for another teacher.';
  end if;

  select count(*)
  into v_distinct_input_count
  from (select distinct unnest(coalesce(p_session_ids, array[]::uuid[])) as id) input_ids;

  with selected_sessions as (
    select sessions.id
    from public.sessions
    join (select distinct unnest(coalesce(p_session_ids, array[]::uuid[])) as id) input_ids
      on input_ids.id = sessions.id
  )
  select count(*)
  into v_matched_count
  from selected_sessions;

  if v_distinct_input_count <> v_matched_count then
    raise exception 'One or more sessions were not found.';
  end if;

  with selected_sessions as (
    select sessions.id
    from public.sessions
    join (select distinct unnest(coalesce(p_session_ids, array[]::uuid[])) as id) input_ids
      on input_ids.id = sessions.id
  ),
  updated as (
    update public.availability
    set
      status = p_status,
      comment = btrim(coalesce(p_comment, '')),
      updated_at = now()
    from selected_sessions
    where availability.session_id = selected_sessions.id
      and availability.teacher_id = p_target_teacher_id
      and (
        p_overwrite_existing
        or (
          availability.status = 'unknown'
          and btrim(coalesce(availability.comment, '')) = ''
        )
      )
    returning availability.session_id
  ),
  inserted as (
    insert into public.availability (
      session_id,
      teacher_id,
      status,
      comment,
      updated_at
    )
    select
      selected_sessions.id,
      p_target_teacher_id,
      p_status,
      btrim(coalesce(p_comment, '')),
      now()
    from selected_sessions
    where not exists (
      select 1
      from public.availability
      where availability.session_id = selected_sessions.id
        and availability.teacher_id = p_target_teacher_id
    )
    returning session_id
  )
  select
    (select count(*) from updated) + (select count(*) from inserted)
  into v_updated_count;

  v_skipped_count := v_matched_count - v_updated_count;

  if v_updated_count > 0 then
    select *
    into v_first_session
    from public.sessions
    where id = any(p_session_ids)
    order by date, start_time
    limit 1;

    v_status_phrase_self := case p_status
      when 'present' then 'qu''il sera présent'
      when 'absent' then 'qu''il sera absent'
      when 'maybe' then 'qu''il est peut-être disponible'
      else 'que sa disponibilité n''est pas renseignée'
    end;

    v_status_phrase_target := case p_status
      when 'present' then 'sera présent'
      when 'absent' then 'sera absent'
      when 'maybe' then 'est peut-être disponible'
      else 'n''a pas de disponibilité renseignée'
    end;

    if v_updated_count = 1 and v_first_session.id is not null then
      v_day_name := case extract(isodow from v_first_session.date)
        when 1 then 'lundi'
        when 2 then 'mardi'
        when 3 then 'mercredi'
        when 4 then 'jeudi'
        when 5 then 'vendredi'
        when 6 then 'samedi'
        else 'dimanche'
      end;

      v_month_name := case extract(month from v_first_session.date)
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

      v_course_date := concat(v_day_name, ' ', extract(day from v_first_session.date)::int, ' ', v_month_name);

      v_description := case
        when v_actor.id = v_target.id
          then concat(v_actor.name, ' a indiqué ', v_status_phrase_self, ' pour le cours ', v_first_session.title, ' du ', v_course_date, '.')
        else concat(v_actor.name, ' a indiqué que ', v_target.name, ' ', v_status_phrase_target, ' pour le cours ', v_first_session.title, ' du ', v_course_date, '.')
      end;
    else
      v_description := case
        when v_actor.id = v_target.id
          then concat(v_actor.name, ' a renseigné ', v_updated_count, ' disponibilités.')
        else concat(v_actor.name, ' a renseigné ', v_updated_count, ' disponibilités pour ', v_target.name, '.')
      end;
    end if;

    insert into public.change_log_entries (
      teacher_id,
      actor_teacher_id,
      type,
      description,
      metadata
    )
    values (
      v_target.id,
      v_actor.id,
      'availability_changed',
      v_description,
      jsonb_build_object(
        'targetTeacherId', v_target.id,
        'affectedSessionCount', v_updated_count,
        'selectedSessionIds', to_jsonb(p_session_ids),
        'status', p_status,
        'overwriteExisting', p_overwrite_existing,
        'skippedCount', v_skipped_count
      )
    );
  end if;

  target_teacher_id := p_target_teacher_id;
  status := p_status;
  matched_count := v_matched_count;
  updated_count := v_updated_count;
  skipped_count := v_skipped_count;
  return next;
end;
$$;

revoke execute on function public.bulk_update_availability(uuid, uuid[], text, text, boolean) from public;
revoke execute on function public.bulk_update_availability(uuid, uuid[], text, text, boolean) from anon;
grant execute on function public.bulk_update_availability(uuid, uuid[], text, text, boolean) to authenticated;
