-- Additive migration for Web Push subscriptions.
-- Run once in Supabase SQL Editor on an existing project, after the existing auth/RLS setup.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_teacher_id_idx
  on public.push_subscriptions(teacher_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "teachers can read own push subscriptions" on public.push_subscriptions;
create policy "teachers can read own push subscriptions"
on public.push_subscriptions
for select
to authenticated
using (teacher_id = public.current_teacher_id());

drop policy if exists "teachers can insert own push subscriptions" on public.push_subscriptions;
create policy "teachers can insert own push subscriptions"
on public.push_subscriptions
for insert
to authenticated
with check (teacher_id = public.current_teacher_id());

drop policy if exists "teachers can update own push subscriptions" on public.push_subscriptions;
create policy "teachers can update own push subscriptions"
on public.push_subscriptions
for update
to authenticated
using (teacher_id = public.current_teacher_id())
with check (teacher_id = public.current_teacher_id());

drop policy if exists "teachers can delete own push subscriptions" on public.push_subscriptions;
create policy "teachers can delete own push subscriptions"
on public.push_subscriptions
for delete
to authenticated
using (teacher_id = public.current_teacher_id());

revoke all on table public.push_subscriptions from anon, authenticated;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;
