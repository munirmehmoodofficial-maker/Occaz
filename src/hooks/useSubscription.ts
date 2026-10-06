// Lightweight plan system that doesn't depend on subscriptions/payments tables
// (which don't exist in this Supabase project). Plan level is stored in
// profiles.plan, and the user's organization record is read from `organizations`.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { getPlan, PLANS, type Plan, type PlanId } from "../lib/plans";

export interface OrganizerProfile {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  social_links: any;
}

/** Stub subscription shape — fields old code expects, defaults to starter. */
export interface Subscription {
  id: string;
  plan: "starter" | "pro" | "business";
  status: string;
  current_period_end: string;
  amount: number;
  currency: string;
  interval: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  created_at: string;
  gateway?: string;
}

export function useSubscription() {
  const { user, isAdmin } = useAuth();
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);
  const [planId, setPlanId] = useState<PlanId | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setOrganizerProfile(null);
      setSubscription(null);
      setPayments([]);
      setPlanId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    // 1. Read plan from profiles. Defensive: the `plan` column may be missing
    // on older deployments. Try the narrow query first; if it errors out,
    // fall back to a column-agnostic read so the hook never crashes.
    let rawPlan: any = null;
    try {
      const { data: profileRow, error: planErr } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      if (!planErr) rawPlan = (profileRow as any)?.plan;
    } catch (e) {
      // column doesn't exist or RLS denied — treat as "no plan yet"
      rawPlan = null;
    }

    // Only set planId if it's a recognized value. New users with no plan
    // will have planId = null, which the dashboard treats as "No plan yet".
    const pid: PlanId | null =
      rawPlan === "pro" || rawPlan === "business" || rawPlan === "starter"
        ? rawPlan
        : null;
    setPlanId(pid);

    // 2. Read the user's organization
    const { data: orgByCreator } = await supabase
      .from("organizations")
      .select(
        "id, name, slug, logo_url, cover_url, description, website, email, phone, social_links",
      )
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setOrganizerProfile((orgByCreator as OrganizerProfile) ?? null);

    // 3. Synthesize a Subscription stub based on plan.
    // pid === null means "no plan yet" — no subscription to synthesize.
    if (pid === "pro" || pid === "business") {
      const amount = pid === "pro" ? 5000 : 12000;
      setSubscription({
        id: `sim-${user.id}`,
        plan: pid,
        status: "active",
        current_period_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        amount,
        currency: "PKR",
        interval: "monthly",
      });
    } else {
      // starter or null — no active subscription shown
      setSubscription(null);
    }
    setPayments([]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime refresh on profile.plan changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`org-sub-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          if ((payload.new as any)?.id === user.id) load();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const plan: Plan = getPlan(planId);
  const effectiveIsAdmin: boolean = Boolean(isAdmin);

  function can(feature: keyof Plan["flags"]): boolean {
    // Admins always have access to all features regardless of plan.
    if (effectiveIsAdmin) return true;
    return Boolean(plan.flags[feature]);
  }

  return {
    plan,
    planId,
    subscription,
    payments,
    organizerProfile,
    loading,
    error,
    can,
    monthlyLimit: plan.flags.maxEventsPerMonth,
    plans: PLANS,
    refresh: load,
  };
}
