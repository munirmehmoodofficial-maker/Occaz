import { BarChart3, Eye, MousePointerClick, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

/**
 * Section 6 — Analytics & Reports
 * Page views (from event_views) + conversions + best events.
 */
export function Section6Analytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    views: 0,
    conversions: 0,
    revenue: 0,
    bestEvent: null as null | any,
  });
  const [perEvent, setPerEvent] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: views } = await supabase
        .from("event_views")
        .select("id, event_id")
        .eq("organizer_id", user.id);
      const { data: regs } = await supabase
        .from("registrations")
        .select("id, total, event_id, payment_status")
        .eq("organizer_id", user.id);
      const viewList = views ?? [];
      const regList = regs ?? [];
      const viewsCount = viewList.length;
      const confirmed = regList.filter(
        (r: any) => r.payment_status === "paid" || !r.payment_status,
      ).length;
      const revenue = regList.reduce(
        (s: number, r: any) =>
          r.payment_status === "paid" ? s + Number(r.total ?? 0) : s,
        0,
      );
      const conv = viewsCount > 0 ? (confirmed / viewsCount) * 100 : 0;

      // group views per event
      const viewByEvent: Record<string, number> = {};
      viewList.forEach((v: any) => {
        viewByEvent[v.event_id] = (viewByEvent[v.event_id] ?? 0) + 1;
      });
      const regByEvent: Record<string, { count: number; revenue: number }> = {};
      regList.forEach((r: any) => {
        const e = regByEvent[r.event_id] ?? { count: 0, revenue: 0 };
        e.count += 1;
        if (r.payment_status === "paid") e.revenue += Number(r.total ?? 0);
        regByEvent[r.event_id] = e;
      });
      const ids = Array.from(new Set([...Object.keys(viewByEvent), ...Object.keys(regByEvent)]));
      const { data: evs } = await supabase
        .from("events")
        .select("id, title, image")
        .eq("organizer_id", user.id)
        .in("id", ids.length ? ids : ["_"]);
      const evMap: Record<string, any> = {};
      (evs ?? []).forEach((e) => (evMap[e.id] = e));
      const rows = ids.map((id) => ({
        id,
        title: evMap[id]?.title ?? id,
        image: evMap[id]?.image,
        views: viewByEvent[id] ?? 0,
        sales: regByEvent[id]?.count ?? 0,
        revenue: regByEvent[id]?.revenue ?? 0,
      }));
      rows.sort((a, b) => b.revenue - a.revenue);
      setPerEvent(rows);
      setStats({
        views: viewsCount,
        conversions: Math.round(conv * 10) / 10,
        revenue,
        bestEvent: rows[0] ?? null,
      });
    })();
  }, [user]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Analytics & reports</h2>
        <p className="text-xs text-zinc-500">
          Page views, conversions, and best-performing events
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat Icon={Eye} label="Page views" value={stats.views} sub="All events" tone="violet" />
        <Stat
          Icon={MousePointerClick}
          label="Conversion"
          value={`${stats.conversions}%`}
          sub="Views → paid"
          tone="emerald"
        />
        <Stat
          Icon={TrendingUp}
          label="Revenue"
          value={`₨ ${stats.revenue.toLocaleString()}`}
          sub="Paid orders"
          tone="pink"
        />
        <Stat
          Icon={BarChart3}
          label="Top event"
          value={stats.bestEvent?.title ?? "—"}
          sub={
            stats.bestEvent
              ? `₨ ${stats.bestEvent.revenue.toLocaleString()}`
              : "No data"
          }
          tone="amber"
        />
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <h3 className="text-sm font-bold text-white">Per-event performance</h3>
        {perEvent.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-500">
            No analytics yet. Once people view or buy tickets, you'll see the breakdown here.
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {perEvent.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3"
              >
                <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-zinc-900">
                  {r.image ? (
                    <img src={r.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-zinc-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {r.title}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {r.views} views · {r.sales} sales
                  </div>
                </div>
                <div className="text-sm font-semibold text-white">
                  ₨ {r.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ Icon, label, value, sub, tone }: any) {
  const tones: Record<string, string> = {
    violet: "from-violet-500/20 text-violet-300",
    emerald: "from-emerald-500/20 text-emerald-300",
    pink: "from-pink-500/20 text-pink-300",
    amber: "from-amber-500/20 text-amber-300",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[var(--bg-card)] p-4">
      <div className={"pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50 " + tones[tone]} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </div>
          <div className="mt-1 text-2xl font-bold text-white">{value}</div>
          {sub && <div className="mt-0.5 text-[10px] text-zinc-500">{sub}</div>}
        </div>
        <div className={"grid h-9 w-9 place-items-center rounded-xl bg-white/5 " + tones[tone].split(" ").pop()}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
