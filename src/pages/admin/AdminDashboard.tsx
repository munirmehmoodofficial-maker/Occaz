import {
  TrendingUp,
  Calendar,
  Ticket,
  Users,
  DollarSign,
  ArrowUpRight,
  Eye,
  Heart,
  UserCheck,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDataStore } from "../../data/store";
import { Badge } from "../../components/ui/Badge";

const pendingRegistrations = [
  {
    id: "r1",
    name: "Sana Malik",
    email: "sana@gmail.com",
    role: "Organizer",
    org: "Karachi Arts Council",
    when: "12m ago",
  },
  {
    id: "r2",
    name: "James O'Connor",
    email: "james@trinity.edu",
    role: "User",
    when: "1h ago",
  },
  {
    id: "r3",
    name: "Aiko Tanaka",
    email: "aiko@tanaka.io",
    role: "Organizer",
    org: "Tokyo Tech Meetup",
    when: "3h ago",
  },
  {
    id: "r4",
    name: "Léa Bernard",
    email: "lea@bernard.fr",
    role: "User",
    when: "5h ago",
  },
];

function Stat({
  label,
  value,
  delta,
  Icon,
  tone = "accent",
  index = 0,
}: {
  label: string;
  value: string;
  delta: string;
  Icon: any;
  tone?: string;
  index?: number;
}) {
  const tones: Record<string, string> = {
    accent: "from-accent-500/20 to-pink-500/10 ring-accent-500/30 text-accent-400",
    cyan: "from-cyan-500/20 to-blue-500/10 ring-cyan-500/30 text-cyan-400",
    emerald: "from-emerald-500/20 to-cyan-500/10 ring-emerald-500/30 text-emerald-400",
    amber: "from-amber-500/20 to-pink-500/10 ring-amber-500/30 text-amber-400",
    pink: "from-pink-500/20 to-accent-500/10 ring-pink-500/30 text-pink-400",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)] transition-shadow hover:shadow-[var(--shadow-md)]"
    >
      <div className="flex items-center justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br ring-1 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
          <ArrowUpRight className="h-3 w-3" />
          {delta}
        </span>
      </div>
      <div className="mt-4 text-3xl font-bold text-[var(--text-primary)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--text-tertiary)]">{label}</div>
    </motion.div>
  );
}

export function AdminDashboard() {
  const { events, opportunities } = useDataStore();
  const totalEvents = events.length;
  const totalOpps = opportunities.length;
  const totalAttendees = events.reduce((sum, e) => sum + e.attendees, 0);
  const revenue = events.reduce((sum, e) => sum + e.attendees * e.price, 0);
  const totalUsers = 12_408;
  const totalOrganizers = 248;
  const pending = pendingRegistrations.length;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-[var(--text-primary)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Welcome back, Marcus. Here's what's happening today.
        </p>
      </motion.div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total events" value={String(totalEvents)} delta="+12%" Icon={Calendar} tone="accent" index={0} />
        <Stat label="Opportunities" value={String(totalOpps)} delta="+8%" Icon={TrendingUp} tone="cyan" index={1} />
        <Stat label="Tickets sold" value={totalAttendees.toLocaleString()} delta="+24%" Icon={Ticket} tone="emerald" index={2} />
        <Stat
          label="Revenue"
          value={`₨ ${(revenue / 1000).toFixed(0)}k`}
          delta="+18%"
          Icon={DollarSign}
          tone="amber"
          index={3}
        />
      </div>

      {/* User metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-pink-500/20 to-accent-500/10 ring-1 ring-pink-500/30 text-pink-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-[var(--text-tertiary)]">Total users</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {totalUsers.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-[var(--text-tertiary)]">+184 this week</span>
            <Link to="/admin/users" className="text-accent-400 hover:underline">
              View all →
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-accent-500/20 to-cyan-500/10 ring-1 ring-accent-500/30 text-accent-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-[var(--text-tertiary)]">Verified organizers</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {totalOrganizers}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-[var(--text-tertiary)]">+6 this month</span>
            <Link to="/admin/organizers" className="text-accent-400 hover:underline">
              Manage →
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl bg-gradient-to-br from-amber-500/15 to-pink-500/10 p-5 ring-1 ring-amber-500/30"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/20 ring-1 ring-amber-500/40 text-amber-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-[var(--text-tertiary)]">Pending approvals</div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{pending}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-amber-300">Action required</span>
            <Link to="/admin/users" className="text-amber-300 hover:underline">
              Review →
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)] lg:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Ticket sales</h2>
              <p className="text-xs text-[var(--text-tertiary)]">Last 30 days</p>
            </div>
            <select className="rounded-lg bg-[var(--bg-elevated)] px-3 py-1.5 text-sm ring-1 ring-[var(--border-default)] outline-none">
              <option className="bg-[var(--bg-card)]">Last 30 days</option>
              <option className="bg-[var(--bg-card)]">Last 90 days</option>
              <option className="bg-[var(--bg-card)]">This year</option>
            </select>
          </div>
          <Chart />
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
        >
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Recent activity</h2>
          <ul className="mt-4 space-y-3.5">
            {[
              { Icon: Ticket, text: "New ticket sale — Aurora Live", time: "2m ago" },
              { Icon: Heart, text: "Aisha saved “Hamlet Reimagined”", time: "8m ago" },
              { Icon: Eye, text: "Opportunity “Rhodes Scholarship” viewed 1.2k times", time: "24m ago" },
              { Icon: UserPlus, text: "Sana Malik requested organizer access", time: "12m ago" },
              { Icon: Calendar, text: "Event “DevConf 2026” published", time: "3h ago" },
            ].map((a, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--bg-card-hover)] ring-1 ring-[var(--border-default)]">
                  <a.Icon className="h-4 w-4 text-accent-400" />
                </div>
                <div className="flex-1 text-sm">
                  <p className="text-[var(--text-primary)]">{a.text}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{a.time}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Pending approvals */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Pending registrations
              </h2>
              <Badge tone="amber">{pending}</Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Approve or reject new accounts
            </p>
          </div>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1 text-sm text-accent-400 hover:underline"
          >
            See all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {pendingRegistrations.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-accent-500 to-pink-500 text-sm font-semibold text-white">
                  {r.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    {r.name}
                    <Badge tone={r.role === "Organizer" ? "accent" : "blue"}>
                      {r.role}
                    </Badge>
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {r.email}
                    {r.org && ` · ${r.org}`}
                    {" · "}
                    {r.when}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <button className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/25">
                  Approve
                </button>
                <button className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 ring-1 ring-red-500/30 transition hover:bg-red-500/20">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top events table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Top performing events</h2>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Sorted by attendance</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-6 py-3 font-medium">Event</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Tickets</th>
                <th className="px-6 py-3 font-medium">Revenue</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...events]
                .sort((a, b) => b.attendees - a.attendees)
                .slice(0, 6)
                .map((e, i) => (
                  <motion.tr
                    key={e.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.04 }}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <img src={e.image} className="h-9 w-9 rounded-lg object-cover" />
                        <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[var(--text-secondary)]">{e.category}</td>
                    <td className="px-6 py-3 text-[var(--text-secondary)]">{e.date}</td>
                    <td className="px-6 py-3 text-[var(--text-secondary)]">
                      {e.attendees.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-[var(--text-secondary)]">
                      ${(e.attendees * e.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400 ring-1 ring-emerald-500/30">
                        Published
                      </span>
                    </td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

function Chart() {
  const bars = [42, 58, 38, 70, 52, 88, 64, 78, 92, 68, 82, 95, 72, 88, 102, 85, 92, 110, 78, 95];
  const max = Math.max(...bars);
  return (
    <div className="mt-6">
      <div className="flex h-48 items-end gap-1.5">
        {bars.map((b, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(b / max) * 100}%` }}
            transition={{ delay: 0.3 + i * 0.02, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 rounded-t-md bg-gradient-to-t from-accent-500/40 to-accent-500 transition-all hover:from-accent-400 hover:to-pink-500"
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-[var(--text-tertiary)]">
        <span>Aug 25</span>
        <span>Sep 8</span>
        <span>Sep 22</span>
      </div>
    </div>
  );
}
