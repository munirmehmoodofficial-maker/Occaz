-- ============================================================
-- Occaz — All-in-one Supabase setup
-- ============================================================
-- Run this in Supabase → SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run multiple times.
-- ============================================================

-- ============================================================
-- 1) Add missing columns on organizer_profiles
-- ============================================================

do $$
begin
  alter table public.organizer_profiles add column if not exists is_published boolean not null default false;
  alter table public.organizer_profiles add column if not exists verification_status text not null default 'pending';
  alter table public.organizer_profiles add column if not exists cover_image text;
  alter table public.organizer_profiles add column if not exists instagram text;
  alter table public.organizer_profiles add column if not exists facebook text;
  alter table public.organizer_profiles add column if not exists tiktok text;
  alter table public.organizer_profiles add column if not exists contact_email text;
  alter table public.organizer_profiles add column if not exists contact_phone text;
  alter table public.organizer_profiles add column if not exists address text;
  alter table public.organizer_profiles add column if not exists operating_cities text[] default '{}'::text[];
  alter table public.organizer_profiles add column if not exists organizer_type text default 'individual';
  alter table public.organizer_profiles add column if not exists phone text;
  alter table public.organizer_profiles add column if not exists plan text;
  alter table public.organizer_profiles add column if not exists feature_overrides jsonb not null default '{}'::jsonb;
  alter table public.organizer_profiles add column if not exists updated_at timestamptz not null default now();
  alter table public.organizer_profiles add column if not exists is_organizer boolean not null default false;
exception when others then
  raise notice 'organizer_profiles column add skipped: %', SQLERRM;
end $$;

create index if not exists idx_organizer_profiles_plan on public.organizer_profiles(plan);
create index if not exists idx_organizer_profiles_verification on public.organizer_profiles(verification_status);
create index if not exists idx_organizer_profiles_published on public.organizer_profiles(is_published);
create index if not exists idx_organizer_profiles_slug on public.organizer_profiles(slug);

-- ============================================================
-- 2) Add is_organizer on profiles
-- ============================================================
alter table public.profiles
  add column if not exists is_organizer boolean not null default false;

-- ============================================================
-- 3) RLS policies: admin can INSERT/UPDATE any profile
-- ============================================================
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profile admin insert') then
    drop policy "profile admin insert" on public.profiles;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profile admin update') then
    drop policy "profile admin update" on public.profiles;
  end if;
exception when others then
  raise notice 'policy drop skipped: %', SQLERRM;
end $$;

create policy "profile admin insert"
  on public.profiles for insert
  with check (public.is_admin(auth.uid()));

create policy "profile admin update"
  on public.profiles for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- 4) Robust handle_new_user trigger
--    (only creates profile; organizer_profiles is created by app code)
--    ALSO auto-confirms the email so signup doesn't get blocked by
--    the Supabase email rate limit during development.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_org boolean;
begin
  is_org := coalesce(lower(new.raw_user_meta_data ->> 'as_organizer'), 'false') = 'true';

  begin
    insert into public.profiles (id, email, full_name, is_organizer)
    values (
      new.id,
      new.email,
      coalesce(
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        split_part(new.email, '@', 1)
      ),
      is_org
    )
    on conflict (id) do update
      set is_organizer = excluded.is_organizer or public.profiles.is_organizer,
          email        = excluded.email,
          full_name    = coalesce(excluded.full_name, public.profiles.full_name);
  exception when others then
    raise exception 'handle_new_user: profiles insert failed: % (SQLSTATE %)',
      SQLERRM, SQLSTATE;
  end;

  -- DEV-ONLY: auto-confirm the user at signup so the email rate limit
  -- doesn't block development signups. Remove this block when you
  -- configure a real SMTP provider in Supabase Auth settings.
  begin
    update auth.users
       set email_confirmed_at = coalesce(email_confirmed_at, now()),
           confirmed_at       = coalesce(confirmed_at, now())
     where id = new.id;
  exception when others then
    -- Don't fail signup if this update doesn't work
    raise notice 'handle_new_user: auto-confirm update skipped: %', SQLERRM;
  end;

  return new;
exception when others then
  raise exception 'handle_new_user failed: % (SQLSTATE %)', SQLERRM, SQLSTATE;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 5) Backfill: profiles for any existing auth.users without one
-- ============================================================
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

-- ============================================================
-- 6) Admin RPCs (atomic profile + organizer creation)
-- ============================================================
create or replace function public.admin_create_organizer(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_display_name text,
  p_slug text,
  p_bio text,
  p_plan text,
  p_verification_status text,
  p_is_published boolean,
  p_city text default null,
  p_address text default null,
  p_website text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_phone text default null,
  p_instagram text default null,
  p_facebook text default null,
  p_tiktok text default null,
  p_logo text default null,
  p_cover_image text default null,
  p_operating_cities text[] default '{}'::text[],
  p_organizer_type text default 'individual',
  p_cover text default null
)
returns table(id uuid, success boolean, error text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organizer_exists uuid;
  v_actual_slug text;
  v_attempt int;
begin
  insert into public.profiles (id, email, full_name, is_organizer, updated_at)
  values (p_id, p_email, p_full_name, true, now())
  on conflict (id) do update
    set is_organizer = true,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email = coalesce(excluded.email, public.profiles.email),
        updated_at = now();

  v_actual_slug := p_slug;
  for v_attempt in 1..5 loop
    select id into v_organizer_exists
      from public.organizer_profiles
      where slug = v_actual_slug
      limit 1;
    if v_organizer_exists is null or v_organizer_exists = p_id then
      exit;
    end if;
    v_actual_slug := p_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  insert into public.organizer_profiles (
    id, display_name, slug, bio, plan, verification_status, is_published,
    city, address, website, contact_email, contact_phone, phone,
    instagram, facebook, tiktok, logo, cover_image,
    operating_cities, organizer_type, updated_at
  )
  values (
    p_id, p_display_name, v_actual_slug, p_bio, p_plan, p_verification_status, p_is_published,
    p_city, p_address, p_website, p_contact_email, p_contact_phone, p_phone,
    p_instagram, p_facebook, p_tiktok, p_logo, p_cover_image,
    p_operating_cities, p_organizer_type, now()
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    slug = excluded.slug,
    bio = excluded.bio,
    plan = excluded.plan,
    verification_status = excluded.verification_status,
    is_published = excluded.is_published,
    city = excluded.city,
    address = excluded.address,
    website = excluded.website,
    contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone,
    phone = excluded.phone,
    instagram = excluded.instagram,
    facebook = excluded.facebook,
    tiktok = excluded.tiktok,
    logo = excluded.logo,
    cover_image = excluded.cover_image,
    operating_cities = excluded.operating_cities,
    organizer_type = excluded.organizer_type,
    updated_at = now();

  return query select p_id, true, null::text;
exception when others then
  return query select p_id, false, SQLERRM;
end $$;

create or replace function public.admin_update_organizer(
  p_id uuid,
  p_display_name text,
  p_slug text,
  p_bio text,
  p_organizer_type text,
  p_city text default null,
  p_address text default null,
  p_website text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_phone text default null,
  p_instagram text default null,
  p_facebook text default null,
  p_tiktok text default null,
  p_logo text default null,
  p_cover_image text default null,
  p_operating_cities text[] default '{}'::text[]
)
returns table(id uuid, success boolean, error text, slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actual_slug text;
  v_attempt int;
  v_collision_id uuid;
begin
  v_actual_slug := p_slug;
  for v_attempt in 1..5 loop
    select id into v_collision_id
      from public.organizer_profiles
      where slug = v_actual_slug
        and id <> p_id
      limit 1;
    if v_collision_id is null then
      exit;
    end if;
    v_actual_slug := p_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  update public.organizer_profiles set
    display_name = p_display_name,
    slug = v_actual_slug,
    bio = p_bio,
    organizer_type = p_organizer_type,
    city = p_city,
    address = p_address,
    website = p_website,
    contact_email = p_contact_email,
    contact_phone = p_contact_phone,
    phone = p_phone,
    instagram = p_instagram,
    facebook = p_facebook,
    tiktok = p_tiktok,
    logo = p_logo,
    cover_image = p_cover_image,
    operating_cities = p_operating_cities,
    updated_at = now()
  where id = p_id;

  return query select p_id, true, null::text, v_actual_slug;
exception when others then
  return query select p_id, false, SQLERRM, p_slug;
end $$;

-- ============================================================
-- 7) Dev-only: confirm a user without email (rate-limit escape hatch)
-- ============================================================
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

-- ============================================================
-- 8) REMOVE the bootstrap_admin trigger
-- It was promoting the first user to admin automatically, which
-- meant any new signup would inherit admin role if the original
-- admin hadn't signed up yet. Disable it here so the role stays
-- "user" by default and only the original dev (munirmehmoodofficial
-- @gmail.com) is admin.
-- ============================================================
drop trigger if exists bootstrap_admin on public.profiles;
drop function if exists public.promote_first_user_to_admin();

-- ============================================================
-- 9) DEMOTE any user that was wrongly promoted to admin
-- Keeps ONLY the original dev (m.munirmehmood@gmail.com) as
-- admin. Everyone else (new signups, organizer test accounts, etc.)
-- gets demoted to a regular user.
-- ============================================================
update public.profiles
   set role = 'user'
 where role = 'admin'
   and email <> 'm.munirmehmood@gmail.com';

-- If you need to manually grant admin to another user, run:
--   update public.profiles set role = 'admin' where email = 'you@example.com';

-- ============================================================
-- 10) ORGANIZER EVENT / OPPORTUNITY OWNERSHIP
-- events had only SELECT (public) + ALL (admin). There was NO
-- INSERT/UPDATE policy for regular organizers, so an organizer's
-- own event insert was rejected by RLS and the event never landed
-- in their dashboard (even though it was visible on the public site).
-- These policies let organizers manage ONLY the rows they own.
-- ============================================================

do $$
begin
  alter table public.events
    add column if not exists organizer_id uuid references auth.users (id) on delete set null;
  alter table public.opportunities
    add column if not exists organizer_id uuid references auth.users (id) on delete set null;
exception when others then
  raise notice 'organizer_id column add skipped: %', SQLERRM;
end $$;

create index if not exists idx_events_organizer on public.events (organizer_id);
create index if not exists idx_opps_organizer on public.opportunities (organizer_id);

drop policy if exists "events organizer insert" on public.events;
create policy "events organizer insert"
  on public.events for insert
  with check (auth.uid() = organizer_id);

drop policy if exists "events organizer update" on public.events;
create policy "events organizer update"
  on public.events for update
  using      (auth.uid() = organizer_id or public.is_admin(auth.uid()))
  with check (auth.uid() = organizer_id or public.is_admin(auth.uid()));

drop policy if exists "events organizer delete" on public.events;
create policy "events organizer delete"
  on public.events for delete
  using      (auth.uid() = organizer_id or public.is_admin(auth.uid()));

drop policy if exists "opps organizer insert" on public.opportunities;
create policy "opps organizer insert"
  on public.opportunities for insert
  with check (auth.uid() = organizer_id);

drop policy if exists "opps organizer update" on public.opportunities;
create policy "opps organizer update"
  on public.opportunities for update
  using      (auth.uid() = organizer_id or public.is_admin(auth.uid()))
  with check (auth.uid() = organizer_id or public.is_admin(auth.uid()));

drop policy if exists "opps organizer delete" on public.opportunities;
create policy "opps organizer delete"
  on public.opportunities for delete
  using      (auth.uid() = organizer_id or public.is_admin(auth.uid()));

-- Backfill organizer_id for existing rows by matching the organizer
-- text against known organizer brand names.
update public.events e
   set organizer_id = o.id
  from public.organizer_profiles o
 where e.organizer_id is null
   and (lower(e.organizer) = lower(o.display_name) or lower(e.organizer) = lower(o.slug));

update public.opportunities op
   set organizer_id = o.id
  from public.organizer_profiles o
 where op.organizer_id is null
   and (lower(op.organizer) = lower(o.display_name) or lower(op.organizer) = lower(o.slug));

-- Fix rows where `organizer` wrongly holds the event title.
update public.events e
   set organizer = o.display_name
  from public.organizer_profiles o
 where e.organizer_id = o.id
   and e.organizer is distinct from o.display_name
   and e.organizer = e.title;

update public.opportunities op
   set organizer = o.display_name
  from public.organizer_profiles o
 where op.organizer_id = o.id
   and op.organizer is distinct from o.display_name
   and op.organizer = op.title;

-- ============================================================
-- 11) SYNC profiles.is_organizer with organizer_profiles
-- The "Become an organizer" gate checks profiles.is_organizer,
-- but the onboarding flow only creates an organizer_profiles row.
-- Keeping the two in sync stops approved organizers from being
-- locked out of /organizer/*.
-- ============================================================

update public.profiles p
   set is_organizer = true
  from public.organizer_profiles o
 where o.id = p.id
   and coalesce(p.is_organizer, false) = false;

create or replace function public.sync_is_organizer_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set is_organizer = true where id = new.id;
  elsif tg_op = 'UPDATE' then
    if new.id is distinct from old.id then
      update public.profiles set is_organizer = true where id = new.id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_is_organizer on public.organizer_profiles;
create trigger trg_sync_is_organizer
  after insert or update of id or delete
  on public.organizer_profiles
  for each row
  execute function public.sync_is_organizer_flag();

-- Done! All set.
select 'Occaz setup complete' as status;
