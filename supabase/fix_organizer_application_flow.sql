-- ============================================================
-- Occaz — Organizer application / approval flow fix
-- ============================================================
-- Run this in Supabase → SQL Editor → New query → paste → Run.
-- Idempotent: safe to run multiple times.
--
-- THE BUG
--   organizer_profiles had a SELECT policy (public), an UPDATE
--   policy (self), and an ALL policy (admin only). There was NO
--   policy allowing a regular user to INSERT their own organizer
--   profile. So when a user filled out /become-organizer, the
--   INSERT was rejected by RLS, the app swallowed the error in a
--   try/catch, and the row was never created — which is why new
--   organizers never appeared in the admin panel or the
--   verification queue.
--
-- THE FIX
--   1. submit_organizer_application() — SECURITY DEFINER RPC that
--      creates/updates the organizer profile + the legacy
--      organizations row + flips profiles.is_organizer, and always
--      sets verification_status = 'pending' + is_published = false
--      so the request lands in the admin verification queue.
--   2. A self-INSERT RLS policy as a belt-and-braces fallback for
--      direct client inserts.
--   3. Backfill: create organizer_profiles rows for any user who
--      signed up as an organizer but never got a row.
-- ============================================================


-- ============================================================
-- 1) RLS: allow a user to insert their OWN organizer profile
-- ============================================================

drop policy if exists "org profile self insert" on public.organizer_profiles;
create policy "org profile self insert"
  on public.organizer_profiles for insert
  with check (auth.uid() = id);

-- Also allow the owner to delete their own (rejected) application
drop policy if exists "org profile self delete" on public.organizer_profiles;
create policy "org profile self delete"
  on public.organizer_profiles for delete
  using (auth.uid() = id);


-- ============================================================
-- 2) submit_organizer_application() RPC
--    Called by /become-organizer when a user submits the form.
--    SECURITY DEFINER so it works regardless of RLS state.
-- ============================================================

create or replace function public.submit_organizer_application(
  p_display_name text,
  p_slug text,
  p_bio text default null,
  p_website text default null,
  p_instagram text default null,
  p_facebook text default null,
  p_tiktok text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_phone text default null,
  p_city text default null,
  p_address text default null,
  p_operating_cities text[] default '{}'::text[],
  p_organizer_type text default 'individual',
  p_logo text default null,
  p_cover_image text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_slug text;
  v_collision uuid;
  v_attempt int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  if p_display_name is null or trim(p_display_name) = '' then
    return jsonb_build_object('ok', false, 'error', 'Brand name is required');
  end if;

  -- Ensure the auth user has a profiles row
  insert into public.profiles (id, email, full_name, is_organizer, updated_at)
  select u.id, u.email, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)), true, now()
    from auth.users u where u.id = v_uid
  on conflict (id) do update
    set is_organizer = true,
        updated_at = now();

  -- Build a unique slug
  v_slug := lower(regexp_replace(trim(p_display_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'organizer'; end if;

  for v_attempt in 1..6 loop
    select id into v_collision
      from public.organizer_profiles
      where slug = v_slug and id <> v_uid
      limit 1;
    if v_collision is null then exit; end if;
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  -- Create or update the organizer profile.
  -- IMPORTANT: verification_status resets to 'pending' on every new
  -- submission so the request reappears in the admin queue.
  insert into public.organizer_profiles (
    id, display_name, slug, bio, website, instagram, facebook, tiktok,
    contact_email, contact_phone, phone, city, address, operating_cities,
    organizer_type, logo, cover_image, plan, verification_status,
    is_published, verified, is_organizer, updated_at, created_at
  )
  values (
    v_uid, trim(p_display_name), v_slug, p_bio, p_website, p_instagram,
    p_facebook, p_tiktok, p_contact_email, p_contact_phone, p_phone,
    p_city, p_address, coalesce(p_operating_cities, '{}'::text[]),
    p_organizer_type, p_logo, p_cover_image, null, 'pending', false, false,
    true, now(), now()
  )
  on conflict (id) do update set
    display_name       = excluded.display_name,
    slug               = excluded.slug,
    bio                = excluded.bio,
    website            = excluded.website,
    instagram          = excluded.instagram,
    facebook           = excluded.facebook,
    tiktok             = excluded.tiktok,
    contact_email      = excluded.contact_email,
    contact_phone      = excluded.contact_phone,
    phone              = excluded.phone,
    city               = excluded.city,
    address            = excluded.address,
    operating_cities   = excluded.operating_cities,
    organizer_type     = excluded.organizer_type,
    logo               = coalesce(excluded.logo, public.organizer_profiles.logo),
    cover_image        = coalesce(excluded.cover_image, public.organizer_profiles.cover_image),
    -- reset the approval state so the admin sees it as a fresh request
    verification_status = 'pending',
    is_published       = false,
    verified           = false,
    is_organizer       = true,
    updated_at         = now();

  -- Legacy organizations table (best effort — may not exist)
  begin
    insert into public.organizations (
      owner_id, created_by, name, slug, logo_url, cover_image, cover_url,
      description, website, instagram, facebook, tiktok, email, contact_email,
      contact_phone, phone, city, address, operating_cities, organizer_type,
      plan, verification_status, is_published, updated_at
    )
    values (
      v_uid, v_uid, trim(p_display_name), v_slug, p_logo, p_cover_image,
      p_cover_image, p_bio, p_website, p_instagram, p_facebook, p_tiktok,
      p_contact_email, p_contact_email, p_contact_phone, p_phone, p_city,
      p_address, coalesce(p_operating_cities, '{}'::text[]), p_organizer_type,
      null, 'pending', false, now()
    )
    on conflict (owner_id) do update set
      name                = excluded.name,
      slug                = excluded.slug,
      logo_url            = coalesce(excluded.logo_url, public.organizations.logo_url),
      cover_image         = coalesce(excluded.cover_image, public.organizations.cover_image),
      description         = excluded.description,
      website             = excluded.website,
      instagram           = excluded.instagram,
      facebook            = excluded.facebook,
      tiktok              = excluded.tiktok,
      email               = excluded.email,
      contact_email       = excluded.contact_email,
      contact_phone       = excluded.contact_phone,
      phone               = excluded.phone,
      city                = excluded.city,
      address             = excluded.address,
      operating_cities    = excluded.operating_cities,
      organizer_type      = excluded.organizer_type,
      verification_status = 'pending',
      is_published        = false,
      updated_at          = now();
  exception when others then
    -- organizations table may not exist or may not have owner_id — ignore
    null;
  end;

  return jsonb_build_object(
    'ok', true,
    'id', v_uid,
    'slug', v_slug,
    'verification_status', 'pending'
  );
exception when others then
  return jsonb_build_object('ok', false, 'error', SQLERRM);
end;
$$;

grant execute on function public.submit_organizer_application(
  text, text, text, text, text, text, text, text, text, text, text, text,
  text[], text, text, text
) to authenticated;


-- ============================================================
-- 3) Backfill: organizer_profiles rows for users who signed up as
--    an organizer but never got one (their application was
--    silently blocked by RLS).
-- ============================================================

insert into public.organizer_profiles (
  id, display_name, slug, verification_status, is_published, verified,
  is_organizer, updated_at, created_at
)
select
  p.id,
  coalesce(p.full_name, split_part(p.email, '@', 1), 'New Organizer'),
  -- build a unique slug
  trim(both '-' from
    lower(regexp_replace(
      coalesce(p.full_name, split_part(p.email, '@', 1), 'organizer'),
      '[^a-zA-Z0-9]+', '-', 'g'
    ))
  ) || '-' || substr(replace(p.id::text, '-', ''), 1, 6),
  'pending',
  false,
  false,
  true,
  now(),
  now()
from public.profiles p
where p.is_organizer = true
  and not exists (
    select 1 from public.organizer_profiles o where o.id = p.id
  )
on conflict (id) do nothing;

-- Make sure those backfilled users are flagged as organizers and their
-- profiles are pending verification (not auto-approved).
update public.profiles p
   set is_organizer = true
 where p.is_organizer = true
   and exists (
     select 1 from public.organizer_profiles o
      where o.id = p.id and o.verification_status = 'pending'
   );

-- Sanity check: how many organizer applications are waiting for review
select
  count(*) filter (where verification_status = 'pending') as pending_review,
  count(*) filter (where verification_status = 'approved') as approved,
  count(*) filter (where verification_status = 'rejected') as rejected,
  count(*) as total
from public.organizer_profiles;

select 'Organizer application flow fixed' as status;
