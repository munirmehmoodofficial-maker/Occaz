import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Calendar,
  Briefcase,
  Ticket,
  Bookmark,
  User,
  Home,
  Compass,
  Hash,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEvents, useOpportunities } from "../../hooks/useListings";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Item = {
  id: string;
  label: string;
  subtitle?: string;
  icon: any;
  href: string;
  group: string;
};

export function CommandPalette({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const events = useEvents();
  const opportunities = useOpportunities();

  const items: Item[] = useMemo(() => {
    const nav: Item[] = [
      { id: "n-home", label: "Home", icon: Home, href: "/", group: "Pages" },
      { id: "n-explore", label: "Explore", icon: Compass, href: "/explore", group: "Pages" },
      { id: "n-events", label: "Events", icon: Calendar, href: "/events", group: "Pages" },
      { id: "n-opp", label: "Opportunities", icon: Briefcase, href: "/opportunities", group: "Pages" },
      { id: "n-tickets", label: "My Tickets", icon: Ticket, href: "/tickets", group: "Pages" },
      { id: "n-saved", label: "Saved", icon: Bookmark, href: "/saved", group: "Pages" },
      { id: "n-profile", label: "Profile", icon: User, href: "/profile", group: "Pages" },
    ];
    const ev: Item[] = events.slice(0, 8).map((e) => ({
      id: `e-${e.id}`,
      label: e.title,
      subtitle: `${e.category} · ${e.city}`,
      icon: Calendar,
      href: `/events/${e.id}`,
      group: "Events",
    }));
    const op: Item[] = opportunities.slice(0, 8).map((o) => ({
      id: `o-${o.id}`,
      label: o.title,
      subtitle: `${o.category} · ${o.organizer}`,
      icon: Briefcase,
      href: `/opportunities/${o.id}`,
      group: "Opportunities",
    }));
    return [...nav, ...ev, ...op];
  }, [events, opportunities]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const term = q.toLowerCase();
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(term) ||
        it.subtitle?.toLowerCase().includes(term) ||
        it.group.toLowerCase().includes(term),
    );
  }, [items, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>();
    filtered.forEach((it) => {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    });
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(filtered.length - 1, a + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[active];
        if (item) {
          navigate(item.href);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, active, navigate, onClose]);

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-[10vh] z-[101] mx-auto w-full max-w-2xl px-4"
          >
            <div className="overflow-hidden rounded-2xl bg-[var(--bg-elevated)] ring-1 ring-[var(--border-default)] shadow-2xl">
              <div className="flex items-center gap-3 border-b border-[var(--border-default)] px-5 py-4">
                <Search className="h-5 w-5 text-[var(--text-tertiary)]" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search events, opportunities, pages..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
                />
                <kbd className="rounded-md bg-[var(--bg-card)] px-2 py-0.5 text-xs font-medium text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
                  esc
                </kbd>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {grouped.length === 0 ? (
                  <div className="px-4 py-12 text-center text-sm text-[var(--text-tertiary)]">
                    No results for "{q}"
                  </div>
                ) : (
                  grouped.map(([group, list]) => (
                    <div key={group} className="mb-2">
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        {group}
                      </div>
                      {list.map((it) => {
                        const idx = filtered.indexOf(it);
                        const isActive = idx === active;
                        return (
                          <button
                            key={it.id}
                            onMouseEnter={() => setActive(idx)}
                            onClick={() => {
                              navigate(it.href);
                              onClose();
                            }}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                              isActive
                                ? "bg-accent-500/15 text-[var(--text-primary)] ring-1 ring-accent-500/30"
                                : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                            }`}
                          >
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
                              <it.icon className="h-4 w-4 text-[var(--text-tertiary)]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">{it.label}</div>
                              {it.subtitle && (
                                <div className="truncate text-xs text-[var(--text-tertiary)]">
                                  {it.subtitle}
                                </div>
                              )}
                            </div>
                            {isActive && (
                              <ArrowRight className="h-4 w-4 text-accent-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border-default)] bg-[var(--bg-card)] px-4 py-2.5 text-xs text-[var(--text-tertiary)]">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] ring-1 ring-[var(--border-subtle)]">↑</kbd>
                    <kbd className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] ring-1 ring-[var(--border-subtle)]">↓</kbd>
                    navigate
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] ring-1 ring-[var(--border-subtle)]">↵</kbd>
                    select
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3 w-3" />
                  Powered by Occaz
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
