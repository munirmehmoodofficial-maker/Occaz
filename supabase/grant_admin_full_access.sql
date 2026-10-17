-- ============================================================
-- Grant admin full access to organizer dashboard
-- ============================================================
-- Note: 'plan' lives on organizer_profiles, not profiles.
-- The 'is_organizer' flag on profiles is what gates the
-- /organizer route + header link.
-- ============================================================

-- 1) Allow the admin to see the Organizer dashboard link + bypass
--    the "become an organizer" gate.
update public.profiles
   set is_organizer = true
 where email = 'm.munirmehmood@gmail.com'
   and coalesce(is_organizer, false) = false;

-- 2) Create the organizer_profiles row for the admin (idempotent).
--    This is the row Section 8 (Profile) reads/writes.
insert into public.organizer_profiles (id, display_name, slug, is_organizer, verified, plan, verification_status, is_published)
select p.id,
       coalesce(p.full_name, 'Occaz Admin'),
       'occaz-admin',
       true,
       true,
       'business',
       'approved',
       true
  from public.profiles p
 where p.email = 'm.munirmehmood@gmail.com'
   and not exists (
     select 1 from public.organizer_profiles o
       where o.id = p.id
   );

-- 3) If the row already exists but plan is null/empty, upgrade it.
update public.organizer_profiles
   set plan = 'business',
       is_organizer = true,
       verification_status = 'approved',
       is_published = true,
       verified = true
 where id in (select id from public.profiles where email = 'm.munirmehmood@gmail.com');

-- 4) Make sure the admin is recognized as admin (in case role was
--    demoted by the bootstrap_admin removal in install_all.sql).
update public.profiles
   set role = 'admin'
 where email = 'm.munirmehmood@gmail.com'
   and coalesce(role, 'user') <> 'admin';

select 'Admin granted full organizer access' as status;
