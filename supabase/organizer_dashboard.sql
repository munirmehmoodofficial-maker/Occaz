-- ============================================================
-- OCCAZ Organizer Dashboard — Data model extensions
-- ============================================================
-- Idempotent. Run once. Adds:
--   1. events.organizer_id (FK to auth.users)
--   2. registrations columns: organizer_id, payment_status,
--      payment_method, commission_amount, check_in_at,
--      check_in_by, refunded_at
--   3. event_views table (for analytics section)
--   4. payout_requests table (for finance section)
--   5. organizer_team table (for team section — Phase 3 but schema is here)
--   6. support_tickets table (for support section)
-- ============================================================

-- 1) events.organizer_id
alter table public.events
  add column if not exists organizer_id uuid references auth.users (id) on delete set null;
create index if not exists idx_events_organizer on public.events (organizer_id);
create index if not exists idx_events_published on public.events (published);
create index if not exists idx_events_date on public.events (date);

-- 2) registrations extra columns
alter table public.registrations
  add column if not exists organizer_id uuid references auth.users (id) on delete cascade;
alter table public.registrations
  add column if not exists payment_status text not null default 'paid'
    check (payment_status in ('paid', 'pending', 'cancelled', 'refunded'));
alter table public.registrations
  add column if not exists payment_method text;
alter table public.registrations
  add column if not exists commission_amount numeric not null default 0;
alter table public.registrations
  add column if not exists check_in_at timestamptz;
alter table public.registrations
  add column if not exists check_in_by uuid references auth.users (id) on delete set null;
alter table public.registrations
  add column if not exists refunded_at timestamptz;
alter table public.registrations
  add column if not exists refunded_amount numeric;
alter table public.registrations
  add column if not exists notes text;

create index if not exists idx_regs_organizer on public.registrations (organizer_id);
create index if not exists idx_regs_event on public.registrations (event_id);
create index if not exists idx_regs_status on public.registrations (status);
create index if not exists idx_regs_payment on public.registrations (payment_status);
create index if not exists idx_regs_ticket_code on public.registrations (ticket_code);

-- 3) event_views — for analytics (page views per event)
create table if not exists public.event_views (
  id bigserial primary key,
  event_id text not null references public.events (id) on delete cascade,
  organizer_id uuid references auth.users (id) on delete cascade,
  viewer_id uuid references auth.users (id) on delete set null,
  source text,
  created_at timestamptz not null default now()
);
create index if not exists idx_event_views_event on public.event_views (event_id);
create index if not exists idx_event_views_org on public.event_views (organizer_id);
create index if not exists idx_event_views_created on public.event_views (created_at);

alter table public.event_views enable row level security;

-- Anyone can insert a view (public pages)
drop policy if exists "event views public insert" on public.event_views;
create policy "event views public insert"
  on public.event_views for insert
  with check (true);

-- Organizer can see their own views
drop policy if exists "event views organizer read" on public.event_views;
create policy "event views organizer read"
  on public.event_views for select
  using (organizer_id = auth.uid() or public.is_admin(auth.uid()));

-- 4) payout_requests
create table if not exists public.payout_requests (
  id text primary key,
  organizer_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null,
  currency text not null default 'PKR',
  method text not null check (method in ('bank', 'jazzcash', 'easypaisa')),
  account_title text,
  account_number text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id),
  transaction_ref text,
  created_at timestamptz not null default now()
);
create index if not exists idx_payouts_org on public.payout_requests (organizer_id);
create index if not exists idx_payouts_status on public.payout_requests (status);

alter table public.payout_requests enable row level security;

drop policy if exists "payouts organizer read" on public.payout_requests;
create policy "payouts organizer read"
  on public.payout_requests for select
  using (organizer_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "payouts organizer insert" on public.payout_requests;
create policy "payouts organizer insert"
  on public.payout_requests for insert
  with check (organizer_id = auth.uid());

drop policy if exists "payouts admin update" on public.payout_requests;
create policy "payouts admin update"
  on public.payout_requests for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 5) organizer_team
create table if not exists public.organizer_team (
  id text primary key,
  organizer_id uuid not null references auth.users (id) on delete cascade,
  member_id uuid references auth.users (id) on delete cascade,
  member_email text not null,
  role text not null default 'event_manager' check (role in ('event_manager', 'checkin_staff', 'finance', 'admin')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz
);
create index if not exists idx_team_org on public.organizer_team (organizer_id);

alter table public.organizer_team enable row level security;

drop policy if exists "team organizer read" on public.organizer_team;
create policy "team organizer read"
  on public.organizer_team for select
  using (organizer_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "team organizer write" on public.organizer_team;
create policy "team organizer write"
  on public.organizer_team for all
  using (organizer_id = auth.uid() or public.is_admin(auth.uid()))
  with check (organizer_id = auth.uid() or public.is_admin(auth.uid()));

-- 6) support_tickets
create table if not exists public.support_tickets (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  organizer_id uuid references auth.users (id) on delete set null,
  category text not null check (category in ('general', 'payment', 'event_issue', 'fraud', 'bug')),
  subject text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  admin_reply text,
  replied_at timestamptz,
  replied_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tickets_user on public.support_tickets (user_id);
create index if not exists idx_tickets_org on public.support_tickets (organizer_id);
create index if not exists idx_tickets_status on public.support_tickets (status);

alter table public.support_tickets enable row level security;

drop policy if exists "tickets user read" on public.support_tickets;
create policy "tickets user read"
  on public.support_tickets for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "tickets user insert" on public.support_tickets;
create policy "tickets user insert"
  on public.support_tickets for insert
  with check (user_id = auth.uid());

drop policy if exists "tickets admin update" on public.support_tickets;
create policy "tickets admin update"
  on public.support_tickets for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 7) login_sessions — for Settings section
create table if not exists public.login_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  ip text,
  user_agent text,
  city text,
  country text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_sessions_user on public.login_sessions (user_id);

alter table public.login_sessions enable row level security;

drop policy if exists "sessions user read" on public.login_sessions;
create policy "sessions user read"
  on public.login_sessions for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "sessions user delete" on public.login_sessions;
create policy "sessions user delete"
  on public.login_sessions for delete
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- 8) Helper view: organizer_metrics
-- One row per organizer with aggregated sales/registration counts
create or replace view public.organizer_metrics as
select
  e.organizer_id as user_id,
  count(distinct e.id) filter (where e.published) as published_events,
  count(distinct e.id) filter (where not e.published) as draft_events,
  count(distinct e.id) filter (where e.date < current_date) as past_events,
  count(distinct e.id) filter (where e.date >= current_date) as upcoming_events,
  count(r.id) as total_registrations,
  count(r.id) filter (where r.status = 'confirmed') as confirmed_registrations,
  coalesce(sum(r.total) filter (where r.payment_status = 'paid'), 0) as total_revenue,
  coalesce(sum(r.commission_amount) filter (where r.payment_status = 'paid'), 0) as total_commission,
  coalesce(sum(r.total - r.commission_amount) filter (where r.payment_status = 'paid'), 0) as net_revenue
from public.events e
left join public.registrations r on r.event_id = e.id
where e.organizer_id is not null
group by e.organizer_id;

grant select on public.organizer_metrics to anon, authenticated;

-- Done!
select 'Organizer dashboard schema ready' as status;
