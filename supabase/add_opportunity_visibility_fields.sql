-- ============================================================
-- Occaz — Opportunity: hide stipend + per-tier apply URLs
-- ============================================================
-- Run in Supabase → SQL Editor → New query → paste → Run.
-- Idempotent: safe to run multiple times.
--
-- 1) show_stipend
--    Not every opportunity has a stipend (most don't). The field was
--    always rendered, so listings showed a misleading "Unpaid" / "Stipend
--    / Value" block. This boolean lets the admin hide it entirely.
--    Default TRUE so existing listings keep showing the stipend.
--
-- 2) Per-tier apply URL
--    fee_tiers is a jsonb array. Each tier can now carry its own
--    `applyUrl`, so picking a tier takes the applicant to that tier's
--    form instead of one generic link. Tiers without an applyUrl fall
--    back to the listing-level apply_url.
--
-- 3) show_fee
--    Same idea for the application fee — some listings want to hide the
--    pricing block entirely and just show a free "Apply" button.
-- ============================================================


-- 1) show_stipend
do $$
begin
  alter table public.opportunities
    add column if not exists show_stipend boolean not null default true;
exception when others then
  raise notice 'opportunities.show_stipend skipped: %', SQLERRM;
end $$;

-- 2) show_fee
do $$
begin
  alter table public.opportunities
    add column if not exists show_fee boolean not null default true;
exception when others then
  raise notice 'opportunities.show_fee skipped: %', SQLERRM;
end $$;


-- 3) Ensure every existing tier row has an applyUrl key (may be empty).
update public.opportunities
   set fee_tiers = (
         select jsonb_agg(
                  case when jsonb_typeof(t) = 'object'
                       then t || jsonb_build_object(
                              'applyUrl', coalesce(t->>'applyUrl', '')
                            )
                       else t
                  end)
         from jsonb_array_elements(fee_tiers) as t
       )
 where fee_tiers is not null
   and fee_tiers <> '[]'::jsonb
   and exists (
     select 1
       from jsonb_array_elements(fee_tiers) as t
      where jsonb_typeof(t) = 'object'
        and not (t ? 'applyUrl')
   );


-- 4) Sanity check
select
  (select count(*) from public.opportunities) as opps_total,
  (select count(*) from public.opportunities where show_stipend) as shows_stipend,
  (select count(*) from public.opportunities where show_fee) as shows_fee,
  (select count(*) from public.opportunities
     where fee_tiers is not null and fee_tiers <> '[]'::jsonb) as with_tiers;

select 'Opportunity stipend/fee visibility + tier apply URLs ready' as status;
