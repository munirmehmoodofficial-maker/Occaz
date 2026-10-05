import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Upload,
  Image as ImageIcon,
  Building2 as BankIcon,
  Copy,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../lib/auth";
import { useSubscription } from "../../hooks/useSubscription";
import { PLANS, type PlanId, type PlanInterval } from "../../lib/plans";
import { startCheckout, cancelSubscription } from "../../lib/billing";
import { validateCoupon } from "../../lib/coupons";
import { formatPrice } from "../../data/mock";
import { useToast } from "../../lib/toast.tsx";
import { supabase } from "../../lib/supabase";
import clsx from "clsx";

interface PaymentSetting {
  id: string;
  scope: string;
  target_id: string | null;
  account_title: string;
  account_number: string;
  bank_name: string | null;
  instructions: string | null;
  active: boolean;
}

export function OrganizerBillingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const { plan, subscription, loading, refresh } = useSubscription();
  const [interval, setInterval] = useState<PlanInterval>("monthly");
  const [busyPlan, setBusyPlan] = useState<PlanId | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  // Coupon state — per plan (Starter doesn't get coupons, only Pro & Business)
  const [couponInput, setCouponInput] = useState<Record<"pro" | "business", string>>({
    pro: "",
    business: "",
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Record<"pro" | "business", { code: string; discount: number } | null>>({
    pro: null,
    business: null,
  });
  const [couponMsg, setCouponMsg] = useState<Record<"pro" | "business", { kind: "ok" | "err"; text: string } | null>>({
    pro: null,
    business: null,
  });
  const [couponLoading, setCouponLoading] = useState<"pro" | "business" | null>(null);

  // Manual payment modal state
  const [manualFor, setManualFor] = useState<PlanId | null>(null);
  const [manualPayment, setManualPayment] = useState<PaymentSetting | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [manualTxRef, setManualTxRef] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [submittingManual, setSubmittingManual] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  async function loadManualSettings() {
    // Try global default
    const { data } = await supabase
      .from("payment_settings")
      .select("*")
      .eq("active", true)
      .eq("scope", "global")
      .limit(1)
      .maybeSingle();
    setManualPayment((data as PaymentSetting) ?? null);
  }

  function openManualFor(target: PlanId) {
    setManualFor(target);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setManualTxRef("");
    setManualNotes("");
    loadManualSettings();
  }

  function closeManual() {
    setManualFor(null);
  }

  function onPickFile(f: File | null) {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      push("err", "Screenshot must be under 8MB");
      return;
    }
    if (!f.type.startsWith("image/")) {
      push("err", "Please choose an image file");
      return;
    }
    setScreenshotFile(f);
    const url = URL.createObjectURL(f);
    setScreenshotPreview(url);
  }

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

  async function onUpgradeCard(target: PlanId) {
    if (!user) return;
    if (target === plan.id) return;
    setMsg(null);
    setBusyPlan(target);
    const basePrice = interval === "yearly" ? PLANS.find((p) => p.id === target)!.yearlyPKR : PLANS.find((p) => p.id === target)!.monthlyPKR;
    const targetCoupon = target === "starter" ? null : appliedCoupon[target as "pro" | "business"];
    const finalPrice = targetCoupon
      ? Math.max(0, basePrice - targetCoupon.discount)
      : basePrice;
    const res = await startCheckout({
      plan: target,
      interval,
      method: "card",
      userId: user.id,
      amount: finalPrice,
      coupon: targetCoupon?.code,
    });
    setBusyPlan(null);
    if (res.error) {
      setMsg({ kind: "err", text: res.error });
      return;
    }
    if (res.status === "failed") {
      setMsg({ kind: "err", text: "Payment failed. Please try again." });
      return;
    }
    await refresh();
    setMsg({ kind: "ok", text: `You're now on ${PLANS.find((p) => p.id === target)?.name}.` });
  }

  async function onSubmitManual() {
    if (!user || !manualFor) return;
    if (!screenshotFile) {
      push("err", "Please upload a screenshot of your payment");
      return;
    }
    if (!manualPayment) {
      push("err", "No payment method configured. Contact the admin or use card payment.");
      return;
    }
    setSubmittingManual(true);
    try {
      const basePrice = interval === "yearly"
        ? PLANS.find((p) => p.id === manualFor)!.yearlyPKR
        : PLANS.find((p) => p.id === manualFor)!.monthlyPKR;
      const targetCoupon = manualFor === "starter" ? null : appliedCoupon[manualFor as "pro" | "business"];
      const finalPrice = targetCoupon
        ? Math.max(0, basePrice - targetCoupon.discount)
        : basePrice;
      const res = await startCheckout({
        plan: manualFor,
        interval,
        method: "manual",
        userId: user.id,
        amount: finalPrice,
        coupon: targetCoupon?.code,
        screenshotFile,
        transactionRef: manualTxRef,
        notes: manualNotes,
      });
      if (res.error || res.status === "failed") {
        push("err", res.error || "Submission failed");
        return;
      }
      push("ok", "Payment proof submitted! We'll review and activate your plan within a few hours.");
      closeManual();
      await refresh();
    } catch (e: any) {
      push("err", e?.message || "Submission failed");
    } finally {
      setSubmittingManual(false);
      setUploadingScreenshot(false);
    }
  }

  async function applyCoupon(planId: "pro" | "business") {
    const code = couponInput[planId].trim();
    if (!code) return;
    setCouponMsg((prev) => ({ ...prev, [planId]: null }));
    setCouponLoading(planId);
    const basePrice = interval === "yearly"
      ? PLANS.find((p) => p.id === planId)!.yearlyPKR
      : PLANS.find((p) => p.id === planId)!.monthlyPKR;
    const res = await validateCoupon(code, planId, basePrice);
    setCouponLoading(null);
    if (!res.ok) {
      setCouponMsg((prev) => ({ ...prev, [planId]: { kind: "err", text: res.error ?? "Invalid code" } }));
      setAppliedCoupon((prev) => ({ ...prev, [planId]: null }));
      return;
    }
    const planName = planId === "business" ? "Business" : "Pro";
    setAppliedCoupon((prev) => ({ ...prev, [planId]: { code: code.toUpperCase(), discount: res.discount } }));
    setCouponMsg((prev) => ({
      ...prev,
      [planId]: {
        kind: "ok",
        text: `Saved ₨ ${res.discount.toLocaleString()} on ${planName}. Will apply at checkout.`,
      },
    }));
  }

  function clearCoupon(planId: "pro" | "business") {
    setAppliedCoupon((prev) => ({ ...prev, [planId]: null }));
    setCouponInput((prev) => ({ ...prev, [planId]: "" }));
    setCouponMsg((prev) => ({ ...prev, [planId]: null }));
  }

  async function onCancel() {
    if (!subscription) return;
    if (!confirm("Cancel your subscription? You'll keep access until the period ends, then revert to Starter.")) return;
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
            {subscription.status === "active" && plan.id !== "starter" && (
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
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => {
            const price = interval === "yearly" ? p.yearlyPKR : p.monthlyPKR;
            const isCurrent = plan.id === p.id && subscription?.status === "active";
            const cardCoupon = p.id === "starter" ? null : appliedCoupon[p.id as "pro" | "business"];
            const finalPrice = cardCoupon ? Math.max(0, price - cardCoupon.discount) : price;
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
                  {p.id === "starter" && <Sparkles className="h-5 w-5 text-[var(--text-tertiary)]" />}
                  {p.id === "pro" && <Crown className="h-5 w-5 text-accent-400" />}
                  {p.id === "business" && <Building2 className="h-5 w-5 text-violet-400" />}
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                </div>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">{p.tagline}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {formatPrice(finalPrice, "PKR")}
                  </span>
                  <span className="text-sm text-[var(--text-tertiary)]">
                    / {interval.replace("ly", "")}
                  </span>
                  {cardCoupon && (
                    <span className="ml-1 text-sm text-[var(--text-tertiary)] line-through">
                      {formatPrice(price, "PKR")}
                    </span>
                  )}
                </div>

                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                      <span className="text-[var(--text-secondary)]">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-2 pt-2">
                  {isCurrent ? (
                    <Button variant="outline" disabled fullWidth>
                      Current plan
                    </Button>
                  ) : (
                    <>
                      <Button
                        fullWidth
                        onClick={() => onUpgradeCard(p.id)}
                        disabled={busyPlan === p.id}
                        leftIcon={
                          busyPlan === p.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CreditCard className="h-3.5 w-3.5" />
                          )
                        }
                      >
                        {plan.id === "starter" ? "Upgrade" : "Switch"} with card
                      </Button>
                      <Button
                        fullWidth
                        variant="outline"
                        onClick={() => openManualFor(p.id)}
                        leftIcon={<BankIcon className="h-3.5 w-3.5" />}
                      >
                        Pay manually
                      </Button>
                    </>
                  )}

                  {/* Per-plan coupon input — Pro and Business only */}
                  {(p.id === "pro" || p.id === "business") && !isCurrent && (
                    <div className="mt-3 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 p-3">
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-violet-300">
                        <Tag className="h-3.5 w-3.5" />
                        Coupon code
                      </div>
                      {appliedCoupon[p.id] ? (
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-200">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono truncate">{appliedCoupon[p.id]!.code}</span>
                            <span className="shrink-0">− ₨ {appliedCoupon[p.id]!.discount.toLocaleString()}</span>
                          </div>
                          <button
                            onClick={() => clearCoupon(p.id)}
                            className="shrink-0 rounded p-0.5 hover:bg-emerald-500/20"
                            aria-label="Remove coupon"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                            <input
                              value={couponInput[p.id]}
                              onChange={(e) => setCouponInput((prev) => ({ ...prev, [p.id]: e.target.value.toUpperCase() }))}
                              placeholder={p.id === "business" ? "OCCAZ30" : "OCCAZ20"}
                              className="input min-w-0 flex-1 font-mono text-xs uppercase"
                            />
                            <Button
                              size="sm"
                              onClick={() => applyCoupon(p.id)}
                              disabled={couponLoading === p.id || !couponInput[p.id].trim()}
                            >
                              {couponLoading === p.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Apply"
                              )}
                            </Button>
                          </div>
                      )}
                      {couponMsg[p.id] && (
                        <p
                          className={clsx(
                            "mt-1.5 text-[11px]",
                            couponMsg[p.id]!.kind === "ok" ? "text-emerald-300" : "text-red-300",
                          )}
                        >
                          {couponMsg[p.id]!.text}
                        </p>
                      )}
                    </div>
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

          {(() => {
            const rows = [
              { label: "Events per month", values: PLANS.map((p) => p.flags.maxEventsPerMonth.toString()) },
              { label: "Featured placement", values: PLANS.map((p) => (p.flags.canFeature ? "✓" : "—")) },
              { label: "Promotional tools", values: PLANS.map((p) => (p.flags.hasPromotionalTools ? "✓" : "—")) },
              { label: "Audience insights", values: PLANS.map((p) => (p.flags.hasAudienceInsights ? "✓" : "—")) },
              { label: "Profile customization", values: PLANS.map((p) => (p.flags.canCustomizeProfile ? "✓" : "—")) },
              { label: "Advanced analytics", values: PLANS.map((p) => (p.flags.hasAdvancedAnalytics ? "✓" : "—")) },
              { label: "Multiple organizers", values: PLANS.map((p) => (p.flags.hasMultipleOrganizers ? "✓" : "—")) },
              { label: "Campaign tools", values: PLANS.map((p) => (p.flags.hasCampaignTools ? "✓" : "—")) },
              { label: "Priority promotion", values: PLANS.map((p) => (p.flags.hasPriorityPromotion ? "✓" : "—")) },
              { label: "Dedicated support", values: PLANS.map((p) => (p.flags.hasDedicatedSupport ? "✓" : "—")) },
            ];
            return (
              <>
                {/* Mobile: per-plan cards stacked */}
                <div className="mt-5 grid gap-3 md:hidden">
                  {PLANS.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        {p.id === "starter" && <Sparkles className="h-4 w-4 text-[var(--text-tertiary)]" />}
                        {p.id === "pro" && <Crown className="h-4 w-4 text-accent-400" />}
                        {p.id === "business" && <Building2 className="h-4 w-4 text-violet-400" />}
                        <h3 className="text-sm font-semibold">{p.name}</h3>
                      </div>
                      <ul className="space-y-1.5 text-xs">
                        {rows.map((row) => (
                          <li key={row.label} className="flex items-center justify-between gap-2">
                            <span className="text-[var(--text-tertiary)]">{row.label}</span>
                            <span className="font-medium text-[var(--text-secondary)]">
                              {row.values[PLANS.findIndex((pl) => pl.id === p.id)]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Desktop: actual table */}
                <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-[var(--border-subtle)] md:block">
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
                      {rows.map((row) => (
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
              </>
            );
          })()}
        </div>

        {loading && (
          <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">Refreshing…</p>
        )}
      </div>

      {/* Manual payment modal */}
      <AnimatePresence>
        {manualFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={closeManual}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-3xl bg-[var(--bg-elevated)] p-6 shadow-2xl ring-1 ring-[var(--border-default)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Pay manually</h2>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                    {PLANS.find((p) => p.id === manualFor)?.name} plan
                  </p>
                </div>
                <button
                  onClick={closeManual}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--bg-card-hover)] hover:bg-[var(--bg-card)]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {manualPayment ? (
                <div className="mt-4 space-y-3 rounded-xl bg-[var(--bg-elevated)] p-4 ring-1 ring-[var(--border-subtle)]">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-500/15 text-accent-400">
                      <BankIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{manualPayment.account_title}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        {manualPayment.bank_name ? `${manualPayment.bank_name} · ` : ""}
                        <span className="font-mono">{manualPayment.account_number}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(manualPayment.account_number);
                            push("ok", "Copied");
                          }}
                          className="ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-accent-400 hover:bg-accent-500/10"
                          type="button"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      </div>
                    </div>
                  </div>
                  {manualPayment.instructions && (
                    <p className="rounded-lg bg-[var(--bg-card)] p-3 text-xs leading-relaxed text-[var(--text-tertiary)]">
                      {manualPayment.instructions}
                    </p>
                  )}
                  <div className="rounded-lg bg-[var(--bg-card)] p-3">
                    <div className="text-xs text-[var(--text-tertiary)]">Amount to send</div>
                    <div className="mt-0.5 text-lg font-bold">
                      {formatPrice(
                        interval === "yearly"
                          ? PLANS.find((p) => p.id === manualFor)!.yearlyPKR
                          : PLANS.find((p) => p.id === manualFor)!.monthlyPKR,
                        "PKR",
                      )}
                    </div>
                    {manualFor !== "starter" && appliedCoupon[manualFor as "pro" | "business"] && (
                      <div className="mt-1 text-xs text-emerald-400">
                        After coupon: {formatPrice(
                          Math.max(0, (interval === "yearly" ? PLANS.find((p) => p.id === manualFor)!.yearlyPKR : PLANS.find((p) => p.id === manualFor)!.monthlyPKR) - appliedCoupon[manualFor as "pro" | "business"]!.discount),
                          "PKR",
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                  No payment method is configured. Please contact the admin or use card payment instead.
                </div>
              )}

              <div className="mt-4 space-y-3">
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Screenshot of payment
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[var(--border-default)] p-3 hover:border-accent-500/40">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                  />
                  {screenshotPreview ? (
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-[var(--border-default)]"
                    />
                  ) : (
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--bg-card)] text-[var(--text-tertiary)]">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                      {screenshotPreview ? "Replace screenshot" : "Upload screenshot"}
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">PNG, JPG, WebP up to 8MB</div>
                  </div>
                </label>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-[var(--text-tertiary)]">Transaction reference (optional)</div>
                  <input
                    value={manualTxRef}
                    onChange={(e) => setManualTxRef(e.target.value)}
                    placeholder="e.g. Txn ID from JazzCash"
                    className="input w-full"
                  />
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-[var(--text-tertiary)]">Notes (optional)</div>
                  <textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    rows={2}
                    placeholder="Anything we should know"
                    className="input min-h-[60px] w-full"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={closeManual}>
                  Cancel
                </Button>
                <Button
                  onClick={onSubmitManual}
                  disabled={submittingManual || !manualPayment || !screenshotFile}
                  leftIcon={
                    submittingManual ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )
                  }
                >
                  {submittingManual ? "Submitting…" : "Submit payment proof"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
