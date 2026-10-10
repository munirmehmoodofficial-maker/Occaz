import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Crown, Sparkles, Star, X } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../lib/toast";
import { Button } from "../../components/ui/Button";
import clsx from "clsx";

// Mirror of PLANS in src/lib/plans.ts so we don't need to import it
// (and to keep this page standalone)
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 3000,
    color: "from-slate-500/20 to-slate-500/10",
    ringColor: "ring-slate-500/30",
    flags: {
      canCustomizeProfile: true,
      hasAudienceInsights: false,
      canFeature: false,
      hasPromotionalTools: false,
      hasAdvancedAnalytics: false,
      maxEventsPerMonth: 3,
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: 5000,
    color: "from-accent-500/30 via-pink-500/20 to-fuchsia-500/10",
    ringColor: "ring-accent-500/40",
    flags: {
      canCustomizeProfile: true,
      hasAudienceInsights: true,
      canFeature: true,
      hasPromotionalTools: true,
      hasAdvancedAnalytics: false,
      maxEventsPerMonth: 15,
    },
  },
  {
    id: "business",
    name: "Business",
    price: 12000,
    color: "from-violet-500/30 via-purple-500/20 to-fuchsia-500/10",
    ringColor: "ring-violet-500/40",
    flags: {
      canCustomizeProfile: true,
      hasAudienceInsights: true,
      canFeature: true,
      hasPromotionalTools: true,
      hasAdvancedAnalytics: true,
      maxEventsPerMonth: 9999,
    },
  },
] as const;

type PlanId = "starter" | "pro" | "business";

const FEATURE_LABELS: Array<[string, (p: typeof PLANS[number]["flags"]) => boolean | string]> = [
  ["Customize organizer page", (f) => f.canCustomizeProfile],
  ["Audience insights", (f) => f.hasAudienceInsights],
  ["Feature events on home page", (f) => f.canFeature],
  ["Promo codes & coupons", (f) => f.hasPromotionalTools],
  ["Advanced analytics & revenue splits", (f) => f.hasAdvancedAnalytics],
  ["Max events per month", (f) => (f.maxEventsPerMonth >= 9999 ? "Unlimited" : f.maxEventsPerMonth)],
];

export function AdminOrganizerBillingPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { push } = useToast();
  const [org, setOrg] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | "none">("none");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("organizer_profiles")
        .select("id, display_name, slug, plan, logo")
        .eq("id", id)
        .maybeSingle();
      if (!alive) return;
      if (error) {
        push({ tone: "red", title: "Load failed", message: error.message });
      } else if (!data) {
        push({ tone: "red", title: "Not found", message: "No organizer with that ID." });
      } else {
        setOrg(data);
        setSelectedPlan((data.plan as PlanId) ?? "none");
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function applyPlan() {
    if (!org) return;
    setSaving(true);
    try {
      const planValue = selectedPlan === "none" ? null : selectedPlan;
      const { error } = await supabase
        .from("organizer_profiles")
        .update({ plan: planValue, updated_at: new Date().toISOString() })
        .eq("id", org.id);
      if (error) {
        push({ tone: "red", title: "Update failed", message: error.message });
        return;
      }
      push({
        tone: "green",
        title: "Plan updated",
        message: `${org.display_name} is now on ${selectedPlan === "none" ? "no plan" : PLANS.find((p) => p.id === selectedPlan)?.name}.`,
      });
      // Navigate back to the organizers list
      setTimeout(() => {
        navigate("/admin/organizers");
      }, 600);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] p-8 text-center text-sm text-[var(--text-tertiary)]">
        Loading…
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] p-8 text-center">
        <p className="text-sm text-[var(--text-tertiary)]">Organizer not found.</p>
        <Button className="mt-4" onClick={() => navigate("/admin/organizers")}>
          Back to organizers
        </Button>
      </div>
    );
  }

  const ref = params.get("ref");

  return (
    <div className="min-h-screen bg-[var(--bg-base)] p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div className="mb-6 flex items-center gap-3">
          {org.logo ? (
            <img src={org.logo} className="h-10 w-10 rounded-lg object-cover" alt="" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-accent-500 to-pink-500 text-sm font-bold text-white">
              {(org.display_name || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{org.display_name}</h1>
            <div className="text-xs text-[var(--text-tertiary)]">
              {ref === "admin-add" ? "Just added" : "Select a plan"} · Current: <strong>{org.plan ?? "No plan"}</strong>
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1 text-sm">
          <button
            onClick={() => setInterval("monthly")}
            className={clsx(
              "rounded-lg px-4 py-1.5 font-medium transition",
              interval === "monthly"
                ? "bg-white text-black"
                : "text-[var(--text-tertiary)] hover:text-white",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={clsx(
              "rounded-lg px-4 py-1.5 font-medium transition",
              interval === "yearly"
                ? "bg-white text-black"
                : "text-[var(--text-tertiary)] hover:text-white",
            )}
          >
            Yearly <span className="ml-1 text-[10px] text-emerald-400">−20%</span>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = (org.plan ?? "none") === p.id;
            const isSelected = selectedPlan === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlan(p.id)}
                className={clsx(
                  "group relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-left ring-1 transition",
                  p.color,
                  isSelected ? "ring-2 ring-accent-400" : p.ringColor,
                )}
              >
                {isCurrent && (
                  <span className="absolute right-3 top-3 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                    Current
                  </span>
                )}
                <div className="flex items-center gap-2">
                  {p.id === "pro" && <Crown className="h-5 w-5 text-accent-400" />}
                  {p.id === "business" && <Sparkles className="h-5 w-5 text-violet-400" />}
                  {p.id === "starter" && <Star className="h-5 w-5 text-slate-400" />}
                  <div className="text-lg font-semibold">{p.name}</div>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    ₨ {interval === "yearly" ? Math.round(p.price * 0.8).toLocaleString() : p.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    /{interval === "yearly" ? "mo (billed yearly)" : "mo"}
                  </span>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-[var(--text-secondary)]">
                  {FEATURE_LABELS.map(([label, get]) => {
                    const on = get(p.flags);
                    return (
                      <div key={label} className="flex items-start gap-1.5">
                        {on ? (
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        ) : (
                          <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" />
                        )}
                        <span className={on ? "" : "text-[var(--text-tertiary)] line-through"}>
                          {label}
                          {typeof on === "string" && on !== "true" ? `: ${on}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {isSelected && (
                  <div className="mt-4 text-center text-xs font-semibold text-accent-300">
                    Selected
                  </div>
                )}
              </button>
            );
          })}

          {/* "No plan" option */}
          <button
            type="button"
            onClick={() => setSelectedPlan("none")}
            className={clsx(
              "group relative flex flex-col items-center justify-center rounded-3xl bg-[var(--bg-card)] p-6 text-left ring-1 transition",
              selectedPlan === "none" ? "ring-2 ring-accent-400" : "ring-[var(--border-subtle)]",
            )}
          >
            <div className="text-sm font-semibold">No plan</div>
            <div className="mt-1 text-[10px] text-[var(--text-tertiary)]">
              Organizer can browse but can't publish events.
            </div>
          </button>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => navigate("/admin/organizers")}>
            Skip for now
          </Button>
          <Button
            onClick={applyPlan}
            disabled={saving}
            leftIcon={saving ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>⟳</motion.span> : <Check className="h-3.5 w-3.5" />}
          >
            {saving ? "Saving…" : "Apply plan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
