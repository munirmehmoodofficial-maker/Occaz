-- Add missing columns to organizer_profiles for the new admin features
-- Safe to run multiple times (uses IF NOT EXISTS)

alter table public.organizer_profiles
  add column if not exists cover_image text,
  add column if not exists instagram text,
  add column if not exists facebook text,
  add column if not exists tiktok text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists address text,
  add column if not exists operating_cities text[] default '{}'::text[],
  add column if not exists organizer_type text default 'individual',
  add column if not exists verification_status text not null default 'pending',
  add column if not exists is_published boolean not null default false,
  add column if not exists phone text,
  add column if not exists plan text,
  add column if not exists feature_overrides jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

-- Indexes for the new fields we filter on
create index if not exists idx_organizer_profiles_plan on public.organizer_profiles(plan);
create index if not exists idx_organizer_profiles_verification on public.organizer_profiles(verification_status);
create index if not exists idx_organizer_profiles_published on public.organizer_profiles(is_published);
create index if not exists idx_organizer_profiles_slug on public.organizer_profiles(slug);
