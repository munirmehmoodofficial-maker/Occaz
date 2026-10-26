import { Bookmark, Clock, MapPin, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { motion } from "framer-motion";
import type { OpportunityListing } from "../../data/mock";
import { formatDate, formatPrice } from "../../data/mock";
import { Badge } from "../ui/Badge";
import { SafeImage } from "../ui/SafeImage";
import { isOpportunityFree, cheapestTierPrice } from "../../lib/freePricing";

const toneFor = (cat: string) => {
  const map: Record<
    string,
    "accent" | "pink" | "cyan" | "emerald" | "amber" | "blue"
  > = {
    Scholarships: "amber",
    Internships: "cyan",
    Fellowships: "accent",
    Hackathons: "pink",
    Competitions: "amber",
    Workshops: "cyan",
    MUNs: "blue",
    Olympiads: "emerald",
    Courses: "accent",
    Grants: "emerald",
  };
  return map[cat] || "accent";
};

export function OpportunityCard({
  opp,
  saved = false,
  onToggleSave,
  className,
}: {
  opp: OpportunityListing;
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
        to={`/opportunities/${opp.id}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)] transition-shadow duration-300 hover:ring-[var(--border-default)] hover:shadow-[var(--shadow-lg)]"
      >
        {/* aspect-[16/9] on mobile: a single-column grid makes the card
            full-width, and a 4/3 image there becomes enormous.
            4/3 from sm up, where cards sit in a real multi-column grid. */}
        <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[4/3]">
          <motion.div className="h-full w-full" whileHover={{ scale: 1.06 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <SafeImage
              src={opp.image}
              alt={opp.title}
              fallbackTitle={opp.title}
              className="h-full w-full object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/30 to-transparent" />
          {/* pr-12 keeps the badges clear of the bookmark button on a
              narrow card */}
          <div className="absolute left-3 top-3 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-2">
            <Badge tone={toneFor(opp.category)}>{opp.category}</Badge>
            {opp.featured && <Badge tone="amber">★ Featured</Badge>}
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSave?.(opp.id);
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
            {opp.title}
          </h3>

          {/* Organizer — who listed this opportunity */}
          {opp.organizer && (
            <div className="flex min-w-0 items-center gap-2">
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-accent-500 to-pink-500 text-[10px] font-bold text-white">
                {opp.organizer.slice(0, 1).toUpperCase()}
              </div>
              <span className="truncate text-xs font-medium text-[var(--text-secondary)]">
                {opp.organizer}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-1.5 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" />
              <span className="min-w-0 truncate">
                {opp.deadline && !isNaN(new Date(opp.deadline).getTime())
                  ? `Deadline ${formatDate(opp.deadline)}`
                  : "Rolling applications"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" />
              <span className="line-clamp-1">
                {opp.city} · {opp.mode}
              </span>
            </div>
          </div>

          {opp.showStipend !== false && opp.stipend && (
            <div className="mt-1 inline-flex w-fit max-w-full items-center gap-2 truncate rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/25">
              {opp.stipend}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {/* Price — plain bold text, matching the event card.
                  Hidden entirely when the admin turned the fee off. */}
              {opp.showFee !== false && (
                <span
                  className={clsx(
                    "text-sm font-semibold",
                    isOpportunityFree(opp)
                      ? "text-emerald-400"
                      : "text-[var(--text-primary)]",
                  )}
                >
                  {isOpportunityFree(opp)
                    ? "Free"
                    : formatPrice(
                        cheapestTierPrice(opp) ?? opp.price ?? 0,
                        opp.currency ?? "PKR",
                      )}
                  {opp.feeType === "recurring" && !isOpportunityFree(opp) && (
                    <span className="text-[10px] font-normal opacity-75">
                      /{opp.feePeriod || "period"}
                    </span>
                  )}
                </span>
              )}
              {opp.showStipend !== false && opp.hasStipend && opp.stipend && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-500/25">
                  + Stipend
                </span>
              )}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--bg-card-hover)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] transition group-hover:bg-white group-hover:text-black">
              <Ticket className="h-3 w-3" />
              Apply
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
