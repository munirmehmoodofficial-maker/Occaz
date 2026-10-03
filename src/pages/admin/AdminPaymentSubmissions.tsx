import { useEffect, useMemo, useState } from "react";
import {
  Search,
  X,
  Check,
  ImageIcon,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../lib/toast";

interface Submission {
  id: string;
  user_id: string | null;
  event_id: string | null;
  opportunity_id: string | null;
  registration_id: string | null;
  amount: number | null;
  currency: string | null;
  screenshot_url: string | null;
  transaction_ref: string | null;
  status: string;
  notes: string | null;
  created_at: string | null;
  reviewed_at: string | null;
}

interface Joined {
  user_email?: string;
  user_name?: string;
  user_phone?: string;
  event_title?: string;
  opp_title?: string;
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function AdminPaymentSubmissions() {
  const { push } = useToast();
  const [rows, setRows] = useState<Submission[]>([]);
  const [joined, setJoined] = useState<Record<string, Joined>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [view, setView] = useState<Submission | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      push("err", `Failed to load: ${error.message}`);
    } else {
      const list = (data ?? []) as Submission[];
      setRows(list);

      // Pull user emails + titles for joined display
      const userIds = [...new Set(list.map((r) => r.user_id).filter(Boolean))] as string[];
      const evIds = [...new Set(list.map((r) => r.event_id).filter(Boolean))] as string[];
      const opIds = [...new Set(list.map((r) => r.opportunity_id).filter(Boolean))] as string[];

      const j: Record<string, Joined> = {};
      // profiles
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, email, full_name, phone")
          .in("id", userIds);
        for (const p of profs ?? []) {
          // Also associate with the first submission that uses this user_id
          for (const r of list) {
            if (r.user_id === p.id) {
              j[r.id] = {
                ...(j[r.id] || {}),
                user_email: (p as any).email,
                user_name: (p as any).full_name,
                user_phone: (p as any).phone,
              };
            }
          }
        }
      }
      if (evIds.length > 0) {
        const { data: evs } = await supabase
          .from("events")
          .select("id, title")
          .in("id", evIds);
        for (const e of evs ?? []) {
          for (const r of list) {
            if (r.event_id === e.id) {
              j[r.id] = { ...(j[r.id] || {}), event_title: (e as any).title };
            }
          }
        }
      }
      if (opIds.length > 0) {
        const { data: ops } = await supabase
          .from("opportunities")
          .select("id, title")
          .in("id", opIds);
        for (const o of ops ?? []) {
          for (const r of list) {
            if (r.opportunity_id === o.id) {
              j[r.id] = { ...(j[r.id] || {}), opp_title: (o as any).title };
            }
          }
        }
      }
      setJoined(j);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => (tab === "all" ? true : r.status === tab))
      .filter((r) => {
        const t = q.trim().toLowerCase();
        if (!t) return true;
        const j = joined[r.id] || {};
        return (
          r.transaction_ref?.toLowerCase().includes(t) ||
          j.user_email?.toLowerCase().includes(t) ||
          j.event_title?.toLowerCase().includes(t) ||
          j.opp_title?.toLowerCase().includes(t)
        );
      });
  }, [rows, tab, q, joined]);

  async function review(s: Submission, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("payment_submissions")
      .update({
        status,
        notes: reviewNotes.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", s.id);
    if (error) {
      push("err", `Update failed: ${error.message}`);
      return;
    }
    // If approved and linked to a registration, also mark registration confirmed
    if (status === "approved" && s.registration_id) {
      await supabase
        .from("registrations")
        .update({ status: "confirmed" })
        .eq("id", s.registration_id);
    }
    push("ok", status === "approved" ? "Approved" : "Rejected");
    setView(null);
    setReviewNotes("");
    load();
  }

  function fmt(n: number | null, c: string | null) {
    if (n == null) return "—";
    return `Rs ${n.toLocaleString()}${c && c !== "PKR" ? ` ${c}` : ""}`;
  }

  function timeAgo(iso: string | null) {
    if (!iso) return "—";
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function statusBadge(s: string) {
    if (s === "approved")
      return (
        <Badge tone="emerald">
          <CheckCircle2 className="mr-1 inline h-3 w-3" /> Approved
        </Badge>
      );
    if (s === "rejected")
      return (
        <Badge tone="rose">
          <XCircle className="mr-1 inline h-3 w-3" /> Rejected
        </Badge>
      );
    return (
      <Badge tone="amber">
        <Clock className="mr-1 inline h-3 w-3" /> Pending
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment Submissions</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Review manual payment proofs and approve or reject them
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              tab === t.value
                ? "bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30"
                : "text-[var(--text-tertiary)] hover:bg-[var(--bg-card)]"
            }`}
          >
            {t.label}
            <span className="ml-2 text-xs opacity-70">
              {t.value === "all" ? rows.length : rows.filter((r) => r.status === t.value).length}
            </span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)] min-w-0 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search user, event, ref..."
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
            <ImageIcon className="h-8 w-8 opacity-30" />
            {rows.length === 0
              ? "No payment submissions yet."
              : "No submissions match your filter."}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((s) => {
              const j = joined[s.id] || {};
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-4 p-4 transition hover:bg-[var(--bg-card-hover)] cursor-pointer"
                  onClick={() => {
                    setView(s);
                    setReviewNotes(s.notes ?? "");
                  }}
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-elevated)] ring-1 ring-[var(--border-subtle)]">
                    {s.screenshot_url ? (
                      <img
                        src={s.screenshot_url}
                        alt="Screenshot"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[var(--text-tertiary)]">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold">
                        {j.event_title || j.opp_title || "(unknown)"}
                      </div>
                      {statusBadge(s.status)}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
                      {fmt(s.amount, s.currency)}
                      {s.transaction_ref ? ` · Ref: ${s.transaction_ref}` : ""}
                      {j.user_email ? ` · ${j.user_email}` : ""}
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {timeAgo(s.created_at)}
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
                  <h2 className="text-lg font-semibold">Payment submission</h2>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {joined[view.id]?.event_title ||
                      joined[view.id]?.opp_title ||
                      "(unknown)"}{" "}
                    · {fmt(view.amount, view.currency)} · {timeAgo(view.created_at)}
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
                      Screenshot
                    </div>
                    {view.screenshot_url ? (
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
                    ) : (
                      <div className="mt-2 grid h-48 place-items-center rounded-xl bg-[var(--bg-card)] text-sm text-[var(--text-tertiary)]">
                        No screenshot uploaded
                      </div>
                    )}
                  </div>
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
                      User
                    </div>
                    <div className="mt-1 text-sm">
                      {joined[view.id]?.user_email || view.user_id || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      Status
                    </div>
                    <div className="mt-1">{statusBadge(view.status)}</div>
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
                        placeholder="Add notes (visible to user)..."
                        className="input mt-1 min-h-[80px]"
                      />
                    </div>
                  )}
                  {view.screenshot_url && (
                    <a
                      href={view.screenshot_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent-400 hover:underline"
                    >
                      Open screenshot in new tab <ExternalLink className="h-3 w-3" />
                    </a>
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
                    Approve
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
