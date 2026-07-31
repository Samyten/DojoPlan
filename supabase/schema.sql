-- Supabase schema for the dojo planning app.
-- Production readiness warning:
-- This schema is intended to be used with supabase/rls.sql before real teacher use.
-- The frontend must use the anon key only. Never expose the service role key.

create extension if not exists pgcrypto;

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  role text not null check (role in ('super_admin', 'admin', 'teacher')),
  display_order integer,
  created_at timestamptz not null default now()
);

alter table public.teachers
  add column if not exists display_order integer;

alter table public.teachers drop constraint if exists teachers_role_check;
alter table public.teachers
  add constraint teachers_role_check check (role in ('super_admin', 'admin', 'teacher'));

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  location text,
  lesson_plan text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists availability (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  teacher_id uuid not null references teachers(id) on delete cascade,
  status text not null check (status in ('present', 'absent', 'maybe', 'unknown')),
  comment text,
  updated_at timestamptz not null default now(),
  unique (session_id, teacher_id)
);

create table if not exists change_log_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete set null,
  teacher_id uuid references teachers(id) on delete set null,
  actor_teacher_id uuid references teachers(id) on delete set null,
  type text not null,
  description text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists notification_read_state (
  teacher_id uuid primary key references teachers(id) on delete cascade,
  last_read_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists forum_messages (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id) on delete set null,
  author_name text not null,
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists forum_read_state (
  teacher_id uuid primary key references teachers(id) on delete cascade,
  last_read_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists sessions_date_idx on sessions(date);
create index if not exists availability_session_id_idx on availability(session_id);
create index if not exists availability_teacher_id_idx on availability(teacher_id);
create index if not exists change_log_entries_created_at_desc_idx
  on change_log_entries(created_at desc);
create index if not exists forum_messages_created_at_desc_idx
  on forum_messages(created_at desc);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sessions_set_updated_at on sessions;
create trigger sessions_set_updated_at
before update on sessions
for each row execute function set_updated_at();

-- Run supabase/rls.sql after this file to enable row level security.
-- Run supabase/rpc.sql after RLS to add narrow teacher lesson-content editing.
