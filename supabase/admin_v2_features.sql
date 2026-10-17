-- ============================================================
-- Occaz — Admin v2 Features
-- ============================================================
-- Run this in Supabase → SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run multiple times.
--
-- This adds the data layer the new admin pages need:
--   * subscriptions + payments RLS read for admin
--   * audit_log table (admin actions log)
--   * system_events table (errors, failed uploads, etc.)
--   * admin_notes table (internal comments on any row)
-- ============================================================

-- ============================================================
-- 1) Audit log table
-- ============================================================

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  action text not null,           -- e.g. 'event.published', 'organizer.approved', 'refund.issued'
  target_type text,                -- e.g. 'event', 'organizer', 'registration', 'payout', 'plan'
  target_id text,
  meta jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_actor on public.audit_log(actor_id, created_at desc);
create index if not exists idx_audit_log_target on public.audit_log(target_type, target_id);
create index if not exists idx_audit_log_action on public.audit_log(action, created_at desc);
create index if not exists idx_audit_log_created on public.audit_log(created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_admin_read" on public.audit_log;
create policy "audit_log_admin_read"
  on public.audit_log
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "audit_log_admin_write" on public.audit_log;
create policy "audit_log_admin_write"
  on public.audit_log
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ============================================================
-- 2) System events table (monitoring)
-- ============================================================

create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,              -- 'upload_failed' | 'payment_failed' | 'notification_failed' | 'rls_denial' | 'webhook_failed' | 'job_failed' | 'other'
  severity text not null default 'error', -- 'info' | 'warning' | 'error' | 'critical'
  source text,                     -- e.g. 'storage.upload', 'billing.organizer_plan', 'email.send'
  message text not null,
  details jsonb not null default '{}'::jsonb,
  user_id uuid references public.profiles(id) on delete set null,
  resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_system_events_kind on public.system_events(kind, created_at desc);
create index if not exists idx_system_events_severity on public.system_events(severity, created_at desc);
create index if not exists idx_system_events_resolved on public.system_events(resolved, created_at desc);
create index if not exists idx_system_events_created on public.system_events(created_at desc);

alter table public.system_events enable row level security;

drop policy if exists "system_events_admin_read" on public.system_events;
create policy "system_events_admin_read"
  on public.system_events
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "system_events_admin_write" on public.system_events;
create policy "system_events_admin_write"
  on public.system_events
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ============================================================
-- 3) Admin notes (internal comments on any row)
-- ============================================================

create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,       -- 'organizer' | 'event' | 'user' | 'registration' | 'payout' | 'plan_payment'
  target_id text not null,
  author_id uuid references public.profiles(id) on delete set null,
  author_email text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_notes_target on public.admin_notes(target_type, target_id, created_at desc);
create index if not exists idx_admin_notes_author on public.admin_notes(author_id, created_at desc);

alter table public.admin_notes enable row level security;

drop policy if exists "admin_notes_admin_read" on public.admin_notes;
create policy "admin_notes_admin_read"
  on public.admin_notes
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "admin_notes_admin_write" on public.admin_notes;
create policy "admin_notes_admin_write"
  on public.admin_notes
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ============================================================
-- 4) Make sure admin can read subscriptions & payments
--    (organizer_profiles policy already exists)
-- ============================================================

drop policy if exists "subscriptions_admin_read" on public.subscriptions;
create policy "subscriptions_admin_read"
  on public.subscriptions
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "payments_admin_read" on public.payments;
create policy "payments_admin_read"
  on public.payments
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ============================================================
-- 5) Helper function: write_audit_log
-- ============================================================

create or replace function public.write_audit_log(
  p_action text,
  p_target_type text default null,
  p_target_id text default null,
  p_meta jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_actor uuid := auth.uid();
  v_email text;
  v_id uuid;
begin
  select email into v_email from public.profiles where id = v_actor;
  insert into public.audit_log(actor_id, actor_email, action, target_type, target_id, meta)
  values (v_actor, v_email, p_action, p_target_type, p_target_id, p_meta)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.write_audit_log(text, text, text, jsonb) to authenticated;


-- ============================================================
-- 6) Helper function: write_system_event
-- ============================================================

create or replace function public.write_system_event(
  p_kind text,
  p_severity text default 'error',
  p_source text default null,
  p_message text default null,
  p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  insert into public.system_events(kind, severity, source, message, details, user_id)
  values (p_kind, p_severity, p_source, coalesce(p_message, p_kind), p_details, v_actor)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.write_system_event(text, text, text, text, jsonb) to authenticated;


-- ============================================================
-- 7) Admin can resolve system events
-- ============================================================

create or replace function public.resolve_system_event(p_id uuid, p_resolved boolean default true)
returns void
language sql
security definer
as $$
  update public.system_events
  set resolved = p_resolved,
      resolved_at = case when p_resolved then now() else null end,
      resolved_by = case when p_resolved then auth.uid() else null end
  where id = p_id;
$$;

grant execute on function public.resolve_system_event(uuid, boolean) to authenticated;


-- ============================================================
-- 8) Seed a few demo system events so the page isn't empty
--    (only if the table is empty)
-- ============================================================

do $$
begin
  if not exists (select 1 from public.system_events) then
    insert into public.system_events (kind, severity, source, message, details) values
      ('payment_failed', 'warning', 'billing.organizer_plan', 'JazzCash payment callback timeout', '{"ref":"OCZ-9981","amount":12000}'::jsonb),
      ('upload_failed', 'info', 'storage.upload', 'Image upload exceeded 5MB limit', '{"filename":"poster.png","size":7340032}'::jsonb),
      ('notification_failed', 'warning', 'email.send', 'Resend API rate-limited', '{"to":"organizer@example.com"}'::jsonb),
      ('webhook_failed', 'error', 'billing.organizer_plan', 'Manual payment approval webhook 500', '{"ref":"OCZ-7740"}'::jsonb);
  end if;
end $$;
