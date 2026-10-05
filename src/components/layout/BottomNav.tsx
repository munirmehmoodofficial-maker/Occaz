import { useLocation, useNavigate } from "react-router-dom";
import { Home, Compass, Calendar, Ticket, User } from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useSaved } from "../../hooks/useSaved";

const items = [
  { to: "/", label: "Home", Icon: Home, end: true },
  { to: "/explore", label: "Explore", Icon: Compass },
  { to: "/events", label: "Events", Icon: Calendar },
  { to: "/tickets", label: "Tickets", Icon: Ticket },
  { to: "/profile", label: "Profile", Icon: User },
];

export function BottomNav() {
  const { saved } = useSaved();
  const savedCount = saved.events.length + saved.opportunities.length;
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function handleNav(to: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigate(to);
  }

  function isActive(to: string, end?: boolean) {
    if (end) return pathname === to;
    return pathname === to || pathname.startsWith(to + "/");
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-[60] pointer-events-auto lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-2xl border-t border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-2 pt-2 backdrop-blur-xl">
        <ul className="flex items-stretch justify-between">
          {items.map(({ to, label, Icon, end }) => {
            const active = isActive(to, end);
            return (
              <li key={to} className="flex-1">
                <a
                  href={to}
                  onClick={(e) => handleNav(to, e)}
                  className={clsx(
                    "group relative flex cursor-pointer select-none flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-medium transition",
                    active
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="bottomnav-active"
                      className="absolute inset-x-3 -top-0.5 h-0.5 rounded-full bg-gradient-to-r from-accent-500 to-pink-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <motion.span
                    whileTap={{ scale: 0.85 }}
                    className="relative grid h-7 w-7 place-items-center"
                  >
                    <Icon
                      className={clsx(
                        "h-5 w-5 transition",
                        active && "text-accent-400",
                      )}
                      strokeWidth={active ? 2.4 : 1.8}
                    />
                    {to === "/tickets" && savedCount > 0 && (
                      <span className="absolute right-0.5 top-0 grid h-3.5 min-w-[14px] place-items-center rounded-full bg-pink-500 px-1 text-[9px] font-semibold text-white">
                        {savedCount}
                      </span>
                    )}
                  </motion.span>
                  <span>{label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
