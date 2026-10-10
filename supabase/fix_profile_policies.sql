-- Fix RLS policies on profiles so admins can create organizer accounts.
-- Currently profiles only has SELECT and UPDATE policies. We need INSERT too.

do $$
begin
  -- Drop existing policies that might be in the way
  -- (keep the names idempotent so re-runs are safe)
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profile admin insert') then
    drop policy "profile admin insert" on public.profiles;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profile admin update') then
    drop policy "profile admin update" on public.profiles;
  end if;
exception when others then
  raise notice 'policy drop skipped: %', SQLERRM;
end $$;

-- Admins can insert profile rows for any user
create policy "profile admin insert"
  on public.profiles for insert
  with check (public.is_admin(auth.uid()));

-- Admins can update any profile row
create policy "profile admin update"
  on public.profiles for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
