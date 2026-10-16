import { CreditCard, Check, X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../lib/toast";

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
 * Upgrade / switch plan flow wired to a payment modal.
 */
export function Section9Subscription() {
  const { user, profile } = useAuth();
  const { push } = useToast();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [planRequest, setPlanRequest] = useState<{ planId: string; interval: "monthly" | "yearly" } | null>(null);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  async function refresh() {
    if (!user) return;
    const { data } = await supabase
      .from("organizer_plan_payments")
      .select("id, plan, interval, amount, status, created_at, reviewed_at, method")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPayments(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [user]);

  async function switchToNone() {
    if (!confirm("Cancel your paid plan? You'll revert to the free tier.")) return;
    setBusyPlanId("none");
    const { error } = await supabase
      .from("profiles")
      .update({ plan: null })
      .eq("id", user!.id);
    setBusyPlanId(null);
    if (error) {
      push({ tone: "red", title: "Failed", message: error.message });
      return;
    }
    push({ tone: "green", title: "Plan removed", message: "You're back on free." });
    window.location.reload();
  }

  const currentPlan = profile?.plan ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Subscription & plan</h2>
        <p className="text-xs text-zinc-500">
          Current plan:{" "}
          <span className="font-semibold text-white">
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
                  <li key={f} className="flex items-start gap-1.5 text-xs text-zinc-300">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setPlanRequest({ planId: p.id, interval })}
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

      {currentPlan && (
        <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
          <h3 className="text-sm font-bold text-white">Manage current plan</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Cancel and revert to free tier
          </p>
          <button
            onClick={switchToNone}
            disabled={busyPlanId === "none"}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            {busyPlanId === "none" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Cancel current plan
          </button>
        </div>
      )}

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
                    {PLANS.find((x) => x.id === p.plan)?.name ?? p.plan} · {p.interval}
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

      {planRequest && (
        <PlanSwitchModal
          planId={planRequest.planId}
          interval={planRequest.interval}
          onClose={() => setPlanRequest(null)}
          onSubmitted={() => {
            setPlanRequest(null);
            refresh();
            push({ tone: "green", title: "Plan switch submitted", message: "We'll process it within 24h." });
          }}
        />
      )}
    </div>
  );
}

function PlanSwitchModal({
  planId,
  interval,
  onClose,
  onSubmitted,
}: {
  planId: string;
  interval: "monthly" | "yearly";
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { user } = useAuth();
  const { push } = useToast();
  const plan = PLANS.find((p) => p.id === planId);
  const amount = plan ? (interval === "monthly" ? plan.monthly : plan.yearly) : 0;
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!user || !plan) return;
    setBusy(true);
    const id = `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("organizer_plan_payments").insert({
      id,
      user_id: user.id,
      plan: planId,
      interval,
      amount,
      currency: "PKR",
      gateway: "manual",
      method: "manual",
      transaction_ref: transactionRef.trim() || null,
      notes: notes.trim() || null,
      status: "pending",
    });
    setBusy(false);
    if (error) {
      push({ tone: "red", title: "Failed", message: error.message });
      return;
    }
    onSubmitted();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl border border-white/5 bg-[#0b0b14] p-5 text-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-base font-bold">Switch to {plan?.name}</h3>
            <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg bg-white/5 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                You'll be charged
              </div>
              <div className="mt-1 text-2xl font-bold text-white">
                ₨ {amount.toLocaleString()}
                <span className="ml-1 text-xs font-normal text-zinc-500">
                  /{interval === "monthly" ? "mo" : "yr"}
                </span>
              </div>
            </div>
            <div className="rounded-lg border border-pink-500/20 bg-pink-500/5 p-3 text-xs text-pink-100">
              <div className="font-semibold text-pink-200">Manual payment</div>
              <p className="mt-1 text-pink-100/80">
                Send the amount to our bank / JazzCash / Easypaisa, then submit your
                transaction reference below. Our team will activate your plan within 24h.
              </p>
              <ul className="mt-2 space-y-0.5 text-pink-100/70">
                <li>· Bank: Meezan Bank</li>
                <li>· Account: Occaz Events (Pvt) Ltd</li>
                <li>· IBAN: PK00MEZN0000000000000000</li>
                <li>· JazzCash / Easypaisa: 0300-1234567</li>
              </ul>
            </div>
            <Field label="Transaction reference">
              <input
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="input"
                placeholder="e.g. JC123456 or bank transfer ref"
              />
            </Field>
            <Field label="Notes (optional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="input"
                placeholder="Anything we should know…"
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      {children}
    </label>
  );
}
