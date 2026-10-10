-- Add all missing columns to organizer_profiles in one shot.
-- Wrapped in DO $$ ... END $$ so the SQL editor accepts it as a single statement.

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
exception when others then
  raise notice 'organizer_profiles column add skipped: %', SQLERRM;
end $$;

-- Indexes (each is its own statement, can run as one batch)
create index if not exists idx_organizer_profiles_plan on public.organizer_profiles(plan);
create index if not exists idx_organizer_profiles_verification on public.organizer_profiles(verification_status);
create index if not exists idx_organizer_profiles_published on public.organizer_profiles(is_published);
create index if not exists idx_organizer_profiles_slug on public.organizer_profiles(slug);
