import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Search,
  CalendarClock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Loader2,
  X,
  Crown,
  Star,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../lib/toast";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { writeAuditLog } from "../../lib/adminAudit";
import clsx from "clsx";

interface Subscription {
  id: string;
  organizer_id: string;
  plan: string;
  status: string;
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  cancelled_at: string | null;
  gateway: string | null;
  gateway_subscription_id: string | null;
  amount: number;
  currency: string;
  interval: string;
  created_at: string;
  updated_at: string;
}

interface Organizer {
  id: string;
  display_name: string;
  slug: string | null;
  logo: string | null;
  plan: string | null;
}

const PLAN_META: Record<string, { name: string; price: number; Icon: any; tone: string }> = {
  starter: { name: "Starter", price: 3000, Icon: Star, tone: "slate" },
  pro: { name: "Pro", price: 5000, Icon: Sparkles, tone: "accent" },
  business: { name: "Business", price: 12000, Icon: Crown, tone: "violet" },
  free: { name: "Free", price: 0, Icon: Star, tone: "slate" },
};

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring soon" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

function fmtPKR(n: number) {
  return `Rs ${Number(n || 0).toLocaleString("en-PK")}`;
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminSubscriptions() {
  const { push } = useToast();
  const [rows, setRows] = useState<Subscription[]>([]);
  const [orgs, setOrgs] = useState<Record<string, Organizer>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<Subscription | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("current_period_end", { ascending: false });
    if (error) {
      push({ tone: "red", title: "Failed to load", message: error.message });
    } else {
      const list = (data ?? []) as Subscription[];
      setRows(list);
      // Load organizers
      const ids = [...new Set(list.map((s) => s.organizer_id).filter(Boolean))] as string[];
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("organizer_profiles")
          .select("id, display_name, slug, logo, plan")
          .in("id", ids);
        const map: Record<string, Organizer> = {};
        for (const o of profs ?? []) {
          map[(o as any).id] = o as Organizer;
        }
        setOrgs(map);
      } else {
        setOrgs({});
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived "expiring" + "overdue" flags
  const annotated = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return rows.map((s) => {
      const end = new Date(s.current_period_end).getTime();
      const ms = end - now;
      let derivedStatus = s.status;
      if (s.status === "active" && ms < 0) derivedStatus = "overdue";
      else if (s.status === "active" && ms >= 0 && ms < sevenDays) derivedStatus = "expiring";
      return { ...s, derivedStatus, daysLeft: Math.ceil(ms / (24 * 60 * 60 * 1000)) };
    });
  }, [rows]);

  const counts = useMemo(() => {
    const c = { all: annotated.length, active: 0, expiring: 0, overdue: 0, cancelled: 0, expired: 0 };
    for (const s of annotated) {
      if (s.derivedStatus === "active") c.active++;
      if (s.derivedStatus === "expiring") c.expiring++;
      if (s.derivedStatus === "overdue") c.overdue++;
      if (s.status === "cancelled") c.cancelled++;
      if (s.status === "expired") c.expired++;
    }
    return c;
  }, [annotated]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return annotated.filter((s) => {
      if (tab === "all") {/* all */}
      else if (tab === "cancelled" || tab === "expired") {
        if (s.status !== tab) return false;
      } else if (s.derivedStatus !== tab) return false;
      if (!ql) return true;
      const o = orgs[s.organizer_id];
      return (
        o?.display_name?.toLowerCase().includes(ql) ||
        o?.slug?.toLowerCase().includes(ql) ||
        s.plan?.toLowerCase().includes(ql) ||
        s.id.toLowerCase().includes(ql)
      );
    });
  }, [annotated, orgs, q, tab]);

  // KPIs
  const kpis = useMemo(() => {
    const mrr = annotated
      .filter((s) => s.status === "active" && s.interval === "monthly")
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const yrr = annotated
      .filter((s) => s.status === "active" && s.interval === "yearly")
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);
    return {
      total: annotated.length,
      active: counts.active,
      expiring: counts.expiring,
      overdue: counts.overdue,
      mrr,
      arr: yrr + mrr * 12,
    };
  }, [annotated, counts]);

  async function extendSubscription(s: Subscription, days: number) {
    setActionBusy(true);
    const newEnd = new Date();
    newEnd.setDate(newEnd.getDate() + days);
    const { error } = await supabase
      .from("subscriptions")
      .update({ current_period_end: newEnd.toISOString(), status: "active" })
      .eq("id", s.id);
    setActionBusy(false);
    if (error) {
      push({ tone: "red", title: "Extend failed", message: error.message });
    } else {
      push({ tone: "green", title: "Subscription extended", message: `New end: ${fmtDate(newEnd.toISOString())}` });
      await writeAuditLog({
        action: "subscription.extended",
        target_type: "subscription",
        target_id: s.id,
        meta: { days, organizer_id: s.organizer_id },
      });
      load();
      setView(null);
    }
  }

  async function cancelSubscription(s: Subscription) {
    if (!confirm("Cancel this subscription? The organizer will lose paid access at period end.")) return;
    setActionBusy(true);
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", s.id);
    setActionBusy(false);
    if (error) {
      push({ tone: "red", title: "Cancel failed", message: error.message });
    } else {
      push({ tone: "amber", title: "Subscription cancelled", message: "Status set to cancelled." });
      await writeAuditLog({
        action: "subscription.cancelled",
        target_type: "subscription",
        target_id: s.id,
        meta: { organizer_id: s.organizer_id, plan: s.plan },
      });
      load();
      setView(null);
    }
  }

  async function markActive(s: Subscription) {
    setActionBusy(true);
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "active" })
      .eq("id", s.id);
    setActionBusy(false);
    if (error) {
      push({ tone: "red", title: "Update failed", message: error.message });
    } else {
      push({ tone: "green", title: "Marked active" });
      await writeAuditLog({
        action: "subscription.reactivated",
        target_type: "subscription",
        target_id: s.id,
        meta: { organizer_id: s.organizer_id },
      });
      load();
      setView(null);
    }
  }

  async function changePlan(s: Subscription, newPlan: string) {
    if (s.plan === newPlan) return;
    setActionBusy(true);
    const meta = PLAN_META[newPlan] || PLAN_META.starter;
    const amount = newPlan === "free" ? 0 : meta.price;
    const { error } = await supabase
      .from("subscriptions")
      .update({ plan: newPlan, amount })
      .eq("id", s.id);
    if (!error) {
      // also update organizer_profiles.plan
      await supabase
        .from("organizer_profiles")
        .update({ plan: newPlan === "free" ? null : newPlan })
        .eq("id", s.organizer_id);
    }
    setActionBusy(false);
    if (error) {
      push({ tone: "red", title: "Plan change failed", message: error.message });
    } else {
      push({ tone: "green", title: `Plan changed to ${newPlan}` });
      await writeAuditLog({
        action: "subscription.plan_changed",
        target_type: "subscription",
        target_id: s.id,
        meta: { from: s.plan, to: newPlan, organizer_id: s.organizer_id },
      });
      load();
      setView((v) => (v ? { ...v, plan: newPlan, amount } : v));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Plans, renewals, expiry, overdue, and plan changes across every organizer.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          leftIcon={<RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />}
        >
          Refresh
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Active subscriptions" value={String(kpis.active)} Icon={CheckCircle2} tone="emerald" />
        <KPI label="Expiring in 7d" value={String(kpis.expiring)} Icon={Clock} tone="amber" />
        <KPI label="Overdue" value={String(kpis.overdue)} Icon={AlertTriangle} tone="red" />
        <KPI label="MRR" value={fmtPKR(kpis.mrr)} Icon={Sparkles} tone="violet" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-[var(--bg-card)] px-4 py-2 ring-1 ring-[var(--border-subtle)] min-w-[200px]">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by organizer, plan, or ID…"
            className="flex-1 bg-transparent text-sm placeholder:text-[var(--text-tertiary)] outline-none"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1 rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)] w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition",
              tab === t.value
                ? "bg-white text-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            {t.label}
            {t.value !== "all" && (
              <span className="ml-1.5 text-[10px] text-[var(--text-tertiary)]">
                {counts[t.value as keyof typeof counts] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-5 py-3 font-medium">Organizer</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Period end</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Gateway</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[var(--text-tertiary)]">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-[var(--text-tertiary)]">
                    No subscriptions match the current filter.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((s, i) => {
                  const o = orgs[s.organizer_id];
                  const meta = PLAN_META[s.plan] || PLAN_META.starter;
                  return (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setView(s)}
                      className="cursor-pointer border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          {o?.logo ? (
                            <img src={o.logo} alt="" className="h-8 w-8 rounded-md object-cover" />
                          ) : (
                            <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-accent-500 to-pink-500 text-xs font-bold text-white">
                              {(o?.display_name || "?").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium text-[var(--text-primary)]">
                              {o?.display_name || s.organizer_id.slice(0, 8)}
                            </div>
                            {o?.slug && (
                              <div className="truncate text-[10px] text-[var(--text-tertiary)]">
                                /{o.slug}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <PlanPill plan={s.plan} meta={meta} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill s={s} />
                      </td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">
                        {fmtDate(s.current_period_end)}
                        {s.derivedStatus === "expiring" && (
                          <span className="ml-2 text-[10px] text-amber-400">
                            {s.daysLeft}d left
                          </span>
                        )}
                        {s.derivedStatus === "overdue" && (
                          <span className="ml-2 text-[10px] text-red-400">
                            {Math.abs(s.daysLeft)}d overdue
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium text-[var(--text-primary)]">
                        {fmtPKR(s.amount)}
                        <span className="ml-1 text-[10px] text-[var(--text-tertiary)]">
                          /{s.interval === "yearly" ? "yr" : "mo"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">
                        {s.gateway ? (
                          <span className="capitalize">{s.gateway}</span>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-[var(--text-tertiary)]" />
                      </td>
                    </motion.tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {view && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !actionBusy && setView(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: 600, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 600, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-hidden border-l border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">Subscription</div>
                  <h2 className="text-lg font-semibold">
                    {orgs[view.organizer_id]?.display_name || view.organizer_id.slice(0, 8)}
                  </h2>
                </div>
                <button
                  onClick={() => !actionBusy && setView(null)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Plan
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <PlanPill plan={view.plan} meta={PLAN_META[view.plan] || PLAN_META.starter} />
                        <span className="text-sm text-[var(--text-secondary)]">
                          {fmtPKR(view.amount)} / {view.interval}
                        </span>
                      </div>
                    </div>
                    <StatusPill s={view} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <Field label="Started">{fmtDate(view.started_at)}</Field>
                    <Field label="Period end">{fmtDate(view.current_period_end)}</Field>
                    <Field label="Gateway">{view.gateway || "—"}</Field>
                    <Field label="Subscription ID">
                      <span className="font-mono text-[10px]">{view.id.slice(0, 12)}…</span>
                    </Field>
                    {view.cancelled_at && (
                      <Field label="Cancelled at">{fmtDate(view.cancelled_at)}</Field>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Change plan
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {["starter", "pro", "business", "free"].map((p) => {
                      const meta = PLAN_META[p];
                      const active = view.plan === p;
                      return (
                        <button
                          key={p}
                          onClick={() => changePlan(view, p)}
                          disabled={actionBusy || active}
                          className={clsx(
                            "rounded-lg p-3 text-left transition ring-1",
                            active
                              ? "bg-accent-500/10 ring-accent-500/40"
                              : "bg-[var(--bg-elevated)] ring-[var(--border-subtle)] hover:ring-accent-500/30",
                          )}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <meta.Icon className="h-3.5 w-3.5" />
                            {meta.name}
                          </div>
                          <div className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                            {p === "free" ? "No plan" : `${fmtPKR(meta.price)}/mo`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Renewal actions
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => extendSubscription(view, 30)} disabled={actionBusy}>
                      <CalendarClock className="h-3.5 w-3.5" /> Extend 30d
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => extendSubscription(view, 7)} disabled={actionBusy}>
                      +7d
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => extendSubscription(view, 365)} disabled={actionBusy}>
                      +1y
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Status actions
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {view.status !== "active" && (
                      <Button size="sm" onClick={() => markActive(view)} disabled={actionBusy}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark active
                      </Button>
                    )}
                    {view.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelSubscription(view)}
                        disabled={actionBusy}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    )}
                    {orgs[view.organizer_id]?.slug && (
                      <Link
                        to={`/admin/organizer-billing/${view.organizer_id}`}
                        className="ml-auto inline-flex items-center gap-1 text-xs text-accent-400 hover:underline"
                      >
                        Full billing page <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function KPI({ label, value, Icon, tone }: { label: string; value: string; Icon: any; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "from-emerald-500/20 to-cyan-500/10 ring-emerald-500/30 text-emerald-400",
    amber: "from-amber-500/20 to-pink-500/10 ring-amber-500/30 text-amber-400",
    red: "from-red-500/20 to-pink-500/10 ring-red-500/30 text-red-400",
    violet: "from-violet-500/20 to-fuchsia-500/10 ring-violet-500/30 text-violet-400",
  };
  return (
    <div className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
      <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ring-1 ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{value}</div>
      <div className="mt-0.5 text-xs text-[var(--text-tertiary)]">{label}</div>
    </div>
  );
}

function PlanPill({ plan, meta }: { plan: string; meta: { name: string; Icon: any; tone: string } }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs font-medium capitalize">
      <meta.Icon className="h-3 w-3" /> {meta.name}
    </span>
  );
}

function StatusPill({ s }: { s: Subscription & { derivedStatus?: string } }) {
  const status = s.derivedStatus || s.status;
  if (status === "active") {
    return (
      <Badge tone="emerald">
        <CheckCircle2 className="h-3 w-3" /> Active
      </Badge>
    );
  }
  if (status === "expiring") {
    return (
      <Badge tone="amber">
        <Clock className="h-3 w-3" /> Expiring
      </Badge>
    );
  }
  if (status === "overdue") {
    return (
      <Badge tone="red">
        <AlertTriangle className="h-3 w-3" /> Overdue
      </Badge>
    );
  }
  if (status === "cancelled") {
    return (
      <Badge tone="slate">
        <XCircle className="h-3 w-3" /> Cancelled
      </Badge>
    );
  }
  if (status === "expired") {
    return (
      <Badge tone="slate">
        <Clock className="h-3 w-3" /> Expired
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge tone="amber">
        <Clock className="h-3 w-3" /> Pending
      </Badge>
    );
  }
  return <Badge>{s.status}</Badge>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{label}</div>
      <div className="mt-0.5 text-[var(--text-primary)]">{children}</div>
    </div>
  );
}
