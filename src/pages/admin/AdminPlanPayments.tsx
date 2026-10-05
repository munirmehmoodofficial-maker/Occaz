import { useEffect, useMemo, useState } from "react";
import {
  Search,
  X,
  Check,
  Image as ImageIcon,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  CreditCard,
  Banknote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../lib/toast.tsx";
import { approvePlanPayment, rejectPlanPayment } from "../../lib/billing";
import { PLANS } from "../../lib/plans";
import clsx from "clsx";

interface PlanPayment {
  id: string;
  user_id: string | null;
  plan: string;
  interval: string;
  amount: number;
  currency: string;
  gateway: string | null;
  method: string | null;
  screenshot_url: string | null;
  transaction_ref: string | null;
  notes: string | null;
  status: string;
  reviewed_at: string | null;
  created_at: string | null;
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "succeeded", label: "Card" },
  { value: "rejected", label: "Rejected" },
];

export function AdminPlanPayments() {
  const { push } = useToast();
  const [rows, setRows] = useState<PlanPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<PlanPayment | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [users, setUsers] = useState<Record<string, { email: string; name: string }>>({});

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("organizer_plan_payments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      push("err", `Failed to load: ${error.message}`);
    } else {
      const list = (data ?? []) as PlanPayment[];
      setRows(list);

      // Load user profiles
      const userIds = [...new Set(list.map((p) => p.user_id).filter(Boolean))] as string[];
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds);
        const map: Record<string, { email: string; name: string }> = {};
        for (const p of profs ?? []) {
          map[(p as any).id] = {
            email: (p as any).email || "",
            name: (p as any).full_name || "",
          };
        }
        setUsers(map);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    return {
      all: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      approved: rows.filter((r) => r.status === "approved").length,
      succeeded: rows.filter((r) => r.status === "succeeded").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => {
        if (tab === "all") return true;
        if (tab === "card") return r.status === "succeeded";
        return r.status === tab;
      })
      .filter((r) => {
        const t = q.trim().toLowerCase();
        if (!t) return true;
        const u = r.user_id ? users[r.user_id] : null;
        return (
          r.transaction_ref?.toLowerCase().includes(t) ||
          r.plan?.toLowerCase().includes(t) ||
          u?.email?.toLowerCase().includes(t) ||
          u?.name?.toLowerCase().includes(t)
        );
      });
  }, [rows, tab, q, users]);

  async function review(p: PlanPayment, status: "approved" | "rejected") {
    let res;
    if (status === "approved") {
      res = await approvePlanPayment(p.id);
    } else {
      res = await rejectPlanPayment(p.id, reviewNotes.trim() || undefined);
    }
    if (res.error) {
      push("err", `Update failed: ${res.error}`);
      return;
    }
    push("ok", status === "approved" ? "Plan activated" : "Plan payment rejected");
    setView(null);
    setReviewNotes("");
    load();
  }

  function statusBadge(s: string, method: string | null) {
    if (s === "approved" || (s === "succeeded" && method === "card")) {
      return (
        <Badge tone="emerald">
          <CheckCircle2 className="mr-1 inline h-3 w-3" />{" "}
          {method === "card" ? "Card paid" : "Approved"}
        </Badge>
      );
    }
    if (s === "rejected")
      return (
        <Badge tone="rose">
          <XCircle className="mr-1 inline h-3 w-3" /> Rejected
        </Badge>
      );
    if (s === "pending")
      return (
        <Badge tone="amber">
          <Clock className="mr-1 inline h-3 w-3" /> Pending
        </Badge>
      );
    return <Badge tone="zinc">{s}</Badge>;
  }

  function fmtDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
  }

  function fmtAmount(amount: number | null, currency: string | null) {
    if (amount == null) return "—";
    return `Rs ${amount.toLocaleString()}${currency && currency !== "PKR" ? ` ${currency}` : ""}`;
  }

  function planName(id: string) {
    return PLANS.find((p) => p.id === id)?.name ?? id;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plan Payments</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Review manual plan payments and approve organizer subscriptions
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={clsx(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              tab === t.value
                ? "bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30"
                : "text-[var(--text-tertiary)] hover:bg-[var(--bg-card)]",
            )}
          >
            {t.label}
            <span className="ml-2 text-xs opacity-70">
              {t.value === "all" ? counts.all : counts[t.value as keyof typeof counts]}
            </span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)] min-w-0 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search user, plan, ref..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-[var(--text-tertiary)]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-sm text-[var(--text-tertiary)]">
            <CreditCard className="h-8 w-8 opacity-30" />
            {rows.length === 0
              ? "No plan payments yet."
              : "No payments match this filter."}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((p) => {
              const u = p.user_id ? users[p.user_id] : null;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 transition hover:bg-[var(--bg-card-hover)] cursor-pointer"
                  onClick={() => {
                    setView(p);
                    setReviewNotes(p.notes ?? "");
                  }}
                >
                  <div
                    className={clsx(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                      p.method === "card"
                        ? "bg-accent-500/15 text-accent-400"
                        : "bg-pink-500/15 text-pink-400",
                    )}
                  >
                    {p.method === "card" ? (
                      <CreditCard className="h-4 w-4" />
                    ) : (
                      <Banknote className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold">
                        {planName(p.plan)} — {p.interval}
                      </div>
                      {statusBadge(p.status, p.method)}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
                      {fmtAmount(p.amount, p.currency)}
                      {p.transaction_ref ? ` · Ref: ${p.transaction_ref}` : ""}
                      {u?.email ? ` · ${u.email}` : ""}
                      {" · "}
                      {fmtDate(p.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {view && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
            onClick={() => setView(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[var(--bg-elevated)] ring-1 ring-[var(--border-default)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-4">
                <div>
                  <h2 className="text-lg font-semibold">Plan payment</h2>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {planName(view.plan)} · {view.interval} · {fmtAmount(view.amount, view.currency)} · {fmtDate(view.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setView(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--bg-card-hover)]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      Payment method
                    </div>
                    <div className="mt-1 text-sm capitalize">
                      {view.method === "card" ? "💳 Card (instant)" : "🏦 Manual transfer"}
                    </div>
                  </div>
                  {view.screenshot_url ? (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                        Screenshot
                      </div>
                      <a
                        href={view.screenshot_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block overflow-hidden rounded-xl ring-1 ring-[var(--border-default)]"
                      >
                        <img
                          src={view.screenshot_url}
                          alt="Payment screenshot"
                          className="w-full"
                        />
                      </a>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                        Screenshot
                      </div>
                      <div className="mt-1 text-sm text-[var(--text-tertiary)]">No screenshot</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      Reference
                    </div>
                    <div className="mt-1 text-sm">{view.transaction_ref || "—"}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      Organizer
                    </div>
                    <div className="mt-1 text-sm">
                      {view.user_id && users[view.user_id]
                        ? `${users[view.user_id].name || "(no name)"} · ${users[view.user_id].email}`
                        : view.user_id || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      Status
                    </div>
                    <div className="mt-1">{statusBadge(view.status, view.method)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      Submitted notes
                    </div>
                    <div className="mt-1 text-sm">
                      {view.notes || <span className="text-[var(--text-tertiary)]">—</span>}
                    </div>
                  </div>
                  {view.status === "pending" && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                        Review notes
                      </div>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                        placeholder="Add notes (visible to organizer)..."
                        className="input mt-1 min-h-[80px]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {view.status === "pending" && (
                <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] p-4">
                  <Button
                    variant="outline"
                    onClick={() => review(view, "rejected")}
                    leftIcon={<X className="h-4 w-4" />}
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => review(view, "approved")}
                    leftIcon={<Check className="h-4 w-4" />}
                  >
                    Approve & activate plan
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
