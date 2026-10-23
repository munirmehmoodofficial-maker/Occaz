-- ============================================================
-- Occaz — Brand settings
-- ============================================================
-- Run this in Supabase → SQL Editor → New query → paste → Run.
-- Idempotent: safe to run multiple times.
--
-- A single-row table storing platform-wide brand assets (logo,
-- favicon, wordmark). All admin-managed. Public read so the
-- storefront can show the live logo; admin write only.
-- ============================================================

create table if not exists public.brand_settings (
  id int primary key default 1 check (id = 1),
  logo_url text,
  favicon_url text,
  wordmark text default 'Occaz',
  tagline text,
  social_links jsonb not null default '{}'::jsonb,
  contact_email text,
  contact_phone text,
  address text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

-- social_links shape: { twitter, instagram, linkedin, facebook, tiktok, youtube, github, whatsapp, telegram, threads, discord }
alter table public.brand_settings
  add column if not exists social_links jsonb not null default '{}'::jsonb;
alter table public.brand_settings
  add column if not exists contact_email text;
alter table public.brand_settings
  add column if not exists contact_phone text;
alter table public.brand_settings
  add column if not exists address text;

-- Make sure the singleton row exists
insert into public.brand_settings (id, wordmark)
  values (1, 'Occaz')
  on conflict (id) do nothing;

alter table public.brand_settings enable row level security;

-- Public read — the brand is on the storefront
drop policy if exists "brand_settings_public_read" on public.brand_settings;
create policy "brand_settings_public_read"
  on public.brand_settings for select
  using (true);

-- Admin write only
drop policy if exists "brand_settings_admin_write" on public.brand_settings;
create policy "brand_settings_admin_write"
  on public.brand_settings for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
