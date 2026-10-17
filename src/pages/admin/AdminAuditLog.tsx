import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Loader2,
  User as UserIcon,
  Calendar,
  CreditCard,
  Building2,
  Ticket,
  Receipt,
  FileText,
  Globe,
  Wrench,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../lib/toast";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import clsx from "clsx";

interface AuditEntry {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, any>;
  ip: string | null;
  created_at: string;
}

const ACTION_META: Record<string, { Icon: any; tone: "emerald" | "amber" | "red" | "violet" | "slate" | "cyan" | "accent" }> = {
  // Organizer
  "organizer.approved": { Icon: Building2, tone: "emerald" },
  "organizer.rejected": { Icon: Building2, tone: "red" },
  "organizer.verified": { Icon: Building2, tone: "emerald" },
  "organizer.unverified": { Icon: Building2, tone: "amber" },
  "organizer.published": { Icon: Building2, tone: "emerald" },
  "organizer.unpublished": { Icon: Building2, tone: "amber" },
  "organizer.deleted": { Icon: Building2, tone: "red" },
  "organizer.updated": { Icon: Building2, tone: "cyan" },
  "organizer.created": { Icon: Building2, tone: "emerald" },
  "organizer.plan_changed": { Icon: Building2, tone: "violet" },
  // Event
  "event.published": { Icon: Calendar, tone: "emerald" },
  "event.unpublished": { Icon: Calendar, tone: "amber" },
  "event.deleted": { Icon: Calendar, tone: "red" },
  "event.updated": { Icon: Calendar, tone: "cyan" },
  "event.featured": { Icon: Calendar, tone: "violet" },
  "event.unfeatured": { Icon: Calendar, tone: "slate" },
  "event.rejected": { Icon: Calendar, tone: "red" },
  "event.cancelled": { Icon: Calendar, tone: "red" },
  // Subscription
  "subscription.extended": { Icon: CreditCard, tone: "emerald" },
  "subscription.cancelled": { Icon: CreditCard, tone: "red" },
  "subscription.reactivated": { Icon: CreditCard, tone: "emerald" },
  "subscription.plan_changed": { Icon: CreditCard, tone: "violet" },
  // Refund / payment
  "refund.issued": { Icon: Receipt, tone: "amber" },
  "payment.approved": { Icon: Receipt, tone: "emerald" },
  "payment.rejected": { Icon: Receipt, tone: "red" },
  // System
  "system_event.resolved": { Icon: Wrench, tone: "emerald" },
  "system_event.reopened": { Icon: Wrench, tone: "amber" },
  // User
  "user.suspended": { Icon: UserIcon, tone: "red" },
  "user.reinstated": { Icon: UserIcon, tone: "emerald" },
  "user.role_changed": { Icon: UserIcon, tone: "violet" },
};

const TABS = [
  { value: "all", label: "All" },
  { value: "organizer", label: "Organizers" },
  { value: "event", label: "Events" },
  { value: "subscription", label: "Subscriptions" },
  { value: "payment", label: "Payments" },
  { value: "user", label: "Users" },
  { value: "system_event", label: "System" },
];

export function AdminAuditLog() {
  const { push } = useToast();
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      push({ tone: "red", title: "Failed to load", message: error.message });
      setRows([]);
    } else {
      setRows((data ?? []) as AuditEntry[]);
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
      organizer: rows.filter((r) => r.action.startsWith("organizer.")).length,
      event: rows.filter((r) => r.action.startsWith("event.")).length,
      subscription: rows.filter((r) => r.action.startsWith("subscription.")).length,
      payment: rows.filter((r) => r.action.startsWith("payment.") || r.action.startsWith("refund.")).length,
      user: rows.filter((r) => r.action.startsWith("user.")).length,
      system_event: rows.filter((r) => r.action.startsWith("system_event.")).length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return rows.filter((r) => {
      if (tab !== "all") {
        const prefix = tab === "payment" ? "" : tab + ".";
        if (tab === "payment") {
          if (!r.action.startsWith("payment.") && !r.action.startsWith("refund.")) return false;
        } else if (!r.action.startsWith(prefix)) return false;
      }
      if (!ql) return true;
      return (
        r.action.toLowerCase().includes(ql) ||
        r.actor_email?.toLowerCase().includes(ql) ||
        r.target_type?.toLowerCase().includes(ql) ||
        r.target_id?.toLowerCase().includes(ql)
      );
    });
  }, [rows, tab, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Audit log
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Every admin action — organizers, events, payments, subscriptions, users, system — fully traceable.
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

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-[var(--bg-card)] px-4 py-2 ring-1 ring-[var(--border-subtle)] min-w-[200px]">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by action, actor email, target ID…"
            className="flex-1 bg-transparent text-sm placeholder:text-[var(--text-tertiary)] outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)] w-fit">
        {TABS.map((t) => (
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
            <span className="ml-1.5 text-[10px] text-[var(--text-tertiary)]">
              {counts[t.value as keyof typeof counts] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-[var(--text-tertiary)]">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-[var(--text-tertiary)]">
                    <div className="space-y-2">
                      <FileText className="mx-auto h-6 w-6 text-[var(--text-tertiary)]" />
                      <div>No audit entries yet.</div>
                      <div className="text-[10px]">
                        Entries are recorded automatically as you (and other admins) take actions across the panel.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((a, i) => {
                  const meta = ACTION_META[a.action] ?? { Icon: FileText, tone: "slate" as const };
                  return (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-semibold text-white">
                            {(a.actor_email || "?").slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-xs font-medium text-[var(--text-primary)]">
                              {a.actor_email || "System"}
                            </div>
                            {a.actor_id && (
                              <div className="truncate font-mono text-[10px] text-[var(--text-tertiary)]">
                                {a.actor_id.slice(0, 8)}…
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge tone={meta.tone}>
                            <meta.Icon className="h-3 w-3" />
                            <span className="font-mono text-[10px]">{a.action}</span>
                          </Badge>
                        </div>
                        {Object.keys(a.meta || {}).length > 0 && (
                          <div className="mt-1 truncate text-[10px] text-[var(--text-tertiary)]">
                            {Object.entries(a.meta)
                              .slice(0, 3)
                              .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                              .join(" · ")}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {a.target_type ? (
                          <div>
                            <div className="font-medium text-[var(--text-primary)]">
                              {a.target_type}
                            </div>
                            {a.target_id && (
                              <div className="font-mono text-[10px] text-[var(--text-tertiary)]">
                                {a.target_id.slice(0, 16)}
                                {a.target_id.length > 16 ? "…" : ""}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-[var(--text-tertiary)]">
                        {new Date(a.created_at).toLocaleString("en-PK", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </motion.tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
