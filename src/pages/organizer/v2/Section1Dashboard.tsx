import { motion } from "framer-motion";
import { LayoutDashboard, Sparkles, TrendingUp, Users, Ticket, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../lib/toast";

/**
 * Section 1 — Dashboard / Overview
 *
 * Real metrics from Supabase:
 *  - events table (count by status)
 *  - registrations table (count, revenue)
 *  - organizer_profiles (verification status)
 *  - profiles (subscription plan)
 */
export function Section1Dashboard() {
  const { user, profile } = useAuth();
  const { push } = useToast();
  const [stats, setStats] = useState({
    totalEvents: 0,
    published: 0,
    draft: 0,
    past: 0,
    upcoming: 0,
    ticketsSold: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        // Events by status.
        // NOTE: the `events` table has NO `status` column — only `published`.
        // Selecting a non-existent column makes PostgREST error out, which
        // silently returned null data and showed "0 events".
        const { data: events, error: eventsErr } = await supabase
          .from("events")
          .select("id, title, date, published")
          .eq("organizer_id", user.id)
          .order("date", { ascending: true });
        if (eventsErr) {
          console.error("[Dashboard] events query failed:", eventsErr.message);
          push({
            tone: "red",
            title: "Couldn't load your events",
            message: eventsErr.message,
          });
        }
        const today = new Date().toISOString().slice(0, 10);
        const evs = events ?? [];
        const upcoming = evs.filter(
          (e: any) => e.date >= today && (e.published ?? true),
        );
        const past = evs.filter((e: any) => e.date < today);

        // Registrations (orders)
        const { data: regs, error: regsErr } = await supabase
          .from("registrations")
          .select("id, total, payment_status, status, created_at, event_id, attendee_name, ticket_code")
          .eq("organizer_id", user.id)
          .order("created_at", { ascending: false });
        if (regsErr) {
          console.error("[Dashboard] registrations query failed:", regsErr.message);
        }
        const rs = regs ?? [];
        const ticketsSold = rs.filter(
          (r: any) => r.status === "confirmed" || !r.status,
        ).length;
        const totalRevenue = rs
          .filter((r: any) => r.payment_status === "paid")
          .reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);
        const pendingOrders = rs.filter(
          (r: any) => r.payment_status === "pending",
        ).length;

        setStats({
          totalEvents: evs.length,
          published: evs.filter((e: any) => e.published ?? true).length,
          draft: evs.filter((e: any) => !(e.published ?? true)).length,
          past: past.length,
          upcoming: upcoming.length,
          ticketsSold,
          totalRevenue,
          pendingOrders,
        });
        setRecentOrders(rs.slice(0, 6));
        setUpcomingEvents(upcoming.slice(0, 4));
      } catch (e) {
        // best effort
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const planLabel = (() => {
    if (profile?.role === "admin") return "Admin";
    if (profile?.is_organizer) return "Organizer";
    return "Member";
  })();

  return (
    <div className="space-y-6">
      {/* Hero / Greeting */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-pink-500/10 via-accent-500/5 to-transparent p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-pink-300">
              {planLabel} · {profile?.full_name ?? user?.email?.split("@")[0]}
            </div>
            <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">
              Welcome back to your control centre
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Here's what's happening across your events, orders, and audience.
            </p>
          </div>
          <Link
            to="/organizer/events"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:opacity-90 active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" /> Create event
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          Icon={Calendar}
          label="Total events"
          value={stats.totalEvents}
          sub={`${stats.published} live · ${stats.draft} draft`}
          tone="violet"
        />
        <Kpi
          Icon={Ticket}
          label="Tickets sold"
          value={stats.ticketsSold}
          sub={stats.pendingOrders ? `${stats.pendingOrders} pending` : "All confirmed"}
          tone="emerald"
        />
        <Kpi
          Icon={TrendingUp}
          label="Total revenue"
          value={`₨ ${stats.totalRevenue.toLocaleString()}`}
          sub="Net of all paid orders"
          tone="pink"
        />
        <Kpi
          Icon={LayoutDashboard}
          label="Upcoming"
          value={stats.upcoming}
          sub={`${stats.past} past`}
          tone="amber"
        />
      </div>

      {/* Two-column: Upcoming events + Recent orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming events */}
        <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Upcoming events</h3>
            <Link
              to="/organizer/events"
              className="text-xs font-medium text-pink-300 hover:underline"
            >
              Manage all →
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="text-sm text-zinc-500">Loading…</div>
            ) : upcomingEvents.length === 0 ? (
              <EmptyHint
                Icon={Calendar}
                title="No upcoming events"
                body="Create your first event to start selling tickets."
                cta="Create event"
                to="/organizer/events"
              />
            ) : (
              upcomingEvents.map((e: any) => (
                <Link
                  key={e.id}
                  to={`/organizer/events`}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition hover:border-pink-500/30 hover:bg-white/5"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-pink-500/15 text-pink-300">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">
                      {e.title}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {e.date ? new Date(e.date).toLocaleDateString() : "—"}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent orders</h3>
            <Link
              to="/organizer/orders"
              className="text-xs font-medium text-pink-300 hover:underline"
            >
              All →
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="text-sm text-zinc-500">Loading…</div>
            ) : recentOrders.length === 0 ? (
              <EmptyHint
                Icon={Users}
                title="No orders yet"
                body="When attendees register, you'll see them here."
              />
            ) : (
              recentOrders.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">
                    <Ticket className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">
                      {r.attendee_name ?? "—"}
                    </div>
                    <div className="truncate text-xs text-zinc-500">
                      {r.ticket_code ?? "—"} ·{" "}
                      {Number(r.total ?? 0) === 0
                        ? "Free"
                        : `₨ ${Number(r.total ?? 0).toLocaleString()}`}
                    </div>
                  </div>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                      (r.payment_status === "paid"
                        ? Number(r.total ?? 0) === 0
                          ? "bg-cyan-500/15 text-cyan-300"
                          : "bg-emerald-500/15 text-emerald-300"
                        : r.payment_status === "pending"
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-zinc-500/15 text-zinc-300")
                    }
                  >
                    {Number(r.total ?? 0) === 0 && r.payment_status === "paid"
                      ? "Free"
                      : (r.payment_status ?? "paid")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  Icon,
  label,
  value,
  sub,
  tone,
}: {
  Icon: any;
  label: string;
  value: number | string;
  sub?: string;
  tone: "violet" | "emerald" | "pink" | "amber";
}) {
  const tones: Record<string, string> = {
    violet: "from-violet-500/20 to-violet-500/0 text-violet-300",
    emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-300",
    pink: "from-pink-500/20 to-pink-500/0 text-pink-300",
    amber: "from-amber-500/20 to-amber-500/0 text-amber-300",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-[var(--bg-card)] p-4"
    >
      <div
        className={
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50 " + tones[tone]
        }
      />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </div>
          <div className="mt-1 text-2xl font-bold text-white">{value}</div>
          {sub && (
            <div className="mt-0.5 text-[10px] text-zinc-500">{sub}</div>
          )}
        </div>
        <div
          className={
            "grid h-9 w-9 place-items-center rounded-xl bg-white/5 " +
            tones[tone].split(" ").pop()
          }
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

function EmptyHint({
  Icon,
  title,
  body,
  cta,
  to,
}: {
  Icon: any;
  title: string;
  body: string;
  cta?: string;
  to?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
      <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-zinc-500">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <p className="mt-1 text-xs text-zinc-500">{body}</p>
      {cta && to && (
        <Link
          to={to}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-pink-500/15 px-3 py-1.5 text-xs font-semibold text-pink-300 hover:bg-pink-500/25"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}
