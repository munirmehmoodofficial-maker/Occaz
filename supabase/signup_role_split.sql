-- ============================================================
-- Split signup flows: regular user vs organizer
-- ============================================================
-- 1) Update handle_new_user() to read raw_user_meta_data ->> 'as_organizer'
--    and set profiles.is_organizer accordingly.
-- 2) Re-run on existing auth.users so old accounts are not broken.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  is_org boolean;
begin
  -- Read the "as_organizer" flag from the signup metadata (if any)
  is_org := coalesce((new.raw_user_meta_data ->> 'as_organizer')::boolean, false);

  -- 1) Create / update the user profile
  insert into public.profiles (id, email, full_name, is_organizer)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    is_org
  )
  on conflict (id) do update
    set is_organizer = excluded.is_organizer or public.profiles.is_organizer,
        full_name    = coalesce(excluded.full_name, public.profiles.full_name),
        email        = excluded.email;

  -- 2) Pre-create an organizer profile row only when this signup is for an organizer
  if is_org then
    base_slug := lower(regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then base_slug := 'organizer'; end if;

    insert into public.organizer_profiles (id, display_name, slug, is_organizer, verified)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      base_slug,
      true,
      false  -- must be admin-verified before showing on directory
    )
    on conflict (id) do update
      set display_name = excluded.display_name,
          is_organizer = true;
  end if;

  return new;
end;
$$;

-- (Re-create trigger — no-op if it already exists, this is idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: any existing auth.users missing a profile row, create one.
insert into public.profiles (id, email, full_name)
select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;
