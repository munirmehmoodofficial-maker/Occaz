import { CreditCard, Check, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthly: 3000,
    yearly: 30000,
    desc: "For new organizers getting their first events online.",
    features: [
      "Up to 3 events per month",
      "Standard event pages",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 5000,
    yearly: 50000,
    desc: "For growing organizers selling tickets regularly.",
    features: [
      "Up to 15 events per month",
      "Featured event placement",
      "Promo codes & referrals",
      "Priority email support",
    ],
  },
  {
    id: "business",
    name: "Business",
    monthly: 12000,
    yearly: 120000,
    desc: "For established organizers running at scale.",
    features: [
      "Unlimited events",
      "Featured + home rotation",
      "Promo codes & referrals",
      "Dedicated success manager",
    ],
  },
];

/**
 * Section 9 — Subscription & Plan
 * Real data: profile.plan + organizer_plan_payments history.
 */
export function Section9Subscription() {
  const { user, profile } = useAuth();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("organizer_plan_payments")
        .select("id, plan, interval, amount, status, created_at, reviewed_at, method")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setPayments(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const currentPlan = profile?.plan ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Subscription & plan</h2>
        <p className="text-xs text-zinc-500">
          Current plan: <span className="font-semibold text-white">
            {currentPlan
              ? PLANS.find((p) => p.id === currentPlan)?.name ?? currentPlan
              : "No plan"}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 self-start rounded-xl border border-white/5 bg-[var(--bg-card)] p-1">
        {(["monthly", "yearly"] as const).map((i) => (
          <button
            key={i}
            onClick={() => setInterval(i)}
            className={
              "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize " +
              (interval === i
                ? "bg-white/10 text-white"
                : "text-zinc-500 hover:text-zinc-300")
            }
          >
            {i}
            {i === "yearly" && (
              <span className="ml-1 rounded-full bg-pink-500/20 px-1.5 py-0.5 text-[9px] text-pink-300">
                Save 17%
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = currentPlan === p.id;
          const price = interval === "monthly" ? p.monthly : p.yearly;
          return (
            <div
              key={p.id}
              className={
                "rounded-2xl border bg-[var(--bg-card)] p-5 " +
                (isCurrent
                  ? "border-pink-500/40 ring-1 ring-pink-500/30"
                  : "border-white/5")
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{p.name}</div>
                  {isCurrent && (
                    <span className="mt-1 inline-block rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pink-300">
                      Current
                    </span>
                  )}
                </div>
                <CreditCard className="h-4 w-4 text-zinc-600" />
              </div>
              <div className="mt-3 text-2xl font-bold text-white">
                ₨ {price.toLocaleString()}
                <span className="ml-1 text-xs font-normal text-zinc-500">
                  /{interval === "monthly" ? "mo" : "yr"}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{p.desc}</p>
              <ul className="mt-3 space-y-1.5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-1.5 text-xs text-zinc-300"
                  >
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrent}
                className={
                  "mt-4 w-full rounded-lg px-3 py-2 text-xs font-semibold " +
                  (isCurrent
                    ? "bg-white/5 text-zinc-500"
                    : "bg-gradient-to-r from-pink-500 to-accent-500 text-white hover:opacity-90")
                }
              >
                {isCurrent ? "Your current plan" : `Switch to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <h3 className="text-sm font-bold text-white">Payment history</h3>
        {loading ? (
          <div className="mt-3 text-sm text-zinc-500">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-500">
            No payments yet.
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-pink-500/15 text-pink-300">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">
                    {PLANS.find((x) => x.id === p.plan)?.name ?? p.plan} ·{" "}
                    {p.interval}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm font-semibold text-white">
                  ₨ {Number(p.amount).toLocaleString()}
                </div>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                    (p.status === "approved"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : p.status === "rejected"
                        ? "bg-red-500/15 text-red-300"
                        : "bg-amber-500/15 text-amber-300")
                  }
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
