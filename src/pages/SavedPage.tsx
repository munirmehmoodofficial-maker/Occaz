import { Bookmark } from "lucide-react";
import { useEvents, useOpportunities } from "../hooks/useListings";
import { CardGrid } from "../components/ui/CardGrid";
import { EventCard } from "../components/cards/EventCard";
import { OpportunityCard } from "../components/cards/OpportunityCard";
import { useState } from "react";
import clsx from "clsx";
import { useSaved } from "../hooks/useSaved";

export function SavedPage() {
  const { saved, isEventSaved, isOpportunitySaved, toggleEvent, toggleOpportunity } = useSaved();
  const events = useEvents();
  const opportunities = useOpportunities();
  const [tab, setTab] = useState<"events" | "opportunities">("events");

  const savedEvents = events.filter((e) => saved.events.includes(e.id));
  const savedOpps = opportunities.filter((o) => saved.opportunities.includes(o.id));

  return (
    <div className="page">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Saved
          </h1>
          <p className="mt-2 text-sm text-[var(--text-primary)]/60 md:text-base">
            Events and opportunities you've bookmarked.
          </p>
        </header>

        <div className="mb-6 flex gap-2 rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)] w-fit">
          {(
            [
              { key: "events", label: "Events", count: savedEvents.length },
              {
                key: "opportunities",
                label: "Opportunities",
                count: savedOpps.length,
              },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx(
                "rounded-full px-5 py-2 text-sm font-medium transition",
                tab === t.key
                  ? "bg-white text-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {t.label}{" "}
              <span
                className={clsx(
                  "ml-1 text-xs",
                  tab === t.key ? "text-black/55" : "text-[var(--text-tertiary)]",
                )}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {tab === "events" ? (
          savedEvents.length === 0 ? (
            <EmptyState label="No saved events yet. Tap the bookmark icon on any event to save it here." />
          ) : (
            <CardGrid>
              {savedEvents.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  saved={isEventSaved(e.id)}
                  onToggleSave={toggleEvent}
                />
              ))}
            </CardGrid>
          )
        ) : savedOpps.length === 0 ? (
          <EmptyState label="No saved opportunities yet. Tap the bookmark icon to save scholarships, internships and more." />
        ) : (
          <CardGrid>
            {savedOpps.map((o) => (
              <OpportunityCard
                key={o.id}
                opp={o}
                saved={isOpportunitySaved(o.id)}
                onToggleSave={toggleOpportunity}
              />
            ))}
          </CardGrid>
        )}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-card)] p-16 text-center ring-1 ring-[var(--border-subtle)]">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--bg-card-hover)] ring-1 ring-[var(--border-default)]">
        <Bookmark className="h-5 w-5 text-[var(--text-tertiary)]" />
      </div>
      <p className="mt-4 text-sm text-[var(--text-tertiary)]">{label}</p>
    </div>
  );
}
