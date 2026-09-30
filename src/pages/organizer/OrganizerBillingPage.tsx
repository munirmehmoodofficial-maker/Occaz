import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  Crown,
  Building2,
  CreditCard,
  Calendar,
  Receipt,
  Shield,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../lib/auth";
import { useSubscription } from "../../hooks/useSubscription";
import { PLANS, type PlanId, type PlanInterval } from "../../lib/plans";
import { startCheckout, cancelSubscription } from "../../lib/billing";
import { validateCoupon } from "../../lib/coupons";
import { formatPrice } from "../../data/mock";
import clsx from "clsx";

export function OrganizerBillingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, subscription, payments, loading, refresh } = useSubscription();
  const [interval, setInterval] = useState<PlanInterval>("monthly");
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  if (!user) {
    return (
      <div className="page container text-center">
        <h1 className="text-2xl font-semibold">Sign in required</h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">
          Sign in as an organizer to manage your subscription.
        </p>
        <Link to="/login" className="mt-5 inline-block">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  async function onUpgrade(target: PlanId) {
    if (!user) return;
    if (target === plan.id) return;
    setMsg(null);
    setBusyPlan(target);
    const res = await startCheckout({
      plan: target,
      interval,
      userId: user.id,
      coupon: appliedCoupon?.code,
    });
    setBusyPlan(null);
    if (res.error) {
      setMsg({ kind: "err", text: res.error });
      return;
    }
    if (res.redirectUrl) {
      navigate(res.redirectUrl);
    } else {
      await refresh();
      setMsg({ kind: "ok", text: `You're now on ${PLANS.find((p) => p.id === target)?.name}.` });
    }
  }

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setCouponMsg(null);
    setCouponLoading(true);
    // validate against the currently-displayed prices for the *pro* plan as a
    // sensible default — the actual discount applies at checkout.
    const basePrice = interval === "yearly"
      ? PLANS.find((p) => p.id === "pro")!.yearlyPKR
      : PLANS.find((p) => p.id === "pro")!.monthlyPKR;
    const res = await validateCoupon(coupon, "pro", basePrice);
    setCouponLoading(false);
    if (!res.ok) {
      setCouponMsg({ kind: "err", text: res.error ?? "Invalid code" });
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon({ code: coupon.toUpperCase(), discount: res.discount });
    setCouponMsg({
      kind: "ok",
      text: `Saved ₨ ${res.discount.toLocaleString()} on Pro. Will apply at checkout.`,
    });
  }

  async function onCancel() {
    if (!subscription) return;
    if (!confirm("Cancel your subscription? You'll keep access until the period ends.")) return;
    setCancelling(true);
    const res = await cancelSubscription(subscription.id);
    setCancelling(false);
    if (res.error) {
      setMsg({ kind: "err", text: res.error });
    } else {
      await refresh();
      setMsg({ kind: "ok", text: "Subscription cancelled. Access continues until period end." });
    }
  }

  const periodEnd = subscription
    ? new Date(subscription.current_period_end).toLocaleDateString("en-PK", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="page pb-20">
      <div className="container">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Organizer
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              Billing & Plans
            </h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              Pick a plan that fits how many events you run.
            </p>
          </div>

          <div className="inline-flex rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)]">
            {(["monthly", "yearly"] as const).map((i) => (
              <button
                key={i}
                onClick={() => setInterval(i)}
                className={clsx(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  interval === i
                    ? "bg-white text-black"
                    : "text-[var(--text-tertiary)] hover:text-white",
                )}
              >
                {i === "monthly" ? "Monthly" : "Yearly · 2 months free"}
              </button>
            ))}
          </div>
        </div>

        {msg && (
          <div
            className={clsx(
              "mb-6 flex items-center gap-2 rounded-lg border p-3 text-sm",
              msg.kind === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-300",
            )}
          >
            {msg.kind === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Coupon code (Business plan perk) */}
        <div className="mb-6 rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-violet-400" />
              <div>
                <div className="text-sm font-medium">Have a coupon?</div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  Issued by Occaz Business organizers — apply at checkout
                </div>
              </div>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-200">
                <Tag className="h-3.5 w-3.5" />
                <span className="font-mono">{appliedCoupon.code}</span>
                <span>− ₨ {appliedCoupon.discount.toLocaleString()}</span>
                <button
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCoupon("");
                    setCouponMsg(null);
                  }}
                  className="ml-1 rounded p-0.5 hover:bg-emerald-500/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="OCCAZ20"
                  className="input w-32 font-mono text-sm uppercase"
                />
                <Button
                  size="sm"
                  onClick={applyCoupon}
                  disabled={couponLoading || !coupon.trim()}
                >
                  {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                </Button>
              </div>
            )}
          </div>
          {couponMsg && (
            <p
              className={clsx(
                "mt-2 text-xs",
                couponMsg.kind === "ok" ? "text-emerald-300" : "text-red-300",
              )}
            >
              {couponMsg.text}
            </p>
          )}
        </div>

        {/* Current plan summary */}
        {subscription && (
          <div className="mb-8 grid gap-3 rounded-2xl border border-accent-500/30 bg-gradient-to-br from-accent-500/10 to-pink-500/5 p-6 sm:grid-cols-4">
            <Stat label="Current plan" value={plan.name} icon={<Crown className="h-4 w-4 text-accent-400" />} />
            <Stat
              label="Status"
              value={subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              icon={<Shield className="h-4 w-4 text-accent-400" />}
            />
            <Stat
              label="Renews / ends"
              value={periodEnd ?? "—"}
              icon={<Calendar className="h-4 w-4 text-accent-400" />}
            />
            <Stat
              label="Billed"
              value={`${formatPrice(subscription.amount, subscription.currency)} / ${subscription.interval.replace("ly", "")}`}
              icon={<CreditCard className="h-4 w-4 text-accent-400" />}
            />
            {subscription.status === "active" && plan.id !== "free" && (
              <div className="sm:col-span-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={cancelling}
                >
                  {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Cancel subscription
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Plans */}
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => {
            const price = interval === "yearly" ? p.yearlyPKR : p.monthlyPKR;
            const isCurrent = plan.id === p.id && subscription?.status === "active";
            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -4 }}
                className={clsx(
                  "relative flex flex-col rounded-2xl border bg-[var(--bg-card)] p-6 ring-1 transition",
                  p.popular
                    ? "border-accent-500/50 ring-accent-500/30 shadow-[0_0_40px_-12px] shadow-accent-500/40"
                    : "border-[var(--border-subtle)] ring-[var(--border-subtle)]",
                )}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent-500 to-pink-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                    Most popular
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {p.id === "free" && <Sparkles className="h-5 w-5 text-[var(--text-tertiary)]" />}
                  {p.id === "pro" && <Crown className="h-5 w-5 text-accent-400" />}
                  {p.id === "business" && <Building2 className="h-5 w-5 text-violet-400" />}
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                </div>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">{p.tagline}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {price === 0 ? "Free" : formatPrice(price, "PKR")}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-[var(--text-tertiary)]">
                      / {interval.replace("ly", "")}
                    </span>
                  )}
                </div>

                <ul className="mt-5 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                      <span className="text-[var(--text-secondary)]">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-2">
                  {isCurrent ? (
                    <Button variant="outline" disabled fullWidth>
                      Current plan
                    </Button>
                  ) : p.id === "free" ? (
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={onCancel}
                      disabled={!subscription || subscription.plan === "free" || cancelling}
                    >
                      {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Downgrade to Free
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      onClick={() => onUpgrade(p.id)}
                      disabled={busyPlan === p.id}
                    >
                      {busyPlan === p.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      )}
                      {plan.id === "free" ? "Upgrade" : "Switch"} to {p.name}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature comparison */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold">What's included</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Feature comparison across all plans
          </p>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-elevated)] text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                <tr>
                  <th className="px-4 py-3 text-left">Feature</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="px-4 py-3 text-center">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {[
                  { label: "Events per month", values: ["3", "25", "25"] },
                  { label: "Featured placement", values: PLANS.map((p) => (p.flags.canFeature ? "✓" : "—")) },
                  { label: "Promotional tools", values: PLANS.map((p) => (p.flags.hasPromotionalTools ? "✓" : "—")) },
                  { label: "Audience insights", values: PLANS.map((p) => (p.flags.hasAudienceInsights ? "✓" : "—")) },
                  { label: "Organizer profile customization", values: PLANS.map((p) => (p.flags.canCustomizeProfile ? "✓" : "—")) },
                  { label: "Advanced analytics", values: PLANS.map((p) => (p.flags.hasAdvancedAnalytics ? "✓" : "—")) },
                  { label: "Multiple organizers / users", values: PLANS.map((p) => (p.flags.hasMultipleOrganizers ? "✓" : "—")) },
                  { label: "Campaign tools", values: PLANS.map((p) => (p.flags.hasCampaignTools ? "✓" : "—")) },
                  { label: "Priority promotion", values: PLANS.map((p) => (p.flags.hasPriorityPromotion ? "✓" : "—")) },
                  { label: "Dedicated support", values: PLANS.map((p) => (p.flags.hasDedicatedSupport ? "✓" : "—")) },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-4 py-3 text-center text-[var(--text-secondary)]">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment history */}
        <div className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Receipt className="h-4 w-4 text-[var(--text-tertiary)]" /> Payment history
          </h2>
          {payments.length === 0 ? (
            <p className="mt-3 rounded-xl bg-[var(--bg-card)] p-6 text-sm text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
              No payments yet. {plan.id === "free" ? "You're on the Free plan." : ""}
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-elevated)] text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        {new Date(p.created_at).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-tertiary)]">
                        {p.id}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {p.gateway ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatPrice(p.amount, p.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={clsx(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1",
                            p.status === "succeeded" && "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
                            p.status === "pending" && "bg-amber-500/15 text-amber-300 ring-amber-500/30",
                            p.status === "failed" && "bg-red-500/15 text-red-300 ring-red-500/30",
                            p.status === "refunded" && "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] ring-[var(--border-subtle)]",
                          )}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {loading && (
          <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">Refreshing…</p>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}
