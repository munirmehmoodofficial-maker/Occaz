import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  Ticket,
  LogOut,
  Tag,
  Users,
  Building2,
  Star,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  MessageSquare,
  Flag,
  CreditCard,
  Mail,
  BellRing,
  TicketPercent,
  Shield,
  Database,
  Plug,
  LifeBuoy,
  Palette,
  Globe,
  MapPin,
  Activity,
  Inbox,
  Receipt,
  Menu,
  X,
  Crown,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../lib/auth";
import "./admin.css";

const groups = [
  {
    title: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, end: true },
      { to: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
    ],
  },
  {
    title: "Content",
    items: [
      { to: "/admin/events", label: "Events", Icon: Calendar },
      { to: "/admin/opportunities", label: "Opportunities", Icon: Briefcase },
      { to: "/admin/categories", label: "Categories", Icon: Tag },
      { to: "/admin/featured", label: "Featured", Icon: Star },
      { to: "/admin/homepage", label: "Homepage", Icon: Palette },
    ],
  },
  {
    title: "Community",
    items: [
      { to: "/admin/users", label: "Users", Icon: Users },
      { to: "/admin/organizers", label: "Organizers", Icon: Building2 },
      { to: "/admin/organizer-verifications", label: "Verifications", Icon: ShieldCheck },
      { to: "/admin/organizer-features", label: "Organizer Features", Icon: Crown },
      { to: "/admin/registrations", label: "Registrations", Icon: Inbox },
      { to: "/admin/roles", label: "Roles & Permissions", Icon: Shield },
    ],
  },
  {
    title: "Engagement",
    items: [
      { to: "/admin/tickets", label: "Tickets", Icon: Ticket },
      { to: "/admin/reviews", label: "Reviews", Icon: MessageSquare },
      { to: "/admin/notifications", label: "Notifications", Icon: BellRing },
      { to: "/admin/email", label: "Email Campaigns", Icon: Mail },
      { to: "/admin/coupons", label: "Coupons", Icon: TicketPercent },
    ],
  },
  {
    title: "Moderation",
    items: [
      { to: "/admin/reports", label: "Reports", Icon: Flag },
      { to: "/admin/activity", label: "Audit Log", Icon: Activity },
      { to: "/admin/support", label: "Support", Icon: LifeBuoy },
    ],
  },
  {
    title: "Finance",
    items: [
      { to: "/admin/payouts", label: "Payouts", Icon: CreditCard },
      { to: "/admin/revenue", label: "Revenue", Icon: BarChart3 },
    ],
  },
  {
    title: "System",
    items: [
      { to: "/admin/integrations", label: "Integrations", Icon: Plug },
      { to: "/admin/domains", label: "Domains & SEO", Icon: Globe },
      { to: "/admin/cities", label: "Cities & Locations", Icon: MapPin },
      { to: "/admin/payment-settings", label: "Payment Settings", Icon: CreditCard },
      { to: "/admin/payment-submissions", label: "Payment Submissions", Icon: Inbox },
      { to: "/admin/plan-payments", label: "Plan Payments", Icon: Receipt },
      { to: "/admin/backup", label: "Backup & Data", Icon: Database },
      { to: "/admin/settings", label: "Settings", Icon: Settings },
    ],
  },
];

export function AdminLayout() {
  const { theme, toggle } = useTheme();
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-[var(--bg-elevated)]">
      <div className="flex h-[var(--header-h)] items-center gap-2.5 px-6 border-b border-[var(--border-subtle)]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent-500 to-pink-500"
        >
          <span className="text-sm font-bold text-[var(--text-primary)]">O</span>
        </motion.div>
        <div className="flex-1">
          <div className="text-sm font-bold text-[var(--text-primary)]">Occaz Admin</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            Console
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="md:hidden grid h-8 w-8 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {groups.map((group, gi) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: gi * 0.05 }}
          >
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-accent-500/15 text-[var(--text-primary)] ring-1 ring-accent-500/30"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]",
                    )
                  }
                >
                  <n.Icon className="h-4 w-4" />
                  {n.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        ))}
      </nav>
      <div className="border-t border-[var(--border-subtle)] p-3">
        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
        >
          <ChevronDown className="h-4 w-4 -rotate-90" />
          Back to site
        </NavLink>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] md:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-[var(--header-h)] items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-4 md:px-6 backdrop-blur-xl">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="md:hidden grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] transition hover:text-[var(--text-primary)]"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex-1 max-w-xl">
            <div className="flex items-center gap-3 rounded-full bg-[var(--bg-card)] px-4 py-2 ring-1 ring-[var(--border-subtle)]">
              <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
              <input
                placeholder="Search anything..."
                className="flex-1 bg-transparent text-sm placeholder:text-[var(--text-tertiary)] outline-none"
              />
              <span className="hidden sm:inline-flex items-center gap-0.5 rounded-md bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
                <kbd>⌘</kbd>
                <kbd>K</kbd>
              </span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.92, rotate: 15 }}
            whileHover={{ scale: 1.05 }}
            onClick={toggle}
            aria-label="Toggle theme"
            className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] transition hover:text-[var(--text-primary)]"
          >
            <motion.span
              key={theme}
              initial={{ y: 20, opacity: 0, rotate: -45 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 grid place-items-center"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.span>
          </motion.button>

          <button className="relative grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] hover:text-[var(--text-primary)]">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pink-500" />
          </button>
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-semibold text-white ring-1 ring-[var(--border-default)]">
              {(profile?.full_name || user?.email || "A").slice(0, 1).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-medium text-[var(--text-primary)]">
                {profile?.full_name || "Admin"}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)]">
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] transition hover:bg-red-500/10 hover:text-red-400"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
