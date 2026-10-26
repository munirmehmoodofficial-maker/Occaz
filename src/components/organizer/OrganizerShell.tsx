import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  ScanLine,
  Wallet,
  BarChart3,
  Megaphone,
  Building2,
  CreditCard,
  Users,
  HelpCircle,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
  Bell,
  Search,
  Sun,
  Moon,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useTheme } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import clsx from "clsx";

type NavItem = {
  to: string;
  label: string;
  Icon: any;
  badge?: "soon" | null;
};

const NAV: NavItem[] = [
  { to: "/organizer", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/organizer/events", label: "My Events", Icon: CalendarDays },
  { to: "/organizer/orders", label: "Tickets & Orders", Icon: Ticket },
  { to: "/organizer/check-in", label: "Check-in", Icon: ScanLine },
  { to: "/organizer/finance", label: "Finance & Payouts", Icon: Wallet },
  { to: "/organizer/analytics", label: "Analytics", Icon: BarChart3 },
  { to: "/organizer/marketing", label: "Marketing", Icon: Megaphone },
  { to: "/organizer/profile", label: "Organizer Profile", Icon: Building2 },
  { to: "/organizer/subscription", label: "Subscription", Icon: CreditCard },
  { to: "/organizer/team", label: "Team & Staff", Icon: Users, badge: "soon" },
  { to: "/organizer/support", label: "Support", Icon: HelpCircle },
  { to: "/organizer/settings", label: "Settings", Icon: Settings },
];

/**
 * OrganizerShell — the dark sidebar + content layout for /organizer/*
 * All 12 sections live inside this shell.
 */
export function OrganizerShell() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Helper: section label for the current route (for the topbar)
  const currentSection = (() => {
    const path = location.pathname;
    const item = NAV.find(
      (n) => n.to === path || (n.to !== "/organizer" && path.startsWith(n.to)),
    );
    return item?.label ?? "Dashboard";
  })();

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      // ignore
    }
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          // z-[65]: above the app BottomNav (z-[60]) so the drawer and its
          // backdrop are not cut off by the bottom navigation bar.
          className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          // z-[70] (not z-50): the app BottomNav is z-[60] and is fixed to the
          // bottom of the viewport, so a lower-z drawer gets its last items
          // ("Settings", the profile chip) covered on mobile.
          "fixed inset-y-0 left-0 z-[70] flex flex-col border-r border-white/5 bg-[#0b0b14] text-zinc-200 transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:z-auto",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
          <Link to="/organizer" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-pink-500 to-accent-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <div className="text-sm font-bold text-white">Occaz</div>
                <div className="text-[10px] text-zinc-500">Organizer Hub</div>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-white/5 hover:text-white lg:flex"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <ChevronLeft
              className={clsx("h-4 w-4 transition", collapsed && "rotate-180")}
            />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav — min-h-0 lets this actually shrink so overflow-y-auto works
            (flex items default to min-height:auto and would push the footer
            out of the drawer instead of scrolling). */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3 pb-20 lg:pb-3">
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const isActive =
                item.to === "/organizer"
                  ? location.pathname === "/organizer" ||
                    location.pathname === "/organizer/"
                  : location.pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/organizer"}
                    className={clsx(
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                      isActive
                        ? "bg-white/10 font-semibold text-white"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.Icon
                      className={clsx(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-pink-400" : "text-zinc-500 group-hover:text-zinc-300",
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge === "soon" && (
                          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                            Soon
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer: user card + sign out */}
        <div className="border-t border-white/5 p-3">
          {!collapsed ? (
            <div className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-accent-500 text-xs font-bold text-white">
                  {(profile?.full_name ?? user?.email ?? "O").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-white">
                    {profile?.full_name ?? user?.email?.split("@")[0]}
                  </div>
                  <div className="truncate text-[10px] text-zinc-500">
                    {user?.email}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-red-500/15 hover:text-red-300"
              >
                <LogOut className="h-3 w-3" /> Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignOut}
              className="grid h-10 w-full place-items-center rounded-lg text-zinc-500 hover:bg-red-500/15 hover:text-red-400"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      {/* min-w-0: without it this flex item keeps its intrinsic width, so a
          wide table (e.g. Tickets & Orders) pushes the whole organizer area
          into a sideways scroll instead of scrolling inside its own
          overflow-x-auto container. */}
      <main className="min-w-0 flex-1 lg:ml-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/5 bg-[#0b0b14]/80 px-4 backdrop-blur lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Organizer Hub
            </div>
            <h1 className="truncate text-base font-bold text-white">
              {currentSection}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
              title="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              onClick={toggle}
              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="px-4 py-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
