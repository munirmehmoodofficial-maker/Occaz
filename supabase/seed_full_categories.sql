-- ============================================================
-- Occaz — Seed full category list
-- ============================================================
-- Run this in Supabase → SQL Editor → New query → paste → Run.
-- Idempotent: uses ON CONFLICT DO NOTHING (id is the natural key).
--
-- This seeds the `categories` table with the full list of event
-- and opportunity categories so the admin Categories page, the
-- event/opportunity posting form, and the user-facing filter
-- dropdowns all share the same set of options.
-- ============================================================

insert into public.categories (id, name, kind) values
  -- event categories
  ('event:concerts',     'Concerts',     'event'),
  ('event:qawwali',      'Qawwali',      'event'),
  ('event:theatre',      'Theatre',      'event'),
  ('event:comedy',       'Comedy',       'event'),
  ('event:meetups',      'Meetups',      'event'),
  ('event:seminars',     'Seminars',     'event'),
  ('event:tournaments',  'Tournaments',  'event'),
  ('event:exhibitions',  'Exhibitions',  'event'),
  ('event:competitions', 'Competitions', 'event'),
  ('event:workshops',    'Workshops',    'event'),
  ('event:conferences',  'Conferences',  'event'),
  ('event:festivals',    'Festivals',    'event'),
  ('event:networking',   'Networking',   'event'),
  ('event:webinars',     'Webinars',     'event'),
  ('event:sports',       'Sports',       'event'),
  ('event:music',        'Music',        'event'),
  ('event:food-drink',   'Food & Drink', 'event'),
  ('event:film',         'Film',         'event'),
  ('event:art',          'Art',          'event'),
  ('event:tech',         'Tech',         'event'),
  ('event:charity',      'Charity',      'event'),
  ('event:religious',    'Religious',    'event'),
  ('event:kids-family',  'Kids & Family','event'),
  ('event:nightlife',    'Nightlife',    'event'),
  -- opportunity categories
  ('opportunity:scholarships', 'Scholarships', 'opportunity'),
  ('opportunity:internships',  'Internships',  'opportunity'),
  ('opportunity:fellowships',  'Fellowships',  'opportunity'),
  ('opportunity:hackathons',   'Hackathons',   'opportunity'),
  ('opportunity:competitions', 'Competitions', 'opportunity'),
  ('opportunity:workshops',    'Workshops',    'opportunity'),
  ('opportunity:muns',         'MUNs',         'opportunity'),
  ('opportunity:olympiads',    'Olympiads',    'opportunity'),
  ('opportunity:courses',      'Courses',      'opportunity'),
  ('opportunity:grants',       'Grants',       'opportunity'),
  ('opportunity:volunteer',    'Volunteer',    'opportunity'),
  ('opportunity:accelerators', 'Accelerators', 'opportunity'),
  ('opportunity:jobs',         'Jobs',         'opportunity'),
  ('opportunity:research',     'Research',     'opportunity'),
  ('opportunity:training',     'Training',     'opportunity')
on conflict (id) do nothing;
