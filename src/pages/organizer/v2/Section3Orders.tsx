import { useEffect, useState } from "react";
import { Ticket, Download, Search, RotateCcw, Eye } from "lucide-react";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../lib/toast";

/**
 * Section 3 — Tickets & Orders
 * Real data from registrations. Refund + CSV export wired.
 */
export function Section3Orders() {
  const { user } = useAuth();
  const { push } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [events, setEvents] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "paid" | "pending" | "cancelled" | "refunded">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: regs } = await supabase
        .from("registrations")
        .select("id, event_id, attendee_name, attendee_email, attendee_phone, total, currency, status, payment_status, payment_method, ticket_code, created_at, commission_amount")
        .eq("organizer_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(regs ?? []);
      const { data: evs } = await supabase
        .from("events")
        .select("id, title")
        .eq("organizer_id", user.id);
      const map: Record<string, any> = {};
      (evs ?? []).forEach((e) => (map[e.id] = e));
      setEvents(map);
      setLoading(false);
    })();
  }, [user]);

  const filtered = orders.filter((o) => {
    if (q) {
      const hay = `${o.attendee_name ?? ""} ${o.attendee_email ?? ""} ${o.ticket_code ?? ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    if (status === "all") return true;
    if (status === "paid") return o.payment_status === "paid";
    if (status === "pending") return o.payment_status === "pending";
    if (status === "cancelled") return o.payment_status === "cancelled";
    if (status === "refunded") return o.payment_status === "refunded";
    return true;
  });

  async function refund(o: any) {
    if (!confirm(`Refund ${o.attendee_name ?? "attendee"} for ₨ ${Number(o.total).toLocaleString()}? This will mark the order as refunded.`)) return;
    setBusyId(o.id);
    const { error } = await supabase
      .from("registrations")
      .update({
        payment_status: "refunded",
        status: "cancelled",
        refunded_at: new Date().toISOString(),
        refunded_amount: o.total,
      })
      .eq("id", o.id);
    setBusyId(null);
    if (error) {
      push({ tone: "red", title: "Refund failed", message: error.message });
      return;
    }
    setOrders((os) =>
      os.map((x) =>
        x.id === o.id
          ? {
              ...x,
              payment_status: "refunded",
              status: "cancelled",
              refunded_at: new Date().toISOString(),
              refunded_amount: o.total,
            }
          : x,
      ),
    );
    push({ tone: "green", title: "Refunded", message: "Order marked as refunded." });
  }

  function exportCSV() {
    if (filtered.length === 0) {
      push({ tone: "red", title: "Nothing to export", message: "No orders match your filter." });
      return;
    }
    const headers = [
      "Ticket code",
      "Attendee name",
      "Email",
      "Phone",
      "Event",
      "Total (PKR)",
      "Payment status",
      "Method",
      "Created at",
    ];
    const rows = filtered.map((o) => [
      o.ticket_code ?? "",
      (o.attendee_name ?? "").replace(/,/g, " "),
      (o.attendee_email ?? "").replace(/,/g, " "),
      o.attendee_phone ?? "",
      (events[o.event_id]?.title ?? o.event_id).replace(/,/g, " "),
      o.total,
      o.payment_status ?? "paid",
      o.payment_method ?? "",
      o.created_at ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `occaz-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    push({ tone: "green", title: "CSV exported", message: `${filtered.length} orders` });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Tickets & orders</h2>
          <p className="text-xs text-zinc-500">
            All registrations, refunds, and QR tickets across your events
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/5 bg-[var(--bg-card)] px-3 py-2">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, ticket code…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-white/5 bg-[var(--bg-card)] p-1">
          {["all", "paid", "pending", "cancelled", "refunded"].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s as any)}
              className={
                "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold capitalize " +
                (status === s
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-8 text-center text-sm text-zinc-500">
          Loading orders…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[var(--bg-card)] p-12 text-center">
          <Ticket className="mx-auto h-10 w-10 text-zinc-600" />
          <h3 className="mt-3 text-base font-semibold text-white">No orders yet</h3>
          <p className="mt-1 text-sm text-zinc-500">
            When attendees register, their tickets will show up here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[var(--bg-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-3 py-2 text-left">Attendee</th>
                  <th className="px-3 py-2 text-left">Event</th>
                  <th className="px-3 py-2 text-left">Ticket</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const isBusy = busyId === o.id;
                  return (
                    <tr
                      key={o.id}
                      className="border-t border-white/5 hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium text-white">{o.attendee_name ?? "—"}</div>
                        <div className="text-[10px] text-zinc-500">{o.attendee_email ?? "—"}</div>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-2 text-zinc-400">
                        {events[o.event_id]?.title ?? o.event_id}
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-zinc-500">
                        {o.ticket_code ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-white">
                        {Number(o.total ?? 0) === 0
                          ? "Free"
                          : `₨ ${Number(o.total ?? 0).toLocaleString()}`}
                      </td>
                      <td className="px-3 py-2">
                        {Number(o.total ?? 0) === 0 && o.payment_status === "paid" ? (
                          <StatusPill status="free" />
                        ) : (
                          <StatusPill status={o.payment_status ?? o.status} />
                        )}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-zinc-500">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          {o.ticket_code && (
                            <a
                              href={`/tickets?code=${encodeURIComponent(o.ticket_code)}`}
                              className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
                              title="View ticket"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {o.payment_status === "paid" && Number(o.total ?? 0) > 0 && (
                            <button
                              onClick={() => refund(o)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/25 disabled:opacity-50"
                            >
                              <RotateCcw className="h-3 w-3" /> Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tones: Record<string, string> = {
    paid: "bg-emerald-500/15 text-emerald-300",
    confirmed: "bg-emerald-500/15 text-emerald-300",
    free: "bg-cyan-500/15 text-cyan-300",
    pending: "bg-amber-500/15 text-amber-300",
    cancelled: "bg-red-500/15 text-red-300",
    refunded: "bg-zinc-500/15 text-zinc-300",
  };
  return (
    <span
      className={
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
        (tones[status] ?? "bg-zinc-500/15 text-zinc-300")
      }
    >
      {status}
    </span>
  );
}
