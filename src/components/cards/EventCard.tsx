import { Bookmark, Calendar, MapPin, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { motion } from "framer-motion";
import type { EventListing } from "../../data/mock";
import { formatDate, formatPrice } from "../../data/mock";
import { Badge } from "../ui/Badge";
import { SafeImage } from "../ui/SafeImage";

const toneFor = (cat: string) => {
  const map: Record<
    string,
    "accent" | "pink" | "cyan" | "emerald" | "amber" | "blue"
  > = {
    Concerts: "pink",
    Qawwali: "amber",
    Theatre: "accent",
    Comedy: "emerald",
    Meetups: "blue",
    Seminars: "cyan",
    Tournaments: "amber",
    Exhibitions: "accent",
    Competitions: "amber",
    Workshops: "cyan",
    Conferences: "blue",
  };
  return map[cat] || "accent";
};

export function EventCard({
  event,
  saved = false,
  onToggleSave,
  className,
}: {
  event: EventListing;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={clsx("h-full", className)}
    >
      <Link
        to={`/events/${event.id}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)] transition-shadow duration-300 hover:ring-[var(--border-default)] hover:shadow-[var(--shadow-lg)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <motion.div
            className="h-full w-full"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <SafeImage
              src={event.image}
              alt={event.title}
              fallbackTitle={event.title}
              className="h-full w-full object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge tone={toneFor(event.category)}>{event.category}</Badge>
            {event.featured && <Badge tone="amber">★ Featured</Badge>}
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave?.(event.id);
            }}
            aria-label={saved ? "Unsave" : "Save"}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
          >
            <motion.span
              key={String(saved)}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
            >
              <Bookmark
                className={clsx(
                  "h-4 w-4 transition",
                  saved && "fill-pink-500 text-pink-500",
                )}
              />
            </motion.span>
          </motion.button>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-[var(--text-primary)]">
            {event.title}
          </h3>
          <div className="flex flex-col gap-1.5 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <span>
                {formatDate(event.date)} · {event.time}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
              <span className="line-clamp-1">
                {event.venue}, {event.city}
              </span>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between pt-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <span className="line-clamp-1 max-w-[120px]">
                {event.organizer}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  "text-sm font-semibold",
                  event.price === 0
                    ? "text-emerald-400"
                    : "text-[var(--text-primary)]",
                )}
              >
                {formatPrice(event.price, event.currency)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-card-hover)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] transition group-hover:bg-white group-hover:text-black">
                <Ticket className="h-3 w-3" />
                View
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
