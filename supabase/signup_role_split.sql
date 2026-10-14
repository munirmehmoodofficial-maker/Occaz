-- ============================================================
-- Robust handle_new_user trigger for Occaz
-- ============================================================
-- This fixes the "Database error saving new user" failure by:
--   1. ONLY inserting into public.profiles (no auto organizer_profiles).
--   2. The organizer_profiles row is created by the application code
--      (BecomeOrganizerPage / admin "Add organizer") — this avoids
--      duplicate-slug / race conditions in the trigger.
--   3. Reading raw_user_meta_data ->> 'as_organizer' to set
--      profiles.is_organizer accordingly.
--   4. Idempotent: ON CONFLICT (id) DO UPDATE is safe on re-runs.
--   5. All errors are re-raised with full context so the real reason
--      appears in the Supabase API response (not the generic
--      "Database error saving new user").
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
  -- 1) Read as_organizer flag (string "true" / "false" from our signup)
  is_org := coalesce(lower(new.raw_user_meta_data ->> 'as_organizer'), 'false') = 'true';

  -- 2) Insert / update the profiles row.
  --    ON CONFLICT (id) DO UPDATE so re-runs are safe.
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

  -- NOTE: We intentionally do NOT auto-create the organizer_profiles row
  -- here. The application code (BecomeOrganizerPage, SignupPage for
  -- organizers) handles that, with proper slug-collision handling and
  -- admin verification.

  return new;
exception when others then
  raise exception 'handle_new_user failed: % (SQLSTATE %)', SQLERRM, SQLSTATE;
end;
$$;

-- Re-create the trigger (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Make sure the is_organizer column exists on profiles
-- (so the trigger's INSERT works on existing deployments).
-- ============================================================
alter table public.profiles
  add column if not exists is_organizer boolean not null default false;

-- Backfill profiles rows for any existing auth.users that don't have one
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;
