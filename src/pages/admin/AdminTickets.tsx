import { useMemo, useState } from "react";
import { tickets } from "../../data/mock";
import { Search } from "lucide-react";
import { Badge } from "../../components/ui/Badge";

export function AdminTickets() {
  const [list] = useState(tickets);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "upcoming" | "past">("all");

  const filtered = useMemo(() => {
    return list.filter((t) => {
      if (q && !`${t.event.title} ${t.qr}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (status !== "all" && t.status !== status) return false;
      return true;
    });
  }, [list, q, status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">All ticket sales across the platform</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KPI label="Total sold" value={list.length.toString()} />
        <KPI label="Upcoming" value={list.filter(t => t.status === "upcoming").length.toString()} />
        <KPI label="Revenue" value={`$${list.reduce((s, t) => s + t.price, 0).toLocaleString()}`} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-[var(--bg-card)] px-4 py-2.5 ring-1 ring-[var(--border-subtle)]">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by event or code..." className="flex-1 bg-transparent text-sm placeholder:text-[var(--text-tertiary)] outline-none" />
        </div>
        <div className="flex gap-1 rounded-xl bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)]">
          {(["all", "upcoming", "past"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize transition ${
                status === s ? "bg-white text-black" : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-5 py-3 font-medium">Ticket ID</th>
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]">
                  <td className="px-5 py-3 font-mono text-xs text-[var(--text-secondary)]">{t.id.toUpperCase()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={t.event.image} className="h-9 w-9 rounded-lg object-cover" />
                      <span className="font-medium">{t.event.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{t.type}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{t.event.date}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">${t.price}</td>
                  <td className="px-5 py-3">
                    <Badge tone={t.status === "upcoming" ? "emerald" : "default"}>
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-[var(--text-tertiary)]">{label}</div>
    </div>
  );
}
