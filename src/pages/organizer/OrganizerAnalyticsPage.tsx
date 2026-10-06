import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Users,
  Banknote,
  Eye,
  Heart,
  Calendar,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../lib/auth";
import { useDataStore } from "../../data/store";
import { supabase } from "../../lib/supabase";

interface DailyStat {
  date: string;
  registrations: number;
  revenue: number;
}

export function OrganizerAnalyticsPage() {
  const { user } = useAuth();
  const { events } = useDataStore();
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");
  const [regs, setRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const myOrgName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const myEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          e.organizer === myOrgName ||
          (e as any).created_by === user?.id ||
          (e as any).organizer_id === user?.id,
      ),
    [events, user, myOrgName],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const ids = myEvents.map((e) => e.id);
      if (ids.length === 0) {
        setRegs([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("registrations")
        .select("id, event_id, qty, total, currency, status, created_at")
        .in("event_id", ids);
      if (!alive) return;
      if (!error && data) setRegs(data as any[]);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [myEvents]);

  // Filter by range
  const cutoff = useMemo(() => {
    if (range === "all") return 0;
    const days = range === "7d" ? 7 : 30;
    return Date.now() - days * 24 * 60 * 60 * 1000;
  }, [range]);

  const filtered = useMemo(
    () =>
      regs.filter(
        (r) =>
          r.status !== "cancelled" && new Date(r.created_at).getTime() >= cutoff,
      ),
    [regs, cutoff],
  );

  // Stats
  const totalRegs = filtered.length;
  const totalRevenue = filtered.reduce(
    (s, r) => s + Number(r.total ?? 0),
    0,
  );
  const avgTicketPrice = totalRegs > 0 ? totalRevenue / totalRegs : 0;
  const eventCount = new Set(filtered.map((r) => r.event_id)).size;

  // Top events
  const topEvents = useMemo(() => {
    const counts: Record<string, { count: number; revenue: number }> = {};
    filtered.forEach((r) => {
      if (!counts[r.event_id]) counts[r.event_id] = { count: 0, revenue: 0 };
      counts[r.event_id].count += 1;
      counts[r.event_id].revenue += Number(r.total ?? 0);
    });
    return Object.entries(counts)
      .map(([id, v]) => {
        const ev = myEvents.find((e) => e.id === id);
        return {
          id,
          title: ev?.title ?? "Unknown",
          image: ev?.image,
          ...v,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filtered, myEvents]);

  // Daily series for chart
  const daily = useMemo<DailyStat[]>(() => {
    const map: Record<string, DailyStat> = {};
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 60;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: key, registrations: 0, revenue: 0 };
    }
    filtered.forEach((r) => {
      const key = new Date(r.created_at).toISOString().slice(0, 10);
      if (map[key]) {
        map[key].registrations += 1;
        map[key].revenue += Number(r.total ?? 0);
      }
    });
    return Object.values(map);
  }, [filtered, range]);

  const maxRegs = Math.max(1, ...daily.map((d) => d.registrations));
  const maxRev = Math.max(1, ...daily.map((d) => d.revenue));

  // Compare to previous period
  const prevCutoff = cutoff === 0 ? 0 : cutoff - (Date.now() - cutoff);
  const prevRegs = useMemo(
    () =>
      regs.filter(
        (r) =>
          r.status !== "cancelled" &&
          new Date(r.created_at).getTime() >= prevCutoff &&
          new Date(r.created_at).getTime() < cutoff,
      ),
    [regs, prevCutoff, cutoff],
  );
  const regDelta =
    prevRegs.length > 0
      ? Math.round(((totalRegs - prevRegs.length) / prevRegs.length) * 100)
      : totalRegs > 0
        ? 100
        : 0;

  return (
    <div className="page pb-20">
      <div className="container">
        <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Organizer
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">Analytics</h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              Reach, conversion, and revenue across your events
            </p>
          </div>
          <div className="flex gap-1 rounded-xl border border-[var(--border-subtle)] p-1">
            {(["7d", "30d", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  range === r
                    ? "bg-white text-black"
                    : "text-[var(--text-tertiary)] hover:text-white"
                }`}
              >
                {r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "All time"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center text-sm text-[var(--text-tertiary)]">
            Loading analytics…
          </div>
        ) : myEvents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center">
            <TrendingUp className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
            <h3 className="mt-3 text-lg font-semibold">No data yet</h3>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              Create an event and start getting registrations to see analytics.
            </p>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPI
                label="Registrations"
                value={totalRegs.toString()}
                delta={regDelta}
                icon={Users}
                color="emerald"
              />
              <KPI
                label="Revenue"
                value={`₨ ${totalRevenue.toLocaleString()}`}
                icon={Banknote}
                color="violet"
              />
              <KPI
                label="Avg ticket"
                value={`₨ ${Math.round(avgTicketPrice).toLocaleString()}`}
                icon={Sparkles}
                color="amber"
              />
              <KPI
                label="Active events"
                value={eventCount.toString()}
                icon={Calendar}
                color="blue"
              />
            </div>

            {/* Daily chart */}
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 lg:col-span-2">
                <h3 className="text-sm font-medium">Registrations over time</h3>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Last {range === "all" ? "60" : range === "7d" ? "7" : "30"} days
                </p>
                <div className="mt-6 flex h-48 items-end gap-0.5">
                  {daily.map((d, i) => {
                    const h = (d.registrations / maxRegs) * 100;
                    return (
                      <div
                        key={d.date}
                        title={`${d.date} · ${d.registrations} reg`}
                        className="group flex-1 cursor-pointer"
                      >
                        <div className="relative h-full w-full">
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded-t bg-gradient-to-t from-accent-500/40 to-accent-500 transition-all group-hover:from-accent-500/60 group-hover:to-accent-400"
                            style={{ height: `${h}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span>{daily[0]?.date.slice(5)}</span>
                  <span>{daily[Math.floor(daily.length / 2)]?.date.slice(5)}</span>
                  <span>{daily[daily.length - 1]?.date.slice(5)}</span>
                </div>
              </div>

              {/* Top events */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                <h3 className="text-sm font-medium">Top events by revenue</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Best performers</p>
                {topEvents.length === 0 ? (
                  <div className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
                    No registrations yet
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {topEvents.map((e, idx) => (
                      <li key={e.id} className="flex items-center gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-500/15 text-xs font-bold text-accent-300">
                          {idx + 1}
                        </span>
                        {e.image ? (
                          <img src={e.image} className="h-9 w-9 shrink-0 rounded-lg object-cover" alt="" />
                        ) : (
                          <div className="h-9 w-9 shrink-0 rounded-lg bg-[var(--bg-elevated)]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{e.title}</div>
                          <div className="text-[10px] text-[var(--text-tertiary)]">
                            {e.count} reg · ₨ {e.revenue.toLocaleString()}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Audience insights */}
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                <h3 className="text-sm font-medium">Cities you reach</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Where your attendees come from</p>
                <ul className="mt-4 space-y-2">
                  {topCities(myEvents, filtered).map((c) => (
                    <li key={c.city} className="flex items-center gap-3 text-sm">
                      <Globe className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                      <span className="flex-1">{c.city}</span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {c.count} reg
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                <h3 className="text-sm font-medium">Quick tips</h3>
                <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pink-400" />
                    <span>Add cover images — events with images get 3x more clicks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-400" />
                    <span>Featured events appear at the top of the homepage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>Publish 7+ days early to maximize registration window</span>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  delta,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  delta?: number;
  icon: any;
  color: "emerald" | "violet" | "amber" | "blue";
}) {
  const colorClass = {
    emerald: "text-emerald-400 bg-emerald-500/15",
    violet: "text-violet-400 bg-violet-500/15",
    amber: "text-amber-400 bg-amber-500/15",
    blue: "text-blue-400 bg-blue-500/15",
  }[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
        <div className={`grid h-7 w-7 place-items-center rounded-lg ${colorClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {delta !== undefined && delta !== 0 && (
        <div
          className={`mt-1 flex items-center gap-1 text-xs ${
            delta > 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {delta > 0 ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {Math.abs(delta)}% vs previous period
        </div>
      )}
    </motion.div>
  );
}

function topCities(events: any[], regs: any[]): { city: string; count: number }[] {
  // count regs by event's city (since attendee city isn't always stored)
  const map: Record<string, number> = {};
  const eventCity: Record<string, string> = {};
  events.forEach((e) => {
    if (e.city) eventCity[e.id] = e.city;
  });
  regs.forEach((r) => {
    const c = eventCity[r.event_id] || "Unknown";
    map[c] = (map[c] ?? 0) + 1;
  });
  return Object.entries(map)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
