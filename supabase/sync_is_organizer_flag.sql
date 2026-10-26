-- ============================================================
-- Occaz — Sync profiles.is_organizer with organizer_profiles
-- ============================================================
-- Run in Supabase → SQL Editor → New query → paste → Run.
-- Idempotent: safe to run multiple times.
--
-- THE BUG
--   The "Become an organizer" gate checks `profiles.is_organizer`.
--   But the organizer onboarding flow creates an `organizer_profiles`
--   row and never set `profiles.is_organizer = true`. Admin approval
--   updated `organizer_profiles` only.
--
--   Result: a fully approved organizer was locked out of
--   /organizer/* behind the "Become an organizer on Occaz" prompt,
--   while their own dashboard data (events, orders) was right there.
--
-- THE FIX
--   1. Set profiles.is_organizer = true for anyone who has an
--      organizer_profiles row.
--   2. Add a trigger so the flag stays in sync automatically whenever
--      an organizer_profiles row is created or its owner changes.
--   3. Backfill the reverse direction too: anyone flagged as an
--      organizer on `profiles` but missing an organizer_profiles row
--      gets a minimal one, so the two never disagree.
-- ============================================================


-- ============================================================
-- 1) Forward sync — profiles.is_organizer follows organizer_profiles
-- ============================================================

update public.profiles p
   set is_organizer = true
  from public.organizer_profiles o
 where o.id = p.id
   and coalesce(p.is_organizer, false) = false;


-- ============================================================
-- 2) Keep them in sync with a trigger
-- ============================================================

create or replace function public.sync_is_organizer_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
       set is_organizer = true
     where id = new.id;

  elsif tg_op = 'UPDATE' then
    -- Owner changed → the old owner keeps whatever they had, the new
    -- owner becomes an organizer.
    if new.id is distinct from old.id then
      update public.profiles
         set is_organizer = true
       where id = new.id;
    end if;

  elsif tg_op = 'DELETE' then
    -- Don't revoke the flag: the user may still own listings and the
    -- dashboard should keep working. Just leave the profile as-is.
    null;
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


-- ============================================================
-- 3) Reverse sync — profiles flagged as organizer but missing a row
--    get a minimal organizer_profiles row so the two agree.
-- ============================================================

-- Slug must be unique. Derive it from the user id so it can never
-- collide with an existing organizer.
insert into public.organizer_profiles (id, display_name, slug, is_published, verification_status)
select p.id,
       coalesce(p.full_name, split_part(p.email, '@', 1), 'Occaz Organizer'),
       'organizer-' || substr(replace(p.id::text, '-', ''), 1, 12),
       false,
       'pending'
  from public.profiles p
 where coalesce(p.is_organizer, false) = true
   and not exists (
     select 1 from public.organizer_profiles o where o.id = p.id
   )
   and p.email is not null;
-- Make sure display_name / slug are never blank.
update public.organizer_profiles
   set display_name = coalesce(nullif(trim(display_name), ''), 'Occaz Organizer')
 where display_name is null or trim(display_name) = '';

update public.organizer_profiles
   set slug = 'organizer-' || substr(replace(id::text, '-', ''), 1, 12)
 where slug is null or trim(slug) = '';


-- ============================================================
-- 4) Sanity check
-- ============================================================

select
  (select count(*) from public.organizer_profiles) as organizer_profiles,
  (select count(*) from public.profiles where coalesce(is_organizer, false)) as flagged_organizers,
  (select count(*)
     from public.organizer_profiles o
    where not exists (
      select 1 from public.profiles p
       where p.id = o.id and coalesce(p.is_organizer, false)
    )) as profiles_not_synced;

select 'profiles.is_organizer synced with organizer_profiles' as status;
