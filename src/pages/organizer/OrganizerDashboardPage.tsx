import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Crown,
  Sparkles,
  Building2,
  Calendar,
  Users,
  TrendingUp,
  ArrowUpRight,
  CreditCard,
  Settings,
  Plus,
  ExternalLink,
  BarChart3,
  Megaphone,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../lib/auth";
import { useSubscription } from "../../hooks/useSubscription";
import { useEvents } from "../../hooks/useListings";
import { supabase } from "../../lib/supabase";
import { formatPrice } from "../../data/mock";
import clsx from "clsx";

export function OrganizerDashboardPage() {
  const auth = useAuth();
  const user = auth.user;
  const profile = auth.profile;
  const isAdmin = Boolean(auth.isAdmin);
  const { plan, planId, subscription, organizerProfile, can } = useSubscription();
  const events = useEvents();
  const [stats, setStats] = useState<{
    published: number;
    totalRegistrations: number;
    upcomingThisMonth: number;
  } | null>(null);

  // events that belong to this organizer (by organizer name match)
  const myOrgName = organizerProfile?.name ?? profile?.full_name ?? "";
  const myEvents = events.filter((e) =>
    myOrgName ? e.organizer === myOrgName : false,
  );
  const publishedCount = myEvents.filter((e) => e.published).length;
  const featuredCount = myEvents.filter((e) => e.featured).length;
  const monthlyLimit = isAdmin ? 9999 : plan.flags.maxEventsPerMonth;
  const remainingThisMonth = Math.max(0, monthlyLimit - publishedCount);

  // rough stats from tickets table
  useEffect(() => {
    if (!user) return;
    (async () => {
      const ids = myEvents.map((e) => e.id);
      if (ids.length === 0) {
        setStats({ published: publishedCount, totalRegistrations: 0, upcomingThisMonth: 0 });
        return;
      }
      const { data: tickets } = await supabase
        .from("registrations")
        .select("id, event_id")
        .in("event_id", ids);
      const totalRegistrations = tickets?.length ?? 0;
      const upcomingThisMonth = myEvents.filter((e) => {
        const d = new Date(e.date);
        const now = new Date();
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear() &&
          d >= now
        );
      }).length;
      setStats({ published: publishedCount, totalRegistrations, upcomingThisMonth });
    })();
  }, [user, myEvents, publishedCount]);

  if (!user) {
    return (
      <div className="page container text-center">
        <h1 className="text-2xl font-semibold">Sign in required</h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">
          Sign in to access the organizer dashboard.
        </p>
        <Link to="/login" className="mt-5 inline-block">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  const planColor =
    plan.id === "business"
      ? "from-violet-500/20 to-fuchsia-500/10 ring-violet-500/40"
      : plan.id === "pro"
        ? "from-accent-500/20 to-pink-500/10 ring-accent-500/40"
        : "from-[var(--bg-elevated)] to-[var(--bg-elevated)] ring-[var(--border-subtle)]";

  return (
    <div className="page pb-20">
      <div className="container">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Organizer
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              {organizerProfile?.name || profile?.full_name || "Your organizer hub"}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              {myEvents.length} event{myEvents.length === 1 ? "" : "s"} on Occaz
            </p>
          </div>
          <div className="flex gap-2">
            {organizerProfile?.slug && can("canCustomizeProfile") && (
              <a
                href={`/organizers/${organizerProfile.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                  View public page
                </Button>
              </a>
            )}
            <Link to="/admin/events">
              <Button leftIcon={<Plus className="h-3.5 w-3.5" />}>
                New event
              </Button>
            </Link>
          </div>
        </div>

        {/* Plan card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            "mb-6 rounded-2xl bg-gradient-to-br p-6 ring-1",
            planColor,
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
                {planId === null && <Sparkles className="h-5 w-5 text-[var(--text-tertiary)]" />}
                {plan.id === "pro" && <Crown className="h-5 w-5 text-accent-400" />}
                {plan.id === "business" && <Building2 className="h-5 w-5 text-violet-400" />}
              </div>
              <div>
                <div className="text-xs text-[var(--text-tertiary)]">Plan</div>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold">
                    {isAdmin
                      ? "Business (Admin)"
                      : planId === null
                        ? "No plan yet"
                        : plan.name}
                  </div>
                  {isAdmin && (
                    <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300 ring-1 ring-violet-500/30">
                      Full access
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-sm">
              <Mini label="Events this month" value={`${publishedCount} / ${monthlyLimit === 9999 ? "∞" : monthlyLimit}`} />
              <Mini
                label="Status"
                value={planId === null ? "no plan" : subscription?.status ?? "active"}
                tone={planId === null ? "warn" : subscription?.status === "active" ? "ok" : "warn"}
              />
              <Mini
                label="Renews"
                value={
                  subscription
                    ? new Date(subscription.current_period_end).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                      })
                    : "—"
                }
              />
            </div>
            <Link to="/organizer/billing">
              <Button variant="outline" size="sm">
                Manage plan
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Calendar className="h-4 w-4 text-accent-400" />}
            label="Published events"
            value={stats?.published ?? publishedCount}
            hint={`${remainingThisMonth === 0 && monthlyLimit < 9999 ? "Monthly limit reached" : `${remainingThisMonth} more this month`}`}
            warn={remainingThisMonth === 0 && monthlyLimit < 9999}
          />
          <StatCard
            icon={<Users className="h-4 w-4 text-emerald-400" />}
            label="Tickets sold"
            value={stats?.totalRegistrations ?? 0}
            hint={can("hasAudienceInsights") ? "Across all your events" : "Upgrade to Pro for insights"}
            locked={!can("hasAudienceInsights")}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4 text-violet-400" />}
            label="Featured events"
            value={featuredCount}
            hint={can("canFeature") ? "Boosting visibility" : "Pro feature"}
            locked={!can("canFeature")}
          />
          <StatCard
            icon={<CreditCard className="h-4 w-4 text-pink-400" />}
            label="Total revenue"
            value={formatPrice(
              (stats?.totalRegistrations ?? 0) *
                (myEvents.reduce((s, e) => s + e.price, 0) / Math.max(myEvents.length, 1)),
              "PKR",
            )}
            hint={can("hasAdvancedAnalytics") ? "Last 30 days" : "Pro+ for revenue splits"}
            locked={!can("hasAdvancedAnalytics")}
          />
        </div>

        {/* Quick links */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            to="/organizer/profile"
            icon={<Settings className="h-5 w-5 text-accent-400" />}
            title="Profile & branding"
            desc="Customize your public organizer page"
            locked={!can("canCustomizeProfile")}
            lockLabel="Pro"
          />
          <QuickLink
            to="/organizer/events"
            icon={<Calendar className="h-5 w-5 text-violet-400" />}
            title="My events"
            desc="All events you've published on Occaz"
          />
          <QuickLink
            to="/organizer/billing"
            icon={<CreditCard className="h-5 w-5 text-emerald-400" />}
            title="Billing & invoices"
            desc="Plan, payment history, receipts"
          />
          <QuickLink
            to="/organizer/analytics"
            icon={<BarChart3 className="h-5 w-5 text-amber-400" />}
            title="Analytics"
            desc="Reach, conversion, audience"
            locked={!can("hasAdvancedAnalytics") && !can("hasAudienceInsights")}
            lockLabel="Pro+"
          />
          <QuickLink
            to="/organizer/promote"
            icon={<Megaphone className="h-5 w-5 text-pink-400" />}
            title="Promote & coupons"
            desc="Boost events, issue promo codes"
            locked={!can("hasPromotionalTools")}
            lockLabel="Pro"
          />
          <QuickLink
            to="/admin/events"
            icon={<Plus className="h-5 w-5 text-[var(--text-tertiary)]" />}
            title="Create event"
            desc="Publish a new event to Occaz"
          />
        </div>

        {/* Recent events */}
        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent events</h2>
            <Link
              to="/admin/events"
              className="text-sm text-[var(--text-tertiary)] hover:text-white"
            >
              Manage in admin →
            </Link>
          </div>
          {myEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center">
              <p className="text-sm text-[var(--text-tertiary)]">
                You haven't published any events yet.
              </p>
              <Link to="/admin/events" className="mt-3 inline-block">
                <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                  Create your first event
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-elevated)] text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
                  <tr>
                    <th className="px-4 py-3 text-left">Event</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-center">Featured</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {myEvents.slice(0, 8).map((e) => (
                    <tr key={e.id} className="hover:bg-[var(--bg-card-hover)]">
                      <td className="px-4 py-3">
                        <Link
                          to={`/events/${e.id}`}
                          className="font-medium hover:text-accent-400"
                        >
                          {e.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {new Date(e.date).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={clsx(
                            "inline-flex rounded-full px-2 py-0.5 text-xs ring-1",
                            e.published
                              ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 ring-amber-500/30",
                          )}
                        >
                          {e.published ? "Live" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {e.price === 0 ? "Free" : formatPrice(e.price, e.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {e.featured ? (
                          <Sparkles className="mx-auto h-4 w-4 text-accent-400" />
                        ) : (
                          <span className="text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Empty upsell when no plan */}
        {planId === null && (
          <div className="mt-10 overflow-hidden rounded-3xl border border-accent-500/30 bg-gradient-to-br from-accent-500/15 via-pink-500/10 to-transparent p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent-300">
                  <Sparkles className="h-3.5 w-3.5" /> Upgrade
                </div>
                <h3 className="mt-1 text-2xl font-semibold">
                  You're getting started — unlock the rest
                </h3>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                  Upgrade to Pro to feature events, get audience insights, and customize
                  your organizer page. PKR 5,000/month.
                </p>
              </div>
              <Link to="/organizer/billing">
                <Button size="lg" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                  See plans
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  warn,
  locked,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  warn?: boolean;
  locked?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {hint && (
        <p
          className={clsx(
            "mt-1 text-xs",
            warn ? "text-amber-400" : "text-[var(--text-tertiary)]",
          )}
        >
          {hint}
          {locked && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-300 ring-1 ring-violet-500/30">
              <Lock className="h-2.5 w-2.5" /> {hint.includes("Pro") ? "Pro" : "Pro+"}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div>
      <div className="text-xs text-[var(--text-tertiary)]">{label}</div>
      <div
        className={clsx(
          "mt-0.5 font-semibold capitalize",
          tone === "ok" && "text-emerald-400",
          tone === "warn" && "text-amber-400",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  title,
  desc,
  locked,
  lockLabel,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  locked?: boolean;
  lockLabel?: string;
}) {
  const Wrapper: any = locked ? "div" : Link;
  const wrapperProps = locked ? {} : { to };
  return (
    <Wrapper
      {...wrapperProps}
      className={clsx(
        "group flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition",
        !locked && "hover:border-accent-500/40 hover:bg-[var(--bg-card-hover)]",
        locked && "opacity-70",
      )}
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--bg-elevated)]">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          {title}
          {locked && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-300 ring-1 ring-violet-500/30">
              <Lock className="h-2.5 w-2.5" /> {lockLabel ?? "Pro"}
            </span>
          )}
        </div>
        <div className="text-xs text-[var(--text-tertiary)]">{desc}</div>
      </div>
      {!locked && <ArrowUpRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-white" />}
    </Wrapper>
  );
}

function Lock({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
