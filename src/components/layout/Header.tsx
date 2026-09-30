import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Bell,
  Menu,
  ChevronDown,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User as UserIcon,
  Crown,
  Building2,
} from "lucide-react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../lib/auth";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/events", label: "Events" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/tickets", label: "Tickets" },
  { to: "/saved", label: "Saved" },
  { to: "/profile", label: "Profile" },
];

export function Header({
  onOpenSidebar,
  onOpenSearch,
}: {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
}) {
  const [city] = useState("New York, USA");
  const { theme, toggle } = useTheme();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenSearch]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-overlay)] backdrop-blur-xl">
      <div className="flex h-[var(--header-h)] items-center gap-3 px-4 lg:px-6">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenSidebar}
          aria-label="Open menu"
          className="lg:hidden grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] transition hover:text-[var(--text-primary)]"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Brand (mobile only — desktop uses sidebar brand) */}
        <Link to="/" className="lg:hidden flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent-500 to-pink-500">
            <span className="text-sm font-bold text-white">O</span>
          </div>
          <span className="text-base font-bold tracking-tight">Occaz</span>
        </Link>

        {/* Location pill */}
        <button
          type="button"
          className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
        >
          <MapPin className="h-4 w-4 text-accent-400" />
          <span>{city}</span>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
        </button>

        {/* Top nav (xl) */}
        <nav className="hidden xl:flex items-center gap-1 ml-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                clsx(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  isActive
                    ? "bg-[var(--bg-card-hover)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Search bar */}
          <button
            onClick={onOpenSearch}
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-[var(--bg-card)] pl-3 pr-2 py-1.5 text-sm ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--bg-card-hover)]"
          >
            <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-[var(--text-tertiary)]">
              Find events, tickets & opportunities
            </span>
            <span className="ml-2 inline-flex items-center gap-0.5 rounded-md bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </span>
          </button>

          <button
            onClick={onOpenSearch}
            aria-label="Search"
            className="md:hidden grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Theme toggle */}
          <motion.button
            whileTap={{ scale: 0.92, rotate: 15 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            onClick={toggle}
            aria-label="Toggle theme"
            className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] transition hover:text-[var(--text-primary)]"
          >
            <motion.span
              key={theme}
              initial={{ y: 20, opacity: 0, rotate: -45 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -20, opacity: 0, rotate: 45 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 grid place-items-center"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </motion.span>
          </motion.button>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pink-500 ring-2 ring-[var(--bg-base)]" />
          </button>

          {!user && (
            <Link
              to="/welcome"
              className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-[var(--text-tertiary)] transition hover:text-white md:inline-block"
            >
              About
            </Link>
          )}

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account"
                className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-accent-500 to-pink-500 text-sm font-semibold text-white ring-1 ring-[var(--border-default)] transition hover:ring-[var(--border-strong)]"
              >
                {(profile?.full_name || user.email || "U").slice(0, 1).toUpperCase()}
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-11 w-56 origin-top-right overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl"
                  >
                    <div className="border-b border-[var(--border-subtle)] p-3">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {profile?.full_name || "You"}
                      </div>
                      <div className="truncate text-xs text-[var(--text-tertiary)]">
                        {user.email}
                      </div>
                      {profile?.role === "admin" && (
                        <span className="mt-2 inline-flex items-center rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300 ring-1 ring-violet-500/30">
                          Admin
                        </span>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                    >
                      <UserIcon className="h-4 w-4" /> Profile
                    </Link>
                    {profile?.is_organizer && (
                      <>
                        <Link
                          to="/organizer"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                        >
                          <Building2 className="h-4 w-4" /> Organizer dashboard
                        </Link>
                        <Link
                          to="/organizer/billing"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                        >
                          <Crown className="h-4 w-4" /> Organizer billing
                        </Link>
                      </>
                    )}
                    {profile?.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                      >
                        <UserIcon className="h-4 w-4" /> Admin panel
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 border-t border-[var(--border-subtle)] px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/welcome"
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--bg-card-hover)]"
            >
              <LogIn className="h-4 w-4" /> Get started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
