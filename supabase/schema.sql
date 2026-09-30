-- =====================================================================
-- Occaz schema
-- Run this in the Supabase SQL editor for a fresh project.
-- =====================================================================

-- 0. email confirmation ON by default --------------------------------
-- Enable "Confirm email" under Authentication > Providers > Email.
-- Add your site URL to Authentication > URL Configuration > Redirect URLs:
--   https://6funt0ubitq04.space.minimax.io/**
--   http://localhost:5173/**
-- The auth.* config rows are managed by Supabase and may not be writable
-- via plain SQL on newer projects, so handle them in the dashboard.

-- 1. profiles ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  bio text,
  city text,
  phone text,
  preferences jsonb not null default '{}'::jsonb,
  role text not null default 'user',
  is_organizer boolean not null default false,  -- explicit opt-in flag
  status text not null default 'active',        -- 'active' | 'suspended' | 'pending'
  onboarded boolean not null default false,     -- completed welcome flow
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  -- also pre-create an organizer profile row so the user can opt in with
  -- one click instead of having to fill a long form
  base_slug := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'organizer'; end if;
  insert into public.organizer_profiles (id, display_name, slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    base_slug
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Promote first signed-in user to admin (convenience for solo dev).
create or replace function public.promote_first_user_to_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    update public.profiles set role = 'admin' where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists bootstrap_admin on public.profiles;
create trigger bootstrap_admin
  after insert on public.profiles
  for each row execute function public.promote_first_user_to_admin();

-- 2. categories --------------------------------------------------------
create table if not exists public.categories (
  id text primary key,
  name text not null,
  kind text not null check (kind in ('event', 'opportunity')),
  created_at timestamptz not null default now()
);

-- 3. events ------------------------------------------------------------
create table if not exists public.events (
  id text primary key,
  title text not null,
  description text,
  image text,
  gallery jsonb not null default '[]'::jsonb,
  category text,
  organizer text,
  city text,
  mode text check (mode in ('Online', 'Physical')) default 'Physical',
  date date,
  time text,
  location text,
  price numeric not null default 0,
  capacity int not null default 0,
  attendees int not null default 0,
  ticket_types jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. opportunities -----------------------------------------------------
create table if not exists public.opportunities (
  id text primary key,
  title text not null,
  description text,
  image text,
  gallery jsonb not null default '[]'::jsonb,
  category text,
  organizer text,
  city text,
  mode text check (mode in ('Online', 'Physical')) default 'Online',
  deadline date,
  requirements jsonb not null default '[]'::jsonb,
  eligibility jsonb not null default '[]'::jsonb,
  apply_url text,
  stipend text,
  price numeric not null default 0,
  currency text not null default 'PKR',
  featured boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. RLS ----------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.events       enable row level security;
alter table public.opportunities enable row level security;
alter table public.categories   enable row level security;

-- helpers ---------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'admin'
  );
$$;

-- profiles --------------------------------------------------------------
drop policy if exists "profile self read"   on public.profiles;
drop policy if exists "profile self update" on public.profiles;
create policy "profile self read"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "profile self update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- events ----------------------------------------------------------------
drop policy if exists "events public read"  on public.events;
drop policy if exists "events admin write"  on public.events;
create policy "events public read"
  on public.events for select
  using (true);                                -- browse-able by anyone

create policy "events admin write"
  on public.events for all
  using      (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- opportunities ---------------------------------------------------------
drop policy if exists "opps public read"  on public.opportunities;
drop policy if exists "opps admin write"  on public.opportunities;
create policy "opps public read"
  on public.opportunities for select
  using (true);

create policy "opps admin write"
  on public.opportunities for all
  using      (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- categories ------------------------------------------------------------
drop policy if exists "cats public read"  on public.categories;
drop policy if exists "cats admin write"  on public.categories;
create policy "cats public read"
  on public.categories for select using (true);
create policy "cats admin write"
  on public.categories for all
  using      (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- 6. tickets (user-owned) -----------------------------------------------
create table if not exists public.tickets (
  id text primary key,
  user_id uuid references auth.users (id) on delete cascade,
  event_id text references public.events (id) on delete cascade,
  ticket_type_id text,
  ticket_type_name text,
  attendee_name text,
  attendee_email text,
  attendee_phone text,
  price_paid numeric not null default 0,
  currency text not null default 'PKR',
  status text not null default 'active',     -- active | used | refunded | cancelled
  qr_code text,
  notify_email boolean not null default true,
  notify_whatsapp boolean not null default false,
  purchased_at timestamptz not null default now()
);

alter table public.tickets enable row level security;

drop policy if exists "tickets self read"   on public.tickets;
drop policy if exists "tickets self write"  on public.tickets;
create policy "tickets self read"
  on public.tickets for select
  using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "tickets self write"
  on public.tickets for all
  using      (auth.uid() = user_id or public.is_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_admin(auth.uid()));

-- 7. seed (anon-callable, idempotent, only seeds if tables are empty) ----
create or replace function public.seed_demo_data(
  p_events jsonb,
  p_opportunities jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  e_count int;
  o_count int;
  e_inserted int := 0;
  o_inserted int := 0;
begin
  select count(*) into e_count from public.events;
  select count(*) into o_count from public.opportunities;

  if e_count = 0 and p_events is not null then
    insert into public.events (
      id, title, description, image_url, images, category, organizer,
      city, mode, date, time, location, price, capacity, attendees,
      ticket_types, featured, published
    )
    select
      (r->>'id')::text,
      (r->>'title')::text,
      r->>'description',
      nullif(r->>'image', ''),
      coalesce(
        case when jsonb_typeof(r->'gallery') = 'array' then r->'gallery' end,
        (case when nullif(r->>'image','') is not null then jsonb_build_array(r->>'image') end),
        '[]'::jsonb
      ),
      r->>'category',
      r->>'organizer',
      r->>'city',
      r->>'mode',
      nullif(r->>'date', '')::date,
      r->>'time',
      coalesce(r->>'location', r->>'city'),
      coalesce((r->>'price')::numeric, 0),
      coalesce((r->>'capacity')::int, 0),
      coalesce((r->>'attendees')::int, 0),
      coalesce((r->'ticket_types')::jsonb, '[]'::jsonb),
      coalesce((r->>'featured')::boolean, false),
      coalesce((r->>'published')::boolean, true)
    from jsonb_array_elements(p_events) as r;
    e_inserted := jsonb_array_length(p_events);
  end if;

  if o_count = 0 and p_opportunities is not null then
    insert into public.opportunities (
      id, title, description, images, category, organizer,
      city, mode, deadline, requirements, eligibility, apply_url,
      stipend, price, currency, featured, published
    )
    select
      (r->>'id')::text,
      (r->>'title')::text,
      r->>'description',
      coalesce(
        case when jsonb_typeof(r->'gallery') = 'array' then r->'gallery' end,
        (case when nullif(r->>'image','') is not null then jsonb_build_array(r->>'image') end),
        '[]'::jsonb
      ),
      r->>'category',
      r->>'organizer',
      r->>'city',
      r->>'mode',
      nullif(r->>'deadline', '')::date,
      coalesce((r->'requirements')::jsonb, '[]'::jsonb),
      coalesce((r->'eligibility')::jsonb, '[]'::jsonb),
      r->>'apply_url',
      r->>'stipend',
      coalesce((r->>'price')::numeric, 0),
      coalesce(r->>'currency', 'PKR'),
      coalesce((r->>'featured')::boolean, false),
      coalesce((r->>'published')::boolean, true)
    from jsonb_array_elements(p_opportunities) as r;
    o_inserted := jsonb_array_length(p_opportunities);
  end if;

  return jsonb_build_object(
    'eventsInserted', e_inserted,
    'oppsInserted', o_inserted
  );
end;
$$;

revoke all on function public.seed_demo_data(jsonb, jsonb) from public;
grant execute on function public.seed_demo_data(jsonb, jsonb) to anon, authenticated;

-- 8. realtime -----------------------------------------------------------
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.opportunities;

-- 9. organizer subscriptions --------------------------------------------
-- Plans: free | pro | business
create table if not exists public.organizer_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  slug text unique,
  logo text,
  bio text,
  website text,
  twitter text,
  instagram text,
  linkedin text,
  verified boolean not null default false,
  plan text not null default 'free',         -- free | pro | business
  feature_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id text primary key,
  organizer_id uuid not null references public.organizer_profiles (id) on delete cascade,
  plan text not null,                       -- free | pro | business
  status text not null default 'pending',    -- pending | active | past_due | cancelled | expired
  started_at timestamptz not null default now(),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null,   -- when the paid period ends
  cancel_at timestamptz,
  cancelled_at timestamptz,
  gateway text,                              -- jazzcash | easypaisa | stripe | manual
  gateway_subscription_id text,
  amount numeric not null default 0,
  currency text not null default 'PKR',
  interval text not null default 'monthly',  -- monthly | yearly
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id text primary key,
  subscription_id text references public.subscriptions (id) on delete set null,
  organizer_id uuid not null references public.organizer_profiles (id) on delete cascade,
  amount numeric not null,
  currency text not null default 'PKR',
  status text not null default 'pending',    -- pending | succeeded | failed | refunded
  gateway text,                              -- jazzcash | easypaisa | stripe | manual
  gateway_payment_id text,
  gateway_response jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_organizer_idx
  on public.subscriptions (organizer_id, status);
create index if not exists payments_organizer_idx
  on public.payments (organizer_id, created_at desc);

-- RLS ------------------------------------------------------------------
alter table public.organizer_profiles enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.payments             enable row level security;

-- organizer_profiles: anyone can read the public parts; only the owner
-- can update. Admin can do anything.
drop policy if exists "org profile public read"   on public.organizer_profiles;
drop policy if exists "org profile self update"  on public.organizer_profiles;
drop policy if exists "org profile admin write"  on public.organizer_profiles;
create policy "org profile public read"
  on public.organizer_profiles for select using (true);
create policy "org profile self update"
  on public.organizer_profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "org profile admin write"
  on public.organizer_profiles for all
  using      (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- subscriptions: only the owner + admin can read/write
drop policy if exists "subs self read"   on public.subscriptions;
drop policy if exists "subs admin write" on public.subscriptions;
create policy "subs self read"
  on public.subscriptions for select
  using (auth.uid() = organizer_id or public.is_admin(auth.uid()));
create policy "subs admin write"
  on public.subscriptions for all
  using      (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- payments: only the owner + admin can read
drop policy if exists "payments self read"   on public.payments;
drop policy if exists "payments admin write" on public.payments;
create policy "payments self read"
  on public.payments for select
  using (auth.uid() = organizer_id or public.is_admin(auth.uid()));
create policy "payments admin write"
  on public.payments for all
  using      (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- helper: read the active plan for a user (default: free)
create or replace function public.get_user_plan(uid uuid)
returns text
language sql
stable
as $fn$
  select coalesce(
    (select plan from public.subscriptions
       where organizer_id = uid and status = 'active'
       order by current_period_end desc
       limit 1),
    'free'
  );
$fn$;

-- Server-side enforcement: prevent non-Pro users from setting featured=true
create or replace function public.enforce_event_featured()
returns trigger
language plpgsql
as $fn$
declare
  user_plan text;
  user_id uuid;
begin
  -- infer the organizer: events table has no organizer_id yet, so we look
  -- up by matching organizer name -> organizer_profiles.display_name.
  -- (Replace with explicit organizer_id once that column is added.)
  select id into user_id
    from public.organizer_profiles
   where display_name = NEW.organizer
   limit 1;

  if user_id is not null then
    user_plan := public.get_user_plan(user_id);
    if NEW.featured = true and user_plan = 'free' then
      raise exception 'Featured placement requires Occaz Pro or Business. Current plan: %', user_plan
        using errcode = 'P0001';
    end if;
  end if;
  return NEW;
end;
$fn$;

drop trigger if exists trg_enforce_event_featured on public.events;
create trigger trg_enforce_event_featured
  before insert or update on public.events
  for each row execute function public.enforce_event_featured();

-- Server-side enforcement: cap on events per month
create or replace function public.enforce_event_monthly_limit()
returns trigger
language plpgsql
as $fn$
declare
  user_id uuid;
  user_plan text;
  max_per_month int;
  this_month_count int;
begin
  select id into user_id
    from public.organizer_profiles
   where display_name = NEW.organizer
   limit 1;
  if user_id is null then
    return NEW;
  end if;
  user_plan := public.get_user_plan(user_id);
  max_per_month := case user_plan
    when 'business' then 9999
    when 'pro' then 25
    else 3
  end;
  select count(*) into this_month_count
    from public.events
   where organizer = NEW.organizer
     and date_trunc('month', created_at) = date_trunc('month', now());
  if this_month_count >= max_per_month then
    raise exception 'Monthly event limit reached for % plan. Limit: %, current: %',
      user_plan, max_per_month, this_month_count
      using errcode = 'P0002';
  end if;
  return NEW;
end;
$fn$;

drop trigger if exists trg_enforce_event_monthly on public.events;
create trigger trg_enforce_event_monthly
  before insert on public.events
  for each row execute function public.enforce_event_monthly_limit();

-- helper: list feature flags for the user's plan
create or replace function public.get_user_plan_features(uid uuid)
returns jsonb
language sql
stable
as $fn$
  select case public.get_user_plan(uid)
    when 'business' then jsonb_build_object(
      'maxEventsPerMonth', 9999,
      'canFeature', true,
      'canCustomizeProfile', true,
      'hasAdvancedAnalytics', true,
      'hasPromotionalTools', true,
      'hasAudienceInsights', true,
      'hasMultipleOrganizers', true,
      'hasCampaignTools', true,
      'hasDedicatedSupport', true,
      'hasPriorityPromotion', true
    )
    when 'pro' then jsonb_build_object(
      'maxEventsPerMonth', 25,
      'canFeature', true,
      'canCustomizeProfile', true,
      'hasAdvancedAnalytics', false,
      'hasPromotionalTools', true,
      'hasAudienceInsights', true,
      'hasMultipleOrganizers', false,
      'hasCampaignTools', false,
      'hasDedicatedSupport', false,
      'hasPriorityPromotion', false
    )
    else jsonb_build_object(
      'maxEventsPerMonth', 3,
      'canFeature', false,
      'canCustomizeProfile', false,
      'hasAdvancedAnalytics', false,
      'hasPromotionalTools', false,
      'hasAudienceInsights', false,
      'hasMultipleOrganizers', false,
      'hasCampaignTools', false,
      'hasDedicatedSupport', false,
      'hasPriorityPromotion', false
    )
  end;
$fn$;

-- 10. coupons (Business plan perk) --------------------------------------
create table if not exists public.coupons (
  id text primary key,
  code text unique not null,
  organizer_id uuid references public.organizer_profiles (id) on delete set null,
  plan text not null default 'any',          -- any | pro | business
  kind text not null check (kind in ('percent', 'fixed')),
  amount numeric not null,
  max_redemptions int not null default 0,    -- 0 = unlimited
  redemptions int not null default 0,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;
drop policy if exists "coupons public read" on public.coupons;
drop policy if exists "coupons admin write" on public.coupons;
drop policy if exists "coupons self read"  on public.coupons;
create policy "coupons public read" on public.coupons for select using (active = true);
create policy "coupons self read"
  on public.coupons for select using (auth.uid() = organizer_id);
create policy "coupons admin write" on public.coupons for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create or replace function public.redeem_coupon(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  c record;
begin
  select * into c from public.coupons where code = p_code and active = true for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invalid code');
  end if;
  if c.max_redemptions > 0 and c.redemptions >= c.max_redemptions then
    return jsonb_build_object('ok', false, 'error', 'Code fully redeemed');
  end if;
  if c.valid_until is not null and c.valid_until < now() then
    return jsonb_build_object('ok', false, 'error', 'Code expired');
  end if;
  update public.coupons set redemptions = redemptions + 1 where id = c.id;
  return jsonb_build_object('ok', true, 'code', c.code, 'kind', c.kind, 'amount', c.amount);
end;
$fn$;
-- Auto-flip is_organizer when someone subscribes to a paid plan
create or replace function public.mark_user_as_organizer()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.plan in ('pro', 'business') and new.status = 'active' then
    update public.profiles set is_organizer = true where id = new.organizer_id;
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_mark_organizer on public.subscriptions;
create trigger trg_mark_organizer
  after insert or update on public.subscriptions
  for each row execute function public.mark_user_as_organizer();

grant execute on function public.redeem_coupon(text) to anon, authenticated;

-- 11. dev helper: confirm a user without email (rate-limit escape hatch) -

-- 12a. profile columns the app expects (idempotent) --------------------
alter table public.profiles
  add column if not exists plan text not null default 'free',
  add column if not exists bio text,
  add column if not exists city text,
  add column if not exists phone text,
  add column if not exists preferences jsonb not null default '{}'::jsonb,
  add column if not exists is_organizer boolean not null default false,
  add column if not exists onboarded boolean not null default false;

-- 12. storage bucket for public images (event/opportunity/organizer) -----
-- "public" is a reserved bucket name in Supabase so we use "occaz".
-- Create the bucket in the Supabase Dashboard → Storage → New bucket:
--   Name: occaz
--   Public bucket: ON (toggle)
-- Then run the policies below to allow uploads.
--
-- Only safe to insert once — guard with on conflict:
insert into storage.buckets (id, name, public)
values ('occaz', 'occaz', true)
on conflict (id) do nothing;

-- 13. policies for the occaz storage bucket
drop policy if exists "occaz read" on storage.objects;
drop policy if exists "occaz upload" on storage.objects;
drop policy if exists "occaz update" on storage.objects;
drop policy if exists "occaz delete" on storage.objects;
create policy "occaz read"
  on storage.objects for select
  using (bucket_id = 'occaz');
create policy "occaz upload"
  on storage.objects for insert
  with check (
    bucket_id = 'occaz'
    and auth.role() = 'authenticated'
  );
create policy "occaz update"
  on storage.objects for update
  using (
    bucket_id = 'occaz'
    and (auth.role() = 'authenticated' or public.is_admin(auth.uid()))
  );
create policy "occaz delete"
  on storage.objects for delete
  using (
    bucket_id = 'occaz'
    and (auth.role() = 'authenticated' or public.is_admin(auth.uid()))
  );

-- 14. dev helper: confirm a user without email (rate-limit escape hatch) -
create or replace function public.dev_confirm_user(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  u_id uuid;
begin
  select id into u_id from auth.users where email = p_email;
  if u_id is null then
    return jsonb_build_object('ok', false, 'error', 'No account with that email');
  end if;
  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now()),
         confirmed_at       = coalesce(confirmed_at, now())
   where id = u_id;
  return jsonb_build_object('ok', true, 'user_id', u_id);
end;
$fn$;

grant execute on function public.dev_confirm_user(text) to anon, authenticated;

-- 12. admin user management (delete / suspend / change role) -----------
-- Uses SECURITY DEFINER so the admin client can delete from auth.users
-- (which the anon key cannot do directly).
create or replace function public.admin_delete_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin(auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;
  if p_user_id = auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'You cannot delete your own account from here');
  end if;
  delete from auth.users where id = p_user_id;
  return jsonb_build_object('ok', true);
end;
$fn$;

grant execute on function public.admin_delete_user(uuid) to authenticated;

create or replace function public.admin_set_user_status(p_user_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin(auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;
  update public.profiles
     set status = p_status, updated_at = now()
   where id = p_user_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Profile not found');
  end if;
  if p_status = 'suspended' then
    update auth.users set banned_until = '2099-12-31T00:00:00Z' where id = p_user_id;
  elsif p_status = 'active' then
    update auth.users set banned_until = null where id = p_user_id;
  end if;
  return jsonb_build_object('ok', true);
end;
$fn$;

grant execute on function public.admin_set_user_status(uuid, text) to authenticated;

create or replace function public.admin_set_user_role(p_user_id uuid, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin(auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;
  update public.profiles
     set role = p_role, updated_at = now()
   where id = p_user_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Profile not found');
  end if;
  return jsonb_build_object('ok', true);
end;
$fn$;

grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

-- admin: set feature overrides on an organizer (bypasses plan gate)
create or replace function public.admin_set_organizer_overrides(
  p_organizer_id uuid,
  p_overrides jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not public.is_admin(auth.uid()) then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;
  update public.organizer_profiles
     set feature_overrides = coalesce(p_overrides, '{}'::jsonb),
         updated_at = now()
   where id = p_organizer_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Organizer not found');
  end if;
  return jsonb_build_object('ok', true);
end;
$fn$;

grant execute on function public.admin_set_organizer_overrides(uuid, jsonb) to authenticated;
