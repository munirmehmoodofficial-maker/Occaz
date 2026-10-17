import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  CreditCard,
  Bell,
  Globe,
  Wrench,
  Loader2,
  ChevronRight,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../lib/toast";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { writeAuditLog } from "../../lib/adminAudit";
import clsx from "clsx";

interface SystemEvent {
  id: string;
  kind: string;
  severity: string;
  source: string | null;
  message: string;
  details: Record<string, any>;
  user_id: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

const KIND_META: Record<string, { label: string; Icon: any; tone: string }> = {
  upload_failed: { label: "Image upload", Icon: ImageIcon, tone: "amber" },
  payment_failed: { label: "Payment", Icon: CreditCard, tone: "red" },
  notification_failed: { label: "Notification", Icon: Bell, tone: "amber" },
  rls_denial: { label: "Access denied", Icon: AlertTriangle, tone: "red" },
  webhook_failed: { label: "Webhook", Icon: Globe, tone: "red" },
  job_failed: { label: "Background job", Icon: Wrench, tone: "red" },
  other: { label: "Other", Icon: AlertTriangle, tone: "slate" },
};

const SEVERITY_TONES: Record<string, "emerald" | "amber" | "red" | "violet" | "slate"> = {
  info: "emerald",
  warning: "amber",
  error: "red",
  critical: "violet",
};

const TABS = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
];

const SEVERITY_TABS = [
  { value: "all", label: "All severity" },
  { value: "critical", label: "Critical" },
  { value: "error", label: "Error" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

export function AdminSystemMonitor() {
  const { push } = useToast();
  const [rows, setRows] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("open");
  const [sev, setSev] = useState("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<SystemEvent | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("system_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      push({ tone: "red", title: "Failed to load", message: error.message });
    } else {
      setRows((data ?? []) as SystemEvent[]);
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
      open: rows.filter((r) => !r.resolved).length,
      resolved: rows.filter((r) => r.resolved).length,
      critical: rows.filter((r) => r.severity === "critical" && !r.resolved).length,
      error: rows.filter((r) => r.severity === "error" && !r.resolved).length,
      warning: rows.filter((r) => r.severity === "warning" && !r.resolved).length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return rows.filter((r) => {
      if (tab === "open" && r.resolved) return false;
      if (tab === "resolved" && !r.resolved) return false;
      if (sev !== "all" && r.severity !== sev) return false;
      if (!ql) return true;
      return (
        r.message?.toLowerCase().includes(ql) ||
        r.kind?.toLowerCase().includes(ql) ||
        r.source?.toLowerCase().includes(ql)
      );
    });
  }, [rows, tab, sev, q]);

  async function setResolved(r: SystemEvent, resolved: boolean) {
    setBusy(true);
    const { error } = await supabase.rpc("resolve_system_event", {
      p_id: r.id,
      p_resolved: resolved,
    });
    setBusy(false);
    if (error) {
      push({ tone: "red", title: "Update failed", message: error.message });
    } else {
      push({
        tone: resolved ? "green" : "amber",
        title: resolved ? "Marked resolved" : "Re-opened",
        message: r.kind,
      });
      await writeAuditLog({
        action: resolved ? "system_event.resolved" : "system_event.reopened",
        target_type: "system_event",
        target_id: r.id,
        meta: { kind: r.kind, severity: r.severity },
      });
      load();
      setView(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            System monitor
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Failed uploads, payment errors, notification failures, and other critical issues.
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
        <KPI label="Open issues" value={String(counts.open)} Icon={AlertTriangle} tone="amber" />
        <KPI label="Critical" value={String(counts.critical)} Icon={AlertTriangle} tone="red" />
        <KPI label="Errors" value={String(counts.error)} Icon={AlertTriangle} tone="red" />
        <KPI label="Resolved (total)" value={String(counts.resolved)} Icon={CheckCircle2} tone="emerald" />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-[var(--bg-card)] px-4 py-2 ring-1 ring-[var(--border-subtle)] min-w-[200px]">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events…"
            className="flex-1 bg-transparent text-sm placeholder:text-[var(--text-tertiary)] outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)]">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-medium transition",
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
        <div className="flex items-center gap-1 rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)]">
          <Filter className="ml-2 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          {SEVERITY_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setSev(t.value)}
              className={clsx(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                sev === t.value
                  ? "bg-white text-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-5 py-3 font-medium">Kind</th>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Message</th>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[var(--text-tertiary)]">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[var(--text-tertiary)]">
                    No system events match the current filter.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((r, i) => {
                  const meta = KIND_META[r.kind] || KIND_META.other;
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setView(r)}
                      className="cursor-pointer border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--bg-elevated)]">
                            <meta.Icon className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                          </div>
                          <span className="text-xs">{meta.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={SEVERITY_TONES[r.severity] ?? "slate"}>
                          {r.severity}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-[var(--text-secondary)]">
                        {r.source || "—"}
                      </td>
                      <td className="max-w-md truncate px-5 py-3 text-[var(--text-secondary)]">
                        {r.message}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-[var(--text-tertiary)]">
                        {new Date(r.created_at).toLocaleString("en-PK", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
              onClick={() => !busy && setView(null)}
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
                  <div className="text-xs text-[var(--text-tertiary)]">System event</div>
                  <h2 className="text-lg font-semibold">
                    {KIND_META[view.kind]?.label || view.kind}
                  </h2>
                </div>
                <button
                  onClick={() => !busy && setView(null)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-center gap-2">
                    <Badge tone={SEVERITY_TONES[view.severity] ?? "slate"}>
                      {view.severity}
                    </Badge>
                    {view.resolved && (
                      <Badge tone="emerald">
                        <CheckCircle2 className="h-3 w-3" /> Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-primary)]">{view.message}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <Field label="Source">{view.source || "—"}</Field>
                    <Field label="Kind">{view.kind}</Field>
                    <Field label="Created">
                      {new Date(view.created_at).toLocaleString("en-PK")}
                    </Field>
                    {view.resolved_at && (
                      <Field label="Resolved at">
                        {new Date(view.resolved_at).toLocaleString("en-PK")}
                      </Field>
                    )}
                  </div>
                </div>

                {Object.keys(view.details || {}).length > 0 && (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Details
                    </div>
                    <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-[var(--bg-elevated)] p-3 text-[10px] text-[var(--text-secondary)]">
                      {JSON.stringify(view.details, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2">
                  {!view.resolved ? (
                    <Button
                      onClick={() => setResolved(view, true)}
                      disabled={busy}
                      leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    >
                      Mark resolved
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setResolved(view, false)}
                      disabled={busy}
                    >
                      Re-open
                    </Button>
                  )}
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
    amber: "from-amber-500/20 to-pink-500/10 ring-amber-500/30 text-amber-400",
    red: "from-red-500/20 to-pink-500/10 ring-red-500/30 text-red-400",
    emerald: "from-emerald-500/20 to-cyan-500/10 ring-emerald-500/30 text-emerald-400",
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{label}</div>
      <div className="mt-0.5 text-[var(--text-primary)] break-words">{children}</div>
    </div>
  );
}
