-- Atomic admin organizer creation RPC.
-- Creates a profile row + organizer_profiles row in one call,
-- bypassing RLS because the function runs as security definer.
-- Usage: supabase.rpc('admin_create_organizer', { ... })

create or replace function public.admin_create_organizer(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_display_name text,
  p_slug text,
  p_bio text,
  p_plan text,
  p_verification_status text,
  p_is_published boolean,
  p_city text default null,
  p_address text default null,
  p_website text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_phone text default null,
  p_instagram text default null,
  p_facebook text default null,
  p_tiktok text default null,
  p_logo text default null,
  p_cover_image text default null,
  p_operating_cities text[] default '{}'::text[],
  p_organizer_type text default 'individual',
  p_cover text default null  -- for the cover_image too if you want
)
returns table(id uuid, success boolean, error text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organizer_exists uuid;
  v_actual_slug text;
  v_attempt int;
begin
  -- 1. Check if profile exists, if not create it
  insert into public.profiles (id, email, full_name, is_organizer, updated_at)
  values (p_id, p_email, p_full_name, true, now())
  on conflict (id) do update
    set is_organizer = true,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email = coalesce(excluded.email, public.profiles.email),
        updated_at = now();

  -- 2. Check for slug collision; try up to 5 random suffixes
  v_actual_slug := p_slug;
  for v_attempt in 1..5 loop
    select id into v_organizer_exists
      from public.organizer_profiles
      where slug = v_actual_slug
      limit 1;
    if v_organizer_exists is null or v_organizer_exists = p_id then
      exit;
    end if;
    v_actual_slug := p_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  -- 3. Upsert organizer profile with all the fields
  insert into public.organizer_profiles (
    id, display_name, slug, bio, plan, verification_status, is_published,
    city, address, website, contact_email, contact_phone, phone,
    instagram, facebook, tiktok, logo, cover_image,
    operating_cities, organizer_type, updated_at
  )
  values (
    p_id, p_display_name, v_actual_slug, p_bio, p_plan, p_verification_status, p_is_published,
    p_city, p_address, p_website, p_contact_email, p_contact_phone, p_phone,
    p_instagram, p_facebook, p_tiktok, p_logo, p_cover_image,
    p_operating_cities, p_organizer_type, now()
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    slug = excluded.slug,
    bio = excluded.bio,
    plan = excluded.plan,
    verification_status = excluded.verification_status,
    is_published = excluded.is_published,
    city = excluded.city,
    address = excluded.address,
    website = excluded.website,
    contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone,
    phone = excluded.phone,
    instagram = excluded.instagram,
    facebook = excluded.facebook,
    tiktok = excluded.tiktok,
    logo = excluded.logo,
    cover_image = excluded.cover_image,
    operating_cities = excluded.operating_cities,
    organizer_type = excluded.organizer_type,
    updated_at = now();

  return query select p_id, true, null::text;
exception when others then
  return query select p_id, false, SQLERRM;
end $$;


-- ============================================================
-- admin_update_organizer: edit an existing organizer profile
-- ============================================================
create or replace function public.admin_update_organizer(
  p_id uuid,
  p_display_name text,
  p_slug text,
  p_bio text,
  p_organizer_type text,
  p_city text default null,
  p_address text default null,
  p_website text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_phone text default null,
  p_instagram text default null,
  p_facebook text default null,
  p_tiktok text default null,
  p_logo text default null,
  p_cover_image text default null,
  p_operating_cities text[] default '{}'::text[]
)
returns table(id uuid, success boolean, error text, slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actual_slug text;
  v_attempt int;
  v_collision_id uuid;
begin
  -- Detect slug collision against a *different* organizer
  v_actual_slug := p_slug;
  for v_attempt in 1..5 loop
    select id into v_collision_id
      from public.organizer_profiles
      where slug = v_actual_slug
        and id <> p_id
      limit 1;
    if v_collision_id is null then
      exit;
    end if;
    v_actual_slug := p_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  update public.organizer_profiles set
    display_name = p_display_name,
    slug = v_actual_slug,
    bio = p_bio,
    organizer_type = p_organizer_type,
    city = p_city,
    address = p_address,
    website = p_website,
    contact_email = p_contact_email,
    contact_phone = p_contact_phone,
    phone = p_phone,
    instagram = p_instagram,
    facebook = p_facebook,
    tiktok = p_tiktok,
    logo = p_logo,
    cover_image = p_cover_image,
    operating_cities = p_operating_cities,
    updated_at = now()
  where id = p_id;

  return query select p_id, true, null::text, v_actual_slug;
exception when others then
  return query select p_id, false, SQLERRM, p_slug;
end $$;
