import { useEffect, useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Eye,
  Trash2,
  Check,
  X,
  Send,
  Mail,
  TicketPercent,
  Plus,
  CreditCard,
  Download,
  Globe,
  Database,
  LifeBuoy,
  Inbox,
  Star,
  Copy,
  Edit3,
  Sparkles,
  FileText,
  Bell,
  GripVertical,
  Image as ImageIcon,
  ExternalLink,
  Banknote,
  Building2,
  Hash,
} from "lucide-react";
import clsx from "clsx";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ImageUploader, type ImageItem } from "../../components/admin/ImageUploader";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../lib/toast.tsx";

// =====================================================
// ANALYTICS
// =====================================================
export function AdminAnalytics() {
  const series = {
    visitors: [120, 180, 240, 320, 280, 380, 420, 510, 480, 560, 620, 720],
    signups: [8, 12, 18, 22, 19, 28, 35, 42, 38, 51, 58, 68],
    conversions: [3.2, 3.8, 4.1, 4.5, 4.0, 4.8, 5.1, 5.6, 5.2, 6.0, 6.4, 7.1],
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Deep-dive into platform performance
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Page views", value: "184,239", delta: "+18%" },
          { label: "Unique visitors", value: "62,418", delta: "+12%" },
          { label: "Sign-ups", value: "1,284", delta: "+24%" },
          { label: "Conversion", value: "3.8%", delta: "+0.6pt" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]"
          >
            <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm text-[var(--text-tertiary)]">{s.label}</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {s.delta}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
      >
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Traffic overview</h2>
        <p className="text-xs text-[var(--text-tertiary)]">Last 12 months</p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {Object.entries(series).map(([key, values]) => {
            const max = Math.max(...values);
            return (
              <div key={key}>
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  {key}
                </div>
                <div className="flex h-32 items-end gap-1">
                  {values.map((v, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${(v / max) * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.04, duration: 0.5 }}
                      className="flex-1 rounded-t bg-gradient-to-t from-accent-500/40 to-accent-500"
                    />
                  ))}
                </div>
                <div className="mt-2 text-xs text-[var(--text-tertiary)]">
                  Peak {max.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Top sources</h2>
          <ul className="mt-4 space-y-3">
            {[
              { name: "Direct", pct: 42, count: "26,210" },
              { name: "Google", pct: 28, count: "17,480" },
              { name: "Social", pct: 18, count: "11,235" },
              { name: "Referral", pct: 8, count: "4,990" },
              { name: "Email", pct: 4, count: "2,503" },
            ].map((s) => (
              <li key={s.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-primary)]">{s.name}</span>
                  <span className="text-[var(--text-tertiary)]">
                    {s.count} · {s.pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg-card-hover)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct * 2}%` }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="h-full bg-gradient-to-r from-accent-500 to-pink-500"
                  />
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Top cities</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["New York, USA", "32k"],
              ["London, UK", "28k"],
              ["San Francisco, USA", "21k"],
              ["Berlin, Germany", "18k"],
              ["Lahore, Pakistan", "14k"],
              ["Tokyo, Japan", "11k"],
            ].map(([city, count]) => (
              <li
                key={city}
                className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 last:border-0"
              >
                <span className="text-[var(--text-primary)]">{city}</span>
                <span className="font-medium text-[var(--text-secondary)]">{count}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}

// =====================================================
// REGISTRATIONS
// =====================================================
const pendingRegs = [
  {
    id: "r1",
    name: "Sana Malik",
    email: "sana@gmail.com",
    role: "Organizer",
    org: "Karachi Arts Council",
    when: "12m ago",
    location: "Karachi, Pakistan",
    requestedPlan: "Occaz Pro",
    message: "We host a monthly arts & literature festival and would love to reach a wider audience through Occaz.",
    submittedDocs: ["Business registration (SECP)", "Past event portfolio"],
  },
  {
    id: "r2",
    name: "James O'Connor",
    email: "james@trinity.edu",
    role: "User",
    when: "1h ago",
    location: "Dublin, Ireland",
    requestedPlan: null,
    message: "Just signed up to attend events.",
    submittedDocs: [],
  },
  {
    id: "r3",
    name: "Aiko Tanaka",
    email: "aiko@tanaka.io",
    role: "Organizer",
    org: "Tokyo Tech Meetup",
    when: "3h ago",
    location: "Tokyo, Japan",
    requestedPlan: "Occaz Business",
    message: "We organize 30+ tech events per year. Looking for advanced analytics and the multi-organizer support.",
    submittedDocs: ["Corporate registration", "Tax ID", "Sample event reports"],
  },
  {
    id: "r4",
    name: "Léa Bernard",
    email: "lea@bernard.fr",
    role: "User",
    when: "5h ago",
    location: "Lyon, France",
    requestedPlan: null,
    message: "",
    submittedDocs: [],
  },
  {
    id: "r5",
    name: "Kenji Nakamura",
    email: "kenji@nakamura.io",
    role: "Organizer",
    org: "Osaka Events",
    when: "1d ago",
    location: "Osaka, Japan",
    requestedPlan: "Occaz Pro",
    message: "Small but growing. Currently running 4 events / month.",
    submittedDocs: ["Personal ID", "Tax document"],
  },
  {
    id: "r6",
    name: "Olivia Carter",
    email: "olivia@carter.co",
    role: "User",
    when: "2d ago",
    location: "Cape Town, South Africa",
    requestedPlan: null,
    message: "",
    submittedDocs: [],
  },
];
/* New AdminRegistrations to be inserted at line 255 in AdminPages.tsx */

interface RegRow {
  id: string;
  user_id: string | null;
  event_id: string | null;
  opportunity_id: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  qty: number | null;
  total: number | null;
  currency: string | null;
  status: string | null;
  ticket_code: string | null;
  created_at: string | null;
}

interface PaymentInfo {
  id: string;
  method: string | null;     // "card" | "manual"
  status: string | null;      // "pending" | "approved" | "rejected" | "succeeded"
  amount: number | null;
  currency: string | null;
  screenshot_url: string | null;
  transaction_ref: string | null;
  notes: string | null;
  created_at: string | null;
  reviewed_at: string | null;
}

export function AdminRegistrations() {
  const { push } = useToast();
  const [rows, setRows] = useState<RegRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "pending" | "confirmed" | "rejected" | "pending_verification">("all");
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<RegRow | null>(null);
  const [events, setEvents] = useState<Record<string, { title: string; date: string }>>({});
  const [users, setUsers] = useState<Record<string, { email: string; name: string; phone: string }>>({});
  const [payments, setPayments] = useState<Record<string, PaymentInfo>>({});

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      push("err", `Failed to load: ${error.message}`);
    } else {
      const list = (data ?? []) as RegRow[];
      setRows(list);
      const evIds = [...new Set(list.map((r) => r.event_id).filter(Boolean))] as string[];
      if (evIds.length > 0) {
        const { data: evs } = await supabase
          .from("events")
          .select("id, title, date")
          .in("id", evIds);
        const map: Record<string, { title: string; date: string }> = {};
        for (const e of evs ?? []) {
          map[(e as any).id] = { title: (e as any).title, date: (e as any).date };
        }
        setEvents(map);
      }
      const userIds = [...new Set(list.map((r) => r.user_id).filter(Boolean))] as string[];
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, email, full_name, phone")
          .in("id", userIds);
        const map: Record<string, { email: string; name: string; phone: string }> = {};
        for (const p of profs ?? []) {
          map[(p as any).id] = {
            email: (p as any).email || "",
            name: (p as any).full_name || "",
            phone: (p as any).phone || "",
          };
        }
        setUsers(map);
      }
      // Load payment submissions for these registrations
      const regIds = list.map((r) => r.id).filter(Boolean) as string[];
      if (regIds.length > 0) {
        const { data: pays } = await supabase
          .from("payment_submissions")
          .select("*")
          .in("registration_id", regIds);
        const payMap: Record<string, PaymentInfo> = {};
        for (const p of pays ?? []) {
          // Use registration_id as the key
          const key = (p as any).registration_id;
          if (key) {
            payMap[key] = p as PaymentInfo;
          }
        }
        setPayments(payMap);
      } else {
        setPayments({});
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = {
    all: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    confirmed: rows.filter((r) => r.status === "confirmed").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
    pending_verification: rows.filter((r) => r.status === "pending_verification").length,
  };

  const filtered = rows
    .filter((r) => (tab === "all" ? true : r.status === tab))
    .filter((r) => {
      const t = q.trim().toLowerCase();
      if (!t) return true;
      const ev = r.event_id ? events[r.event_id] : null;
      return (
        r.attendee_name?.toLowerCase().includes(t) ||
        r.attendee_email?.toLowerCase().includes(t) ||
        r.ticket_code?.toLowerCase().includes(t) ||
        ev?.title.toLowerCase().includes(t)
      );
    });

  async function setStatus(r: RegRow, status: string) {
    const { error } = await supabase
      .from("registrations")
      .update({ status })
      .eq("id", r.id);
    if (error) {
      push("err", `Update failed: ${error.message}`);
    } else {
      push("ok", `Marked as ${status}`);
      load();
    }
  }

  async function remove(r: RegRow) {
    if (!confirm(`Delete registration for "${r.attendee_name}"?`)) return;
    const { error } = await supabase.from("registrations").delete().eq("id", r.id);
    if (error) {
      push("err", `Delete failed: ${error.message}`);
    } else {
      push("ok", "Deleted");
      load();
    }
  }

  function statusBadge(s: string | null) {
    if (s === "confirmed") return <Badge tone="emerald">✓ Confirmed</Badge>;
    if (s === "pending_verification") return <Badge tone="amber">⏳ Verifying</Badge>;
    if (s === "rejected") return <Badge tone="rose">✗ Rejected</Badge>;
    if (s === "pending") return <Badge tone="sky">Pending</Badge>;
    return <Badge tone="zinc">{s ?? "—"}</Badge>;
  }

  function fmtDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Registrations
        </h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          All event registrations — confirm pending ones, see who's coming
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([
          ["all", "All"],
          ["pending", "Pending"],
          ["pending_verification", "Verifying"],
          ["confirmed", "Confirmed"],
          ["rejected", "Rejected"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k as any)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              tab === k
                ? "bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30"
                : "text-[var(--text-tertiary)] hover:bg-[var(--bg-card)]"
            }`}
          >
            {label}
            <span className="ml-2 text-xs opacity-70">{counts[k]}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)] min-w-0 flex-1 max-w-sm">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search user, event, ticket code..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-tertiary)]">
            Loading registrations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-sm text-[var(--text-tertiary)]">
            <Inbox className="h-8 w-8 opacity-30" />
            {rows.length === 0
              ? "No registrations yet. Users will appear here when they book a ticket."
              : "No registrations match this filter."}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((r) => {
              const ev = r.event_id ? events[r.event_id] : null;
              const u = r.user_id ? users[r.user_id] : null;
              const pay = payments[r.id];
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-4 p-4 transition hover:bg-[var(--bg-card-hover)] cursor-pointer"
                  onClick={() => setViewing(r)}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent-500 to-pink-500 text-sm font-semibold text-white">
                    {(r.attendee_name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {r.attendee_name || "(no name)"}
                      </div>
                      {statusBadge(r.status)}
                      {pay && (
                        pay.method === "card" ? (
                          <Badge tone="accent">
                            <CreditCard className="mr-1 inline h-2.5 w-2.5" /> Card
                          </Badge>
                        ) : pay.method === "manual" ? (
                          <Badge tone="violet">
                            <Banknote className="mr-1 inline h-2.5 w-2.5" /> Manual
                          </Badge>
                        ) : null
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
                      {ev?.title || r.event_id || "—"}
                      {r.total ? ` · Rs ${Number(r.total).toLocaleString()}` : ""}
                      {r.ticket_code ? ` · 🎫 ${r.ticket_code}` : ""}
                      {pay?.transaction_ref ? ` · Ref: ${pay.transaction_ref}` : ""}
                      {" · "}
                      {fmtDate(r.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewing(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: 480, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 480, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-[var(--border-subtle)] bg-[var(--bg-base)] p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-pink-500 text-base font-semibold text-white">
                    {(viewing.attendee_name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{viewing.attendee_name}</h2>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                      {statusBadge(viewing.status)}
                      <span>·</span>
                      <span>{fmtDate(viewing.created_at)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewing(null)}
                  aria-label="Close"
                  className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-tertiary)] transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <RegRow label="Email">
                  {viewing.attendee_email ? (
                    <a href={`mailto:${viewing.attendee_email}`} className="text-accent-400 hover:underline">
                      {viewing.attendee_email}
                    </a>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">—</span>
                  )}
                </RegRow>
                <RegRow label="Phone">
                  <span>{viewing.attendee_phone || "—"}</span>
                </RegRow>
                <RegRow label="Event">
                  {viewing.event_id && events[viewing.event_id] ? (
                    <div>
                      <div className="font-medium">{events[viewing.event_id].title}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{events[viewing.event_id].date}</div>
                    </div>
                  ) : (
                    <span className="font-mono text-xs">{viewing.event_id || "—"}</span>
                  )}
                </RegRow>
                <RegRow label="Quantity">
                  <span>{viewing.qty ?? 1}</span>
                </RegRow>
                <RegRow label="Total">
                  <span className="font-semibold">
                    Rs {Number(viewing.total ?? 0).toLocaleString()}
                    {viewing.currency && viewing.currency !== "PKR" ? ` ${viewing.currency}` : ""}
                  </span>
                </RegRow>
                <RegRow label="Ticket code">
                  <span className="font-mono text-sm">{viewing.ticket_code || "—"}</span>
                </RegRow>
                <RegRow label="Auth user">
                  {viewing.user_id && users[viewing.user_id] ? (
                    <div>
                      <div className="text-sm">{users[viewing.user_id].name || users[viewing.user_id].email}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">{users[viewing.user_id].phone || "—"}</div>
                    </div>
                  ) : (
                    <span className="font-mono text-xs">{viewing.user_id || "Guest"}</span>
                  )}
                </RegRow>

                {/* Payment details */}
                {payments[viewing.id] && (
                  <>
                    <div className="my-2 border-t border-[var(--border-subtle)]" />
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-accent-400">
                      Payment details
                    </div>
                    <RegRow label="Method">
                      {payments[viewing.id].method === "card" ? (
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-accent-400" />
                          <span className="font-medium">Card</span>
                        </div>
                      ) : payments[viewing.id].method === "manual" ? (
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-violet-400" />
                          <span className="font-medium">Manual transfer</span>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </RegRow>
                    <RegRow label="Payment status">
                      {(() => {
                        const ps = payments[viewing.id].status;
                        if (ps === "approved" || ps === "succeeded")
                          return <Badge tone="emerald">✓ {ps}</Badge>;
                        if (ps === "rejected")
                          return <Badge tone="rose">✗ {ps}</Badge>;
                        if (ps === "pending")
                          return <Badge tone="amber">⏳ {ps}</Badge>;
                        return <Badge tone="zinc">{ps}</Badge>;
                      })()}
                    </RegRow>
                    {payments[viewing.id].transaction_ref && (
                      <RegRow label="Transaction ref">
                        <span className="font-mono text-xs">{payments[viewing.id].transaction_ref}</span>
                      </RegRow>
                    )}
                    {payments[viewing.id].notes && (
                      <RegRow label="User notes">
                        <p className="rounded-lg bg-[var(--bg-card)] p-2 text-xs text-[var(--text-secondary)]">
                          {payments[viewing.id].notes}
                        </p>
                      </RegRow>
                    )}
                    {payments[viewing.id].screenshot_url && (
                      <RegRow label="Payment screenshot">
                        <a
                          href={payments[viewing.id].screenshot_url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-xl ring-1 ring-[var(--border-default)] transition hover:ring-accent-500/50"
                        >
                          <img
                            src={payments[viewing.id].screenshot_url!}
                            alt="Payment screenshot"
                            className="w-full"
                          />
                        </a>
                        <a
                          href={payments[viewing.id].screenshot_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-accent-400 hover:underline"
                        >
                          <ExternalLink className="h-2.5 w-2.5" /> Open full size
                        </a>
                      </RegRow>
                    )}
                    {payments[viewing.id].reviewed_at && (
                      <RegRow label="Reviewed at">
                        <span className="text-xs">{fmtDate(payments[viewing.id].reviewed_at)}</span>
                      </RegRow>
                    )}
                  </>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-2">
                {viewing.status !== "confirmed" && (
                  <Button
                    fullWidth
                    leftIcon={<Check className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setStatus(viewing, "confirmed");
                      setViewing(null);
                    }}
                  >
                    Mark as confirmed
                  </Button>
                )}
                {viewing.status !== "rejected" && (
                  <Button
                    fullWidth
                    variant="outline"
                    leftIcon={<X className="h-3.5 w-3.5" />}
                    onClick={() => {
                      setStatus(viewing, "rejected");
                      setViewing(null);
                    }}
                  >
                    Reject
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="danger"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => {
                    remove(viewing);
                    setViewing(null);
                  }}
                >
                  Delete record
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function RegRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}



// =====================================================
// REVIEWS
// =====================================================
const reviews = [
  { id: "rv1", event: "Aurora Live: The Mirror Tour", user: "Sarah J.", rating: 5, body: "Absolutely magical night. The sound was perfect.", when: "2h ago", status: "approved" },
  { id: "rv2", event: "DevConf 2026", user: "Ahmed K.", rating: 4, body: "Great speakers but coffee was weak.", when: "5h ago", status: "approved" },
  { id: "rv3", event: "Stand-Up Night", user: "Anonymous", rating: 1, body: "this is spam content with bad words", when: "1d ago", status: "flagged" },
  { id: "rv4", event: "Watercolor Workshop", user: "Maya P.", rating: 5, body: "Loved every minute. The instructor was wonderful.", when: "2d ago", status: "pending" },
];

export function AdminReviews() {
  const [list, setList] = useState(reviews);
  const [tab, setTab] = useState<"all" | "pending" | "flagged" | "approved">("all");

  const filtered = tab === "all" ? list : list.filter((r) => r.status === tab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Reviews</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Moderate user reviews across the platform
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: list.length, tone: "default" as const },
          { label: "Pending", value: list.filter((r) => r.status === "pending").length, tone: "amber" as const },
          { label: "Approved", value: list.filter((r) => r.status === "approved").length, tone: "emerald" as const },
          { label: "Flagged", value: list.filter((r) => r.status === "flagged").length, tone: "red" as const },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
            <div className="mt-1">
              <Badge tone={s.tone}>{s.label}</Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)] w-fit">
        {(["all", "pending", "approved", "flagged"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition",
              tab === t
                ? "bg-white text-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--text-primary)]">{r.user}</span>
                  <span className="text-[var(--text-tertiary)]">on</span>
                  <span className="font-medium text-[var(--text-primary)]">{r.event}</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={clsx(
                        "h-3.5 w-3.5",
                        i < r.rating ? "fill-amber-400 text-amber-400" : "text-[var(--text-tertiary)]",
                      )}
                    />
                  ))}
                  <span className="ml-2 text-xs text-[var(--text-tertiary)]">{r.when}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{r.body}</p>
              </div>
              <Badge tone={r.status === "approved" ? "emerald" : r.status === "flagged" ? "red" : "amber"}>
                {r.status}
              </Badge>
            </div>
            {r.status !== "approved" && (
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  leftIcon={<Check className="h-3.5 w-3.5" />}
                  onClick={() => setList((p) => p.map((x) => x.id === r.id ? { ...x, status: "approved" } : x))}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => setList((p) => p.filter((x) => x.id !== r.id))}
                >
                  Remove
                </Button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// NOTIFICATIONS
// =====================================================
export function AdminNotifications() {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Notifications</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">Configure platform-wide alerts</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Channels</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">Choose how users receive alerts</p>
          <div className="mt-5 space-y-3">
            <Channel label="Push notifications" desc="Real-time alerts on mobile and web" on={push} onChange={setPush} />
            <Channel label="Email" desc="Transactional and digest emails" on={email} onChange={setEmail} />
            <Channel label="SMS" desc="Time-sensitive reminders (carrier fees apply)" on={sms} onChange={setSms} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Triggers</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">When to send notifications</p>
          <div className="mt-5 space-y-3">
            {[
              { label: "Event saved", desc: "Confirm when a user bookmarks an event" },
              { label: "Event starting soon", desc: "Reminder 24h before saved events" },
              { label: "New opportunities", desc: "Alerts for new scholarships and programs" },
              { label: "Registration approved", desc: "Notify when admin approves account" },
              { label: "Price drop", desc: "Alert when a saved event's price drops" },
            ].map((t, i) => (
              <div key={t.label} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-elevated)] p-3 ring-1 ring-[var(--border-subtle)]">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{t.label}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">{t.desc}</div>
                </div>
                <Toggle on={i % 2 === 0} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset</Button>
        <Button>Save changes</Button>
      </div>
    </div>
  );
}

function Channel({ label, desc, on, onChange }: any) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-elevated)] p-3 ring-1 ring-[var(--border-subtle)]">
      <div>
        <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
        <div className="text-xs text-[var(--text-tertiary)]">{desc}</div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange?.(!on)}
      className={clsx(
        "relative h-6 w-11 rounded-full transition",
        on ? "bg-accent-500" : "bg-[var(--bg-card-hover)]",
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
          on ? "left-5" : "left-0.5",
        )}
      />
    </button>
  );
}

// =====================================================
// EMAIL CAMPAIGNS
// =====================================================
const campaigns = [
  { id: "c1", name: "Welcome series", audience: "New users", sent: 1284, opened: 72, clicked: 28, status: "active", when: "Ongoing" },
  { id: "c2", name: "Lahore Music Festival", audience: "Pakistan users", sent: 4218, opened: 64, clicked: 22, status: "active", when: "Last sent 2d ago" },
  { id: "c3", name: "Scholarship digest", audience: "Students", sent: 8420, opened: 58, clicked: 18, status: "draft", when: "Draft" },
  { id: "c4", name: "Win-back", audience: "Inactive 60d+", sent: 0, opened: 0, clicked: 0, status: "scheduled", when: "Scheduled for Oct 30" },
];

export function AdminEmailCampaigns() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Email campaigns</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">Send blasts, automations, and digests</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>New campaign</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total sent", value: "13.9k" },
          { label: "Open rate", value: "64%" },
          { label: "Click rate", value: "21%" },
          { label: "Active campaigns", value: "2" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
            <div className="mt-1 text-sm text-[var(--text-tertiary)]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Audience</th>
                <th className="px-5 py-3 font-medium">Sent</th>
                <th className="px-5 py-3 font-medium">Open</th>
                <th className="px-5 py-3 font-medium">Click</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-[var(--text-primary)]">{c.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{c.when}</div>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{c.audience}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{c.sent.toLocaleString()}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{c.opened}%</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{c.clicked}%</td>
                  <td className="px-5 py-3">
                    <Badge tone={c.status === "active" ? "emerald" : c.status === "scheduled" ? "blue" : "default"}>
                      {c.status}
                    </Badge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// COUPONS — implementation lives in ./AdminCoupons (re-exported below)
// =====================================================

// =====================================================
// AUDIT LOG
// =====================================================
const audit = [
  { id: "a1", actor: "Marcus Chen", action: "Approved user", target: "Sana Malik", when: "2m ago", ip: "192.168.1.4" },
  { id: "a2", actor: "System", action: "Published event", target: "DevConf 2026", when: "1h ago", ip: "—" },
  { id: "a3", actor: "Priya Patel", action: "Created event", target: "Lahore Music Festival", when: "3h ago", ip: "10.0.0.2" },
  { id: "a4", actor: "Marcus Chen", action: "Suspended user", target: "Diego Lopez", when: "5h ago", ip: "192.168.1.4" },
  { id: "a5", actor: "System", action: "Backup completed", target: "Daily snapshot", when: "8h ago", ip: "—" },
  { id: "a6", actor: "Marcus Chen", action: "Updated settings", target: "Email SMTP", when: "1d ago", ip: "192.168.1.4" },
];

export function AdminAuditLog() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Audit log</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">Every admin action, fully traceable</p>
      </div>

      <div className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">IP</th>
                <th className="px-5 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a, i) => (
                <motion.tr
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]"
                >
                  <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{a.actor}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{a.action}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{a.target}</td>
                  <td className="px-5 py-3 font-mono text-xs text-[var(--text-tertiary)]">{a.ip}</td>
                  <td className="px-5 py-3 text-[var(--text-tertiary)]">{a.when}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SUPPORT
// =====================================================
const tickets = [
  { id: "t1", user: "Sarah Johnson", subject: "Refund for cancelled event", priority: "high", status: "open", when: "12m ago" },
  { id: "t2", user: "Ahmed Khan", subject: "Can't access my tickets", priority: "high", status: "open", when: "1h ago" },
  { id: "t3", user: "Maya P.", subject: "How to become an organizer", priority: "low", status: "pending", when: "4h ago" },
  { id: "t4", user: "Diego L.", subject: "Feature request: dark mode for emails", priority: "low", status: "resolved", when: "1d ago" },
];

export function AdminSupport() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Support</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">User support tickets</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Open", value: tickets.filter((t) => t.status === "open").length, tone: "amber" as const },
          { label: "Pending", value: tickets.filter((t) => t.status === "pending").length, tone: "blue" as const },
          { label: "Resolved", value: tickets.filter((t) => t.status === "resolved").length, tone: "emerald" as const },
          { label: "Avg response", value: "2.4h", tone: "default" as const },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
            <div className="mt-1"><Badge tone={s.tone}>{s.label}</Badge></div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {tickets.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex flex-col gap-3 rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <LifeBuoy className={clsx("h-5 w-5 shrink-0", t.priority === "high" ? "text-red-400" : "text-[var(--text-tertiary)]")} />
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{t.subject}</div>
                <div className="text-xs text-[var(--text-tertiary)]">From {t.user} · {t.when}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={t.priority === "high" ? "red" : "default"}>{t.priority}</Badge>
              <Badge tone={t.status === "open" ? "amber" : t.status === "pending" ? "blue" : "emerald"}>{t.status}</Badge>
              <Button size="sm" variant="outline">Open</Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// PAYOUTS
// =====================================================
export function AdminPayouts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Payouts</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">Organizer earnings and withdrawals</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Pending", value: "$48,210" },
          { label: "Paid this month", value: "$184,000" },
          { label: "Organizers paid", value: "118" },
          { label: "Next payout", value: "Oct 30" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
            <div className="mt-1 text-sm text-[var(--text-tertiary)]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-5 py-3 font-medium">Organizer</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {[
                { org: "Stellar Entertainment", amount: "$24,800", method: "ACH", status: "paid", when: "Oct 15" },
                { org: "Heritage Music Co.", amount: "$12,400", method: "PayPal", status: "pending", when: "Queued" },
                { org: "Y Combinator", amount: "$48,210", method: "Wire", status: "processing", when: "Today" },
                { org: "MIT Media Lab", amount: "$8,400", method: "ACH", status: "paid", when: "Oct 12" },
                { org: "Reforge", amount: "$6,200", method: "Stripe", status: "pending", when: "Queued" },
              ].map((p, i) => (
                <motion.tr
                  key={p.org}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]"
                >
                  <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{p.org}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{p.amount}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{p.method}</td>
                  <td className="px-5 py-3">
                    <Badge tone={p.status === "paid" ? "emerald" : p.status === "pending" ? "amber" : "blue"}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-tertiary)]">{p.when}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// REVENUE
// =====================================================
export function AdminRevenue() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Revenue</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">Platform-wide financial overview</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Gross revenue", value: "$284k", delta: "+22%" },
          { label: "Platform fee", value: "$42k", delta: "+18%" },
          { label: "Refunds", value: "$3.2k", delta: "-12%" },
          { label: "Net revenue", value: "$238k", delta: "+24%" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]"
          >
            <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm text-[var(--text-tertiary)]">{s.label}</span>
              <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium", s.delta.startsWith("+") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                {s.delta}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Revenue by month</h2>
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>Export</Button>
        </div>
        <div className="mt-6 grid grid-cols-12 items-end gap-2 h-48">
          {[42, 38, 55, 62, 48, 70, 65, 78, 82, 75, 90, 96].map((v, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${v}%` }}
              transition={{ delay: 0.3 + i * 0.04, duration: 0.6 }}
              className="rounded-t bg-gradient-to-t from-accent-500/40 to-accent-500"
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-[var(--text-tertiary)]">
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// =====================================================
// INTEGRATIONS
// =====================================================
const integrations = [
  { name: "Stripe", desc: "Payments and payouts", connected: true, Icon: CreditCard },
  { name: "SendGrid", desc: "Transactional email", connected: true, Icon: Mail },
  { name: "Twilio", desc: "SMS notifications", connected: false, Icon: Send },
  { name: "Google Maps", desc: "Venue lookups", connected: true, Icon: Globe },
  { name: "Slack", desc: "Admin alerts", connected: false, Icon: Bell },
  { name: "Supabase", desc: "Database and auth", connected: true, Icon: Database },
];

export function AdminIntegrations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Integrations</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">Connect third-party services</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((i, idx) => (
          <motion.div
            key={i.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-accent-500/20 to-pink-500/10 ring-1 ring-accent-500/30 text-accent-400">
                <i.Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-[var(--text-primary)]">{i.name}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{i.desc}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {i.connected ? (
                <Badge tone="emerald">Connected</Badge>
              ) : (
                <Badge tone="default">Not connected</Badge>
              )}
              <Button size="sm" variant={i.connected ? "outline" : "primary"}>
                {i.connected ? "Manage" : "Connect"}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// DOMAINS & SEO
// =====================================================
export function AdminDomains() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Domains & SEO</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">Custom domains and search engine metadata</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Custom domains</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">Map your own domain to Occaz</p>
          <div className="mt-5 space-y-3">
            {["events.acme.com", "tickets.acme.com"].map((d) => (
              <div key={d} className="flex items-center justify-between rounded-xl bg-[var(--bg-elevated)] p-3 ring-1 ring-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-accent-400" />
                  <span className="font-mono text-sm text-[var(--text-primary)]">{d}</span>
                </div>
                <Badge tone="emerald">Verified</Badge>
              </div>
            ))}
            <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />}>Add domain</Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Default SEO</h2>
          <div className="mt-5 space-y-4">
            <Field label="Site title">
              <input defaultValue="Occaz — Events, Tickets & Opportunities" className="input" />
            </Field>
            <Field label="Meta description">
              <textarea
                defaultValue="Discover events, tickets and life-changing opportunities — beautifully curated."
                className="input resize-none"
                rows={2}
              />
            </Field>
            <Field label="OG image">
              <input defaultValue="https://occaz.app/og.png" className="input" />
            </Field>
            <Field label="Twitter handle">
              <input defaultValue="@occaz" className="input" />
            </Field>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Reset</Button>
        <Button>Save</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">{label}</span>
      {children}
    </label>
  );
}

// =====================================================
// BACKUP & DATA
// =====================================================
export function AdminBackup() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Backup & Data</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">Snapshots, exports, and retention</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Last backup", value: "2h ago" },
          { label: "Total size", value: "4.2 GB" },
          { label: "Backups kept", value: "30" },
          { label: "Region", value: "us-east-1" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
            <div className="mt-1 text-sm text-[var(--text-tertiary)]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Manual backup</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">Trigger a full snapshot now</p>
          <Button className="mt-4" leftIcon={<Database className="h-4 w-4" />}>Start backup</Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Data export</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">Download all platform data</p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>CSV</Button>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>JSON</Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// =====================================================
// ROLES & PERMISSIONS
// =====================================================
const permissions = [
  { name: "Manage events", admin: true, organizer: true, user: false },
  { name: "Manage opportunities", admin: true, organizer: true, user: false },
  { name: "Approve registrations", admin: true, organizer: false, user: false },
  { name: "Manage users", admin: true, organizer: false, user: false },
  { name: "Send notifications", admin: true, organizer: true, user: false },
  { name: "View analytics", admin: true, organizer: true, user: false },
  { name: "Process refunds", admin: true, organizer: true, user: false },
  { name: "Submit support tickets", admin: true, organizer: true, user: true },
];

export function AdminRoles() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Roles & Permissions</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">Control what each role can do</p>
      </div>

      <div className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-5 py-3 font-medium">Permission</th>
                <th className="px-5 py-3 font-medium text-center">Admin</th>
                <th className="px-5 py-3 font-medium text-center">Organizer</th>
                <th className="px-5 py-3 font-medium text-center">User</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p, i) => (
                <motion.tr
                  key={p.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] last:border-0"
                >
                  <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{p.name}</td>
                  {(["admin", "organizer", "user"] as const).map((k) => (
                    <td key={k} className="px-5 py-3 text-center">
                      <Toggle on={p[k]} />
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// HOMEPAGE EDITOR
// =====================================================
export function AdminHomepage() {
  const [heroBgGallery, setHeroBgGallery] = useState<ImageItem[]>(() => [
    {
      id: "hero",
      url: "https://picsum.photos/seed/hero/1800/900",
      isCover: true,
      status: "ready" as const,
    },
  ]);
  const [sections, setSections] = useState<string[]>([
    "Happening Today",
    "Popular Near You",
    "Recommended For You",
    "Upcoming Events",
    "Latest Opportunities",
    "Featured Events",
    "List your event CTA",
  ]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Load existing section order from DB on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("homepage_settings")
        .select("section_order, hero_bg_url")
        .eq("id", "default")
        .maybeSingle();
      if (!alive) return;
      if (data) {
        if (Array.isArray(data.section_order) && data.section_order.length > 0) {
          setSections(data.section_order as string[]);
        }
        if (data.hero_bg_url) {
          setHeroBgGallery([
            {
              id: "hero",
              url: data.hero_bg_url,
              isCover: true,
              status: "ready" as const,
            },
          ]);
        }
      }
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function onPublish() {
    setSaving(true);
    setSaveMsg(null);
    const heroUrl =
      heroBgGallery.find(
        (g) => g.status === "ready" && !g.url.startsWith("blob:"),
      )?.url ?? "";
    const { error } = await supabase
      .from("homepage_settings")
      .upsert(
        {
          id: "default",
          section_order: sections,
          hero_bg_url: heroUrl || null,
        },
        { onConflict: "id" },
      );
    setSaving(false);
    if (error) {
      setSaveMsg({ kind: "err", text: `Save failed: ${error.message}` });
    } else {
      setSaveMsg({ kind: "ok", text: "Homepage published." });
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Homepage</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">Edit content shown on the user homepage</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Hero</h2>
          <div className="mt-5 space-y-4">
            <Field label="Heading">
              <input defaultValue="Events, tickets & opportunities —" className="input" />
            </Field>
            <Field label="Highlight">
              <input defaultValue="beautifully curated." className="input" />
            </Field>
            <Field label="Subheading">
              <textarea
                defaultValue="Find concerts, conferences, scholarships and more — all in one elegant, distraction-free experience."
                className="input resize-none"
                rows={3}
              />
            </Field>
            <Field label="Background image">
              <ImageUploader
                images={heroBgGallery}
                storageKind="misc"
                max={1}
                onChange={(next) => {
                  // CRITICAL: use functional updater so the real-URL
                  // callback applies to the latest gallery state.
                  setHeroBgGallery((prev) =>
                    typeof next === "function" ? next(prev) : next,
                  );
                }}
              />
              <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                Used as the hero background. Best at 1800×900.
              </p>
            </Field>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Section order</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">Drag to reorder</p>
          <Reorder.Group
            axis="y"
            values={sections}
            onReorder={setSections}
            className="mt-5 space-y-2"
          >
            {sections.map((s) => (
              <Reorder.Item
                key={s}
                value={s}
                whileDrag={{ scale: 1.02, zIndex: 10 }}
                className="flex cursor-grab items-center gap-3 rounded-xl bg-[var(--bg-elevated)] p-3 ring-1 ring-[var(--border-subtle)] active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-[var(--text-tertiary)]" />
                <span className="flex-1 text-sm text-[var(--text-primary)]">{s}</span>
                <Toggle on />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </motion.div>
      </div>

      <div className="flex items-center gap-3">
        {saveMsg && (
          <div
            className={clsx(
              "rounded-lg px-3 py-1.5 text-sm",
              saveMsg.kind === "ok"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-red-500/15 text-red-300",
            )}
          >
            {saveMsg.text}
          </div>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline">Preview</Button>
          <Button onClick={onPublish} disabled={saving || !loaded}>
            {saving ? "Saving…" : "Publish changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Re-export AdminCities (defined in its own file to keep AdminPages manageable)
export { AdminCities } from "./AdminCities";
export { AdminPaymentSettings } from "./AdminPaymentSettings";
export { AdminPaymentSubmissions } from "./AdminPaymentSubmissions";
export { AdminPlanPayments } from "./AdminPlanPayments";
export { AdminCoupons } from "./AdminCoupons";
