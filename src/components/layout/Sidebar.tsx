import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Compass,
  Calendar,
  Briefcase,
  Ticket,
  Bookmark,
  User,
  Search,
  Settings,
  Sparkles,
  X,
  ChevronLeft,
  TrendingUp,
  Building2,
} from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const primary = [
  { to: "/", label: "Home", Icon: Home, end: true },
  { to: "/explore", label: "Explore", Icon: Compass },
  { to: "/events", label: "Events", Icon: Calendar },
  { to: "/opportunities", label: "Opportunities", Icon: Briefcase },
  { to: "/organizers", label: "Organizers", Icon: Building2 },
];

const personal = [
  { to: "/tickets", label: "Tickets", Icon: Ticket },
  { to: "/saved", label: "Saved", Icon: Bookmark },
  { to: "/profile", label: "Profile", Icon: User },
];

export function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const location = useLocation();

  const content = (
    <div
      className={clsx(
        "flex h-full flex-col bg-[var(--bg-elevated)]/60 backdrop-blur-xl transition-all duration-300",
        "border-r border-[var(--border-default)]",
      )}
    >
      {/* Brand */}
      <div className="flex h-[var(--header-h)] items-center justify-between border-b border-[var(--border-default)] px-4">
        <NavLink to="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-accent-500 to-pink-500">
            <span className="text-sm font-bold text-white">O</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="text-base font-bold tracking-tight whitespace-nowrap"
              >
                Occaz
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
        <button
          onClick={onToggleCollapsed}
          aria-label="Toggle sidebar"
          className="hidden lg:grid h-8 w-8 place-items-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
        >
          <ChevronLeft
            className={clsx(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180",
            )}
          />
        </button>
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          className="lg:hidden grid h-8 w-8 place-items-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search shortcut */}
      <div className="px-3 pt-3">
        <NavLink
          to="/search"
          className="group flex items-center gap-2.5 rounded-xl bg-[var(--bg-card)] px-3 py-2.5 text-sm ring-1 ring-[var(--border-subtle)] transition hover:ring-[var(--border-default)]"
        >
          <Search className="h-4 w-4 shrink-0 text-[var(--text-tertiary)] group-hover:text-accent-400" />
          {!collapsed && (
            <>
              <span className="text-[var(--text-secondary)]">Search</span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
                <kbd>⌘</kbd>
                <kbd>K</kbd>
              </span>
            </>
          )}
        </NavLink>
      </div>

      {/* Primary */}
      <div className="px-3 pt-4">
        {!collapsed && (
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Discover
          </div>
        )}
        <nav className="space-y-0.5">
          {primary.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={onClose}
              title={collapsed ? n.label : undefined}
              className={({ isActive }) =>
                clsx(
                  "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-accent-500/15 text-[var(--text-primary)] ring-1 ring-accent-500/30"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-gradient-to-b from-accent-400 to-pink-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <n.Icon
                    className={clsx(
                      "h-4 w-4 shrink-0",
                      isActive && "text-accent-400",
                    )}
                  />
                  {!collapsed && <span className="whitespace-nowrap">{n.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Personal */}
      <div className="px-3 pt-5">
        {!collapsed && (
          <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            You
          </div>
        )}
        <nav className="space-y-0.5">
          {personal.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={onClose}
              title={collapsed ? n.label : undefined}
              className={({ isActive }) =>
                clsx(
                  "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-accent-500/15 text-[var(--text-primary)] ring-1 ring-accent-500/30"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-gradient-to-b from-accent-400 to-pink-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <n.Icon
                    className={clsx(
                      "h-4 w-4 shrink-0",
                      isActive && "text-accent-400",
                    )}
                  />
                  {!collapsed && <span className="whitespace-nowrap">{n.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex-1" />

      {/* Upgrade card */}
      {!collapsed && (
        <div className="mx-3 mb-3 overflow-hidden rounded-xl bg-gradient-to-br from-accent-500/20 via-pink-500/15 to-cyan-500/15 p-4 ring-1 ring-[var(--border-default)]">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
            <span className="text-sm font-semibold leading-tight">
              Become an Organizer at Occaz. List on Occaz.
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
            Reach thousands of engaged attendees.
          </p>
          <NavLink
            to="/become-organizer"
            onClick={onClose}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Start listing
          </NavLink>
        </div>
      )}

      {/* Bottom */}
      <div className="border-t border-[var(--border-default)] p-3">
        <NavLink
          to="/profile"
          onClick={onClose}
          title={collapsed ? "Settings" : undefined}
          className={clsx(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]",
            location.pathname === "/profile" && "bg-[var(--bg-card-hover)] text-[var(--text-primary)]",
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={clsx(
          "hidden lg:block sticky top-0 z-30 h-screen shrink-0 overflow-hidden transition-[width] duration-300",
          collapsed ? "w-[72px]" : "w-[var(--sidebar-w)]",
        )}
      >
        {content}
      </aside>

      {/* Mobile */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
