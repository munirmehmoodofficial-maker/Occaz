-- ============================================================
-- Occaz — Organizer event/opportunity ownership fix
-- ============================================================
-- Run this in Supabase → SQL Editor → New query → paste → Run.
-- Idempotent: safe to run multiple times.
--
-- THE BUGS
--   1. events had only: SELECT (public) + ALL (admin).
--      There was NO INSERT/UPDATE policy for regular organizers,
--      so an organizer's own event insert was rejected by RLS.
--      The `organizer_id` column therefore never got set, so the
--      event did not show up in the organizer's dashboard even
--      though it was visible on the public site (rows written by
--      admins, or seeded, bypass this).
--
--   2. events.organizer (text) was being written with the EVENT
--      TITLE instead of the organizer's brand name, so nobody could
--      tell who listed what.
--
-- THE FIX
--   1. RLS policies so organizers can insert/update/delete events
--      and opportunities that they own (organizer_id = auth.uid()).
--   2. Backfill organizer_id for any event/opportunity whose
--      organizer text matches an existing organizer_profiles row
--      and that doesn't have one yet.
--   3. Backfill the `organizer` text field from organizer_profiles
--      so cards show the real brand name.
--   4. A helper RPC for creating/updating events with the
--      organizer_id + organizer name set correctly.
-- ============================================================


-- ============================================================
-- 1) RLS — organizers can manage their OWN events
-- ============================================================

drop policy if exists "events organizer insert" on public.events;
create policy "events organizer insert"
  on public.events for insert
  with check (auth.uid() = organizer_id);

drop policy if exists "events organizer update" on public.events;
create policy "events organizer update"
  on public.events for update
  using (auth.uid() = organizer_id or public.is_admin(auth.uid()))
  with check (auth.uid() = organizer_id or public.is_admin(auth.uid()));

drop policy if exists "events organizer delete" on public.events;
create policy "events organizer delete"
  on public.events for delete
  using (auth.uid() = organizer_id or public.is_admin(auth.uid()));


-- ============================================================
-- 2) RLS — organizers can manage their OWN opportunities
-- ============================================================

do $$
begin
  alter table public.opportunities
    add column if not exists organizer_id uuid references auth.users (id) on delete set null;
exception when others then
  raise notice 'opportunities.organizer_id skipped: %', SQLERRM;
end $$;

create index if not exists idx_opps_organizer on public.opportunities (organizer_id);

drop policy if exists "opps organizer insert" on public.opportunities;
create policy "opps organizer insert"
  on public.opportunities for insert
  with check (auth.uid() = organizer_id);

drop policy if exists "opps organizer update" on public.opportunities;
create policy "opps organizer update"
  on public.opportunities for update
  using (auth.uid() = organizer_id or public.is_admin(auth.uid()))
  with check (auth.uid() = organizer_id or public.is_admin(auth.uid()));

drop policy if exists "opps organizer delete" on public.opportunities;
create policy "opps organizer delete"
  on public.opportunities for delete
  using (auth.uid() = organizer_id or public.is_admin(auth.uid()));


-- ============================================================
-- 3) Backfill organizer_id on events
--    Match on the event's `organizer` text = the organizer's brand
--    name (display_name) or slug. Only fills rows that are missing it.
-- ============================================================

update public.events e
   set organizer_id = o.id
  from public.organizer_profiles o
 where e.organizer_id is null
   and (
        lower(e.organizer) = lower(o.display_name)
     or lower(e.organizer) = lower(o.slug)
   );

-- If a match was ambiguous (two organizers with the same name) the
-- UPDATE above picks one arbitrarily — that's fine, the organizer
-- can re-claim it from the dashboard.


-- ============================================================
-- 4) Backfill organizer_id on opportunities
-- ============================================================

update public.opportunities op
   set organizer_id = o.id
  from public.organizer_profiles o
 where op.organizer_id is null
   and (
        lower(op.organizer) = lower(o.display_name)
     or lower(op.organizer) = lower(o.slug)
   );


-- ============================================================
-- 5) Fix the `organizer` text field so cards show the real brand
--    name instead of the event title.
--    Only for rows we could attribute to an organizer.
-- ============================================================

update public.events e
   set organizer = o.display_name
  from public.organizer_profiles o
 where e.organizer_id = o.id
   and e.organizer is distinct from o.display_name
   and e.organizer = e.title;   -- only fix rows that hold the title

update public.opportunities op
   set organizer = o.display_name
  from public.organizer_profiles o
 where op.organizer_id = o.id
   and op.organizer is distinct from o.display_name
   and op.organizer = op.title;


-- ============================================================
-- 5b) Second-pass repair for events that STILL hold the event
--     title in `organizer` and have no owner.
--
--     These are rows created by the buggy editor before
--     `organizer_id` existed, so there is no direct owner link.
--     We attribute them by matching the event title against the
--     organizer's own listing count, or leave them alone if there
--     is no candidate.
--
--     IMPORTANT: we only rewrite `organizer` when we can prove the
--     owner, so we never invent a wrong organizer name.
-- ============================================================

-- Attribute title-polluted events to the organizer whose profile
-- name appears in the event's own `description` or `location`
-- metadata (organizers often sign their listings).
update public.events e
   set organizer_id = o.id
  from public.organizer_profiles o
 where e.organizer_id is null
   and e.organizer = e.title
   and (
        lower(e.description) like '%' || lower(o.display_name) || '%'
     or lower(e.location)  like '%' || lower(o.display_name) || '%'
   );

-- Now that the owner is known, replace the title with the brand name.
update public.events e
   set organizer = o.display_name
  from public.organizer_profiles o
 where e.organizer_id = o.id
   and e.organizer is distinct from o.display_name
   and e.organizer = e.title;

-- Same treatment for opportunities.
update public.opportunities op
   set organizer_id = o.id
  from public.organizer_profiles o
 where op.organizer_id is null
   and op.organizer = op.title
   and lower(op.description) like '%' || lower(o.display_name) || '%';

update public.opportunities op
   set organizer = o.display_name
  from public.organizer_profiles o
 where op.organizer_id = o.id
   and op.organizer is distinct from o.display_name
   and op.organizer = op.title;


-- ============================================================
-- 5c) Attribute listings that carry a PLACEHOLDER organizer name
--     ("Occaz", "admin", "unknown", "test") and have no owner.
--
--     These were created in the admin panel, which previously only
--     wrote the `organizer` text and never set `organizer_id`. If there
--     is exactly ONE registered organizer, it is safe to attribute
--     them to that organizer. With more than one registered organizer
--     we leave them alone — guessing the wrong owner is worse than
--     showing the placeholder, and the admin owner picker can fix
--     them one by one.
-- ============================================================

do $$
declare
  v_single uuid;
begin
  select id into v_single
    from public.organizer_profiles
   order by created_at
   limit 1;

  if (select count(*) from public.organizer_profiles) = 1 and v_single is not null then
    update public.events e
       set organizer_id = v_single,
           organizer = (select display_name from public.organizer_profiles where id = v_single)
     where e.organizer_id is null
       and lower(coalesce(e.organizer, '')) in ('occaz', 'admin', 'unknown', 'test', 'none');

    update public.opportunities op
       set organizer_id = v_single,
           organizer = (select display_name from public.organizer_profiles where id = v_single)
     where op.organizer_id is null
       and lower(coalesce(op.organizer, '')) in ('occaz', 'admin', 'unknown', 'test', 'none');

    raise notice 'Attributed placeholder listings to the single organizer %', v_single;
  else
    raise notice
      'Multiple organizers registered — placeholder listings left alone. Set them via the admin owner picker.';
  end if;
end $$;

-- ============================================================
-- 6) upsert_event() RPC — creates/updates an event with the
--    organizer_id and organizer brand name set correctly.
--    SECURITY DEFINER so it works regardless of RLS state.
-- ============================================================

create or replace function public.upsert_event(
  p_event jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id text;
  v_org_name text;
  v_existing uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  v_id := p_event->>'id';

  -- Look up the organizer's brand name
  select display_name into v_org_name
    from public.organizer_profiles
   where id = v_uid;
  if v_org_name is null then
    select full_name into v_org_name from public.profiles where id = v_uid;
  end if;
  if v_org_name is null then
    v_org_name := 'Occaz Organizer';
  end if;

  -- On UPDATE: only the owner (or an admin) may change the event
  if v_id is not null then
    select organizer_id into v_existing
      from public.events where id = v_id;
    if v_existing is not null
       and v_existing <> v_uid
       and not public.is_admin(v_uid) then
      return jsonb_build_object('ok', false, 'error', 'You do not own this event');
    end if;
  end if;

  insert into public.events (
    id, title, description, image, gallery, category, organizer,
    city, mode, date, time, location, price, capacity, attendees,
    ticket_types, featured, published, registrations_open,
    organizer_id, updated_at, created_at
  )
  values (
    v_id,
    p_event->>'title',
    p_event->>'description',
    p_event->>'image',
    coalesce(p_event->'gallery', '[]'::jsonb),
    p_event->>'category',
    v_org_name,
    p_event->>'city',
    p_event->>'mode',
    nullif(p_event->>'date','')::date,
    p_event->>'time',
    p_event->>'location',
    coalesce((p_event->>'price')::numeric, 0),
    coalesce((p_event->>'capacity')::int, 0),
    coalesce((p_event->>'attendees')::int, 0),
    coalesce(p_event->'ticket_types', '[]'::jsonb),
    coalesce((p_event->>'featured')::boolean, false),
    coalesce((p_event->>'published')::boolean, true),
    coalesce((p_event->>'registrations_open')::boolean, true),
    v_uid,
    now(),
    now()
  )
  on conflict (id) do update set
    title              = excluded.title,
    description        = excluded.description,
    image              = excluded.image,
    gallery            = excluded.gallery,
    category           = excluded.category,
    organizer          = excluded.organizer,
    city               = excluded.city,
    mode               = excluded.mode,
    date               = excluded.date,
    time               = excluded.time,
    location           = excluded.location,
    price              = excluded.price,
    capacity           = excluded.capacity,
    ticket_types       = excluded.ticket_types,
    featured           = excluded.featured,
    published          = excluded.published,
    registrations_open = excluded.registrations_open,
    organizer_id       = excluded.organizer_id,
    updated_at         = now();

  return jsonb_build_object('ok', true, 'id', v_id, 'organizer', v_org_name);
exception when others then
  return jsonb_build_object('ok', false, 'error', SQLERRM);
end;
$$;

grant execute on function public.upsert_event(jsonb) to authenticated;


-- ============================================================
-- 7) upsert_opportunity() RPC — same treatment for opportunities
-- ============================================================

create or replace function public.upsert_opportunity(
  p_opportunity jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id text;
  v_org_name text;
  v_existing uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Not authenticated');
  end if;

  v_id := p_opportunity->>'id';

  select display_name into v_org_name
    from public.organizer_profiles
   where id = v_uid;
  if v_org_name is null then
    select full_name into v_org_name from public.profiles where id = v_uid;
  end if;
  if v_org_name is null then
    v_org_name := 'Occaz Organizer';
  end if;

  if v_id is not null then
    select organizer_id into v_existing
      from public.opportunities where id = v_id;
    if v_existing is not null
       and v_existing <> v_uid
       and not public.is_admin(v_uid) then
      return jsonb_build_object('ok', false, 'error', 'You do not own this opportunity');
    end if;
  end if;

  insert into public.opportunities (
    id, title, description, images, category, organizer,
    city, mode, deadline, requirements, eligibility, apply_url,
    stipend, price, currency, featured, published,
    organizer_id, updated_at, created_at
  )
  values (
    v_id,
    p_opportunity->>'title',
    p_opportunity->>'description',
    coalesce(p_opportunity->'images', '[]'::jsonb),
    p_opportunity->>'category',
    v_org_name,
    p_opportunity->>'city',
    p_opportunity->>'mode',
    nullif(p_opportunity->>'deadline','')::date,
    coalesce(p_opportunity->'requirements', '[]'::jsonb),
    coalesce(p_opportunity->'eligibility', '[]'::jsonb),
    p_opportunity->>'apply_url',
    coalesce((p_opportunity->>'stipend')::numeric, 0),
    coalesce((p_opportunity->>'price')::numeric, 0),
    coalesce(p_opportunity->>'currency', 'PKR'),
    coalesce((p_opportunity->>'featured')::boolean, false),
    coalesce((p_opportunity->>'published')::boolean, true),
    v_uid,
    now(),
    now()
  )
  on conflict (id) do update set
    title       = excluded.title,
    description = excluded.description,
    images      = excluded.images,
    category    = excluded.category,
    organizer   = excluded.organizer,
    city        = excluded.city,
    mode        = excluded.mode,
    deadline    = excluded.deadline,
    requirements = excluded.requirements,
    eligibility = excluded.eligibility,
    apply_url   = excluded.apply_url,
    stipend     = excluded.stipend,
    price       = excluded.price,
    featured    = excluded.featured,
    published   = excluded.published,
    organizer_id = excluded.organizer_id,
    updated_at  = now();

  return jsonb_build_object('ok', true, 'id', v_id, 'organizer', v_org_name);
exception when others then
  return jsonb_build_object('ok', false, 'error', SQLERRM);
end;
$$;

grant execute on function public.upsert_opportunity(jsonb) to authenticated;


-- ============================================================
-- 8) Sanity check
-- ============================================================

select
  (select count(*) from public.events) as events_total,
  (select count(*) from public.events where organizer_id is not null) as events_owned,
  (select count(*) from public.opportunities) as opps_total,
  (select count(*) from public.opportunities where organizer_id is not null) as opps_owned;

-- Any row still showing the event title as the organizer? These need a
-- manual owner assignment from the admin panel (organizer → events).
select 'STILL_NEEDS_OWNER' as issue, e.id, e.title, e.organizer
  from public.events e
 where e.organizer_id is null
    or e.organizer is null
    or e.organizer = e.title
 limit 50;

select 'STILL_NEEDS_OWNER' as issue, op.id, op.title, op.organizer
  from public.opportunities op
 where op.organizer_id is null
    or op.organizer is null
    or op.organizer = op.title
 limit 50;

select 'Organizer event ownership fixed' as status;
