-- ============================================================
-- Occaz — Pricing tiers for opportunities
-- ============================================================
-- Run in Supabase → SQL Editor → New query → paste → Run.
-- Idempotent: safe to run multiple times.
--
-- Events already support multiple ticket tiers via the
-- `events.ticket_types` jsonb column.
--
-- Opportunities only had a single application fee
-- (free / one_time / recurring). This adds a `fee_tiers` jsonb
-- column so an opportunity can offer several application options
-- (e.g. "Standard Rs 500", "Premium Rs 1,500", "Free — merit
-- based"), each with its own price, label and description.
--
-- Shape:
-- [
--   { "id": "ft-1", "name": "Standard", "price": 500,
--     "description": "Standard review", "perks": ["..."] },
--   { "id": "ft-2", "name": "Premium", "price": 1500, ... }
-- ]
--
-- Empty array / null  →  the opportunity uses the single
-- `fee_type` + `price` fields (existing behaviour, unchanged).
-- ============================================================


-- 1) Column
do $$
begin
  alter table public.opportunities
    add column if not exists fee_tiers jsonb not null default '[]'::jsonb;
exception when others then
  raise notice 'opportunities.fee_tiers skipped: %', SQLERRM;
end $$;

-- 2) Backfill: a single-fee opportunity gets a one-tier list so the
--    admin UI has something to show. The `fee_type`/`price` columns
--    stay authoritative for the "no tiers" case.
update public.opportunities
   set fee_tiers = jsonb_build_array(
         jsonb_build_object(
           'id', 'ft-default',
           'name', case when fee_type = 'recurring' then 'Recurring' else 'Standard' end,
           'price', coalesce(price, 0),
           'description', '',
           'perks', '[]'::jsonb
         )
       )
 where (fee_tiers is null or fee_tiers = '[]'::jsonb)
   and coalesce(price, 0) > 0;

-- 3) Index for filtering
create index if not exists idx_opps_fee_tiers on public.opportunities using gin (fee_tiers);

-- 4) Sanity check
select
  (select count(*) from public.opportunities) as opps_total,
  (select count(*) from public.opportunities
     where fee_tiers is not null and fee_tiers <> '[]'::jsonb) as opps_with_tiers;

select 'Opportunity pricing tiers ready' as status;
