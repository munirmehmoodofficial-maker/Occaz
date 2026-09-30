import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Music,
  Theater,
  Laugh,
  Users,
  GraduationCap,
  Trophy,
  Palette,
  Award,
  Wrench,
  Briefcase,
  Sparkles,
  Code,
  ScrollText,
  Lightbulb,
  GraduationCap as HatIcon,
} from "lucide-react";
import clsx from "clsx";
import {
  categories,
  opportunityCategories,
} from "../data/mock";
import { useEvents, useOpportunities } from "../hooks/useListings";
import { EventCard } from "../components/cards/EventCard";
import { OpportunityCard } from "../components/cards/OpportunityCard";
import { CardGrid } from "../components/ui/CardGrid";
import { useSaved } from "../hooks/useSaved";

const eventIcons: Record<string, any> = {
  Concerts: Music,
  Qawwali: Music,
  Theatre: Theater,
  Comedy: Laugh,
  Meetups: Users,
  Seminars: GraduationCap,
  Tournaments: Trophy,
  Exhibitions: Palette,
  Competitions: Award,
  Workshops: Wrench,
  Conferences: Briefcase,
};

const oppIcons: Record<string, any> = {
  Scholarships: GraduationCap,
  Internships: Briefcase,
  Fellowships: Sparkles,
  Hackathons: Code,
  Competitions: Award,
  Workshops: Wrench,
  MUNs: ScrollText,
  Olympiads: Trophy,
  Courses: Lightbulb,
  Grants: HatIcon,
};

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const initialCat = params.get("category") || "All";
  const [active, setActive] = useState(initialCat);
  const [tab, setTab] = useState<"events" | "opportunities">("events");
  const { isEventSaved, isOpportunitySaved, toggleEvent, toggleOpportunity } = useSaved();
  const events = useEvents();
  const opportunities = useOpportunities();

  const list = tab === "events" ? categories : opportunityCategories;

  const filteredEvents = useMemo(() => {
    if (active === "All") return events;
    return events.filter((e) => e.category === active);
  }, [events, active]);

  const filteredOpps = useMemo(() => {
    if (active === "All") return opportunities;
    return opportunities.filter((o) => o.category === active);
  }, [opportunities, active]);

  return (
    <div className="page">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Explore Occaz
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-primary)]/60 md:text-base">
            Browse by category — find exactly what you love, or discover
            something new.
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)] w-fit">
          {[
            { key: "events", label: "Events" },
            { key: "opportunities", label: "Opportunities" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key as any);
                setActive("All");
              }}
              className={clsx(
                "rounded-full px-5 py-2 text-sm font-medium transition",
                tab === t.key
                  ? "bg-white text-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category chips */}
        <div className="-mx-2 mb-8 flex flex-wrap gap-2 px-2">
          <button
            onClick={() => setActive("All")}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              active === "All"
                ? "bg-white text-black"
                : "bg-[var(--bg-card-hover)] text-[var(--text-secondary)] ring-1 ring-[var(--border-default)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]",
            )}
          >
            All
          </button>
          {list.map((c) => {
            const Icon =
              tab === "events" ? eventIcons[c] || Music : oppIcons[c] || Lightbulb;
            return (
              <button
                key={c}
                onClick={() => {
                  setActive(c);
                  setParams({ category: c });
                }}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                  active === c
                    ? "bg-white text-black"
                    : "bg-[var(--bg-card-hover)] text-[var(--text-secondary)] ring-1 ring-[var(--border-default)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]",
                )}
              >
                <Icon className="h-4 w-4" />
                {c}
              </button>
            );
          })}
        </div>

        {tab === "events" ? (
          <>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">
                {active === "All" ? "All events" : active}
              </h2>
              <span className="text-sm text-[var(--text-tertiary)]">
                {filteredEvents.length} listings
              </span>
            </div>
            <CardGrid>
              {filteredEvents.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  saved={isEventSaved(e.id)}
                  onToggleSave={toggleEvent}
                />
              ))}
            </CardGrid>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">
                {active === "All" ? "All opportunities" : active}
              </h2>
              <span className="text-sm text-[var(--text-tertiary)]">
                {filteredOpps.length} listings
              </span>
            </div>
            <CardGrid>
              {filteredOpps.map((o) => (
                <OpportunityCard
                  key={o.id}
                  opp={o}
                  saved={isOpportunitySaved(o.id)}
                  onToggleSave={toggleOpportunity}
                />
              ))}
            </CardGrid>
          </>
        )}
      </div>
    </div>
  );
}
