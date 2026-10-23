-- ============================================================
-- Occaz — Brand settings: social links + contact details
-- ============================================================
-- Run this in Supabase → SQL Editor → New query → paste → Run.
-- Idempotent: safe to run multiple times.
--
-- Only needed if you ALREADY ran brand_settings.sql before this
-- update. If you're running it for the first time, the single
-- brand_settings.sql file already includes these columns.
-- ============================================================

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

select 'Brand social links columns ready' as status;
