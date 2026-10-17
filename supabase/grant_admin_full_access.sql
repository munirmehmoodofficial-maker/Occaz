-- ============================================================
-- Grant admin full access to organizer dashboard
-- ============================================================
-- 1) Set is_organizer=true for the admin so the /organizer route
--    and the "Organizer dashboard" link in the header show up.
-- 2) The admin will see "All features unlocked" badges in the
--    dashboard, and can switch plans freely to test the UI.
-- ============================================================

update public.profiles
   set is_organizer = true
 where email = 'm.munirmehmood@gmail.com'
   and coalesce(is_organizer, false) = false;

-- Also create a placeholder organizer_profiles row for the admin
-- (the dashboard's Section 8 reads from this table; without a row,
-- the form starts empty — this is fine, but the row makes the
-- "Save" action work without first having to do anything else).
insert into public.organizer_profiles (id, display_name, slug, is_organizer, verified)
select p.id,
       coalesce(p.full_name, 'Occaz Admin'),
       'occaz-admin',
       true,
       true
  from public.profiles p
 where p.email = 'm.munirmehmood@gmail.com'
   and not exists (
     select 1 from public.organizer_profiles o
       where o.id = p.id
   );

-- Also make sure the admin's profile.plan is set so the dashboard
-- doesn't show "No plan" (purely cosmetic).
update public.profiles
   set plan = 'business'
 where email = 'm.munirmehmood@gmail.com';

select 'Admin upgraded to organizer' as status;
