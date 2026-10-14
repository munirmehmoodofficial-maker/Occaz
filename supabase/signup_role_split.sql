-- ============================================================
-- Robust handle_new_user trigger for Occaz
-- ============================================================
-- This fixes the "Database error saving new user" failure that
-- happens when a brand-new auth.users row can't be turned into a
-- profiles + organizer_profiles row.
--
-- Robustness:
--   1. Reads raw_user_meta_data ->> 'as_organizer' to decide whether
--      to also create an organizer_profiles row.
--   2. If as_organizer=true, the organizer_profiles row is created
--      with:
--        - is_organizer = true  (added column)
--        - verified = false     (admin must approve)
--        - slug = base_slug with 4-char random suffix on collision
--   3. All inserts use ON CONFLICT to be idempotent (re-runs are
--      safe — useful for backfill).
--   4. If anything fails, raise a clear exception with the actual
--      error message instead of a generic one.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  final_slug text;
  is_org boolean;
  hash text;
  attempts int := 0;
begin
  -- Read as_organizer flag (string "true" / "false" from our signup)
  is_org := coalesce(lower(new.raw_user_meta_data ->> 'as_organizer'), 'false') = 'true';

  -- 1) Always create a profile row.
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
    raise exception 'handle_new_user: profiles insert failed: % (SQLSTATE %)', SQLERRM, SQLSTATE;
  end;

  -- 2) For organizer signups, also create an organizer_profiles row.
  if is_org then
    -- Build base slug from full_name (or email local part).
    base_slug := lower(regexp_replace(
      coalesce(
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        split_part(new.email, '@', 1)
      ),
      '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then base_slug := 'organizer'; end if;

    -- Try base slug first, then add a 4-char random suffix on collision.
    final_slug := base_slug;
    <<slug_loop>>
    while attempts < 5 loop
      begin
        insert into public.organizer_profiles (id, display_name, slug, is_organizer, verified)
        values (
          new.id,
          coalesce(
            nullif(new.raw_user_meta_data ->> 'full_name', ''),
            split_part(new.email, '@', 1)
          ),
          final_slug,
          true,
          false
        )
        on conflict (id) do update
          set display_name = excluded.display_name,
              slug         = excluded.slug,
              is_organizer = true;
        exit slug_loop;
      exception when unique_violation then
        attempts := attempts + 1;
        -- Generate a 4-char hex suffix from md5(new.id || random()).
        hash := substr(md5(new.id::text || attempts::text), 1, 4);
        final_slug := base_slug || '-' || hash;
      end;
    end loop slug_loop;

    if attempts >= 5 then
      raise exception 'handle_new_user: could not allocate a unique organizer slug for "%" (5 attempts)', base_slug;
    end if;
  end if;

  return new;
exception when others then
  -- Re-raise with full context so the auth.users insert is rolled back
  -- and Supabase surfaces the real reason in the API response.
  raise exception 'handle_new_user failed: % (SQLSTATE %)', SQLERRM, SQLSTATE;
end;
$$;

-- Re-create trigger (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Make sure the is_organizer column exists on organizer_profiles
-- (so the trigger's INSERT works on existing deployments).
-- ============================================================
alter table public.organizer_profiles
  add column if not exists is_organizer boolean not null default false;

-- ============================================================
-- Backfill: any auth.users missing a profile row, create one.
-- ============================================================
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;
