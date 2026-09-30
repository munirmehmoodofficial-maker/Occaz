import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, X, ArrowDownUp } from "lucide-react";
import { categories, opportunityCategories, cities } from "../data/mock";
import { useEvents, useOpportunities } from "../hooks/useListings";
import { CardGrid } from "../components/ui/CardGrid";
import { EventCard } from "../components/cards/EventCard";
import { OpportunityCard } from "../components/cards/OpportunityCard";
import { useSaved } from "../hooks/useSaved";
import clsx from "clsx";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const events = useEvents();
  const opportunities = useOpportunities();
  const initialQ = params.get("q") || "";
  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState<"all" | "events" | "opportunities">("all");
  const [cat, setCat] = useState("All");
  const [city, setCity] = useState("All Cities");
  const [price, setPrice] = useState<"any" | "free" | "paid">("any");
  const [mode, setMode] = useState<"any" | "online" | "physical">("any");
  const [sort, setSort] = useState<"relevance" | "date" | "distance">("relevance");
  const { isEventSaved, isOpportunitySaved, toggleEvent, toggleOpportunity } = useSaved();

  const filteredEvents = useMemo(() => {
    const term = q.trim().toLowerCase();
    return events.filter((e) => {
      if (term && !`${e.title} ${e.organizer} ${e.city} ${e.category}`.toLowerCase().includes(term))
        return false;
      if (cat !== "All" && e.category !== cat) return false;
      if (city !== "All Cities" && e.city !== city) return false;
      if (price === "free" && e.price !== 0) return false;
      if (price === "paid" && e.price === 0) return false;
      if (mode === "online" && e.mode !== "Online") return false;
      if (mode === "physical" && e.mode !== "Physical") return false;
      return true;
    });
  }, [events, q, cat, city, price, mode]);

  const filteredOpps = useMemo(() => {
    const term = q.trim().toLowerCase();
    return opportunities.filter((o) => {
      if (term && !`${o.title} ${o.organizer} ${o.city} ${o.category}`.toLowerCase().includes(term))
        return false;
      if (cat !== "All" && o.category !== cat) return false;
      if (city !== "All Cities" && o.city !== city) return false;
      if (mode === "online" && o.mode !== "Online") return false;
      if (mode === "physical" && o.mode !== "Physical") return false;
      return true;
    });
  }, [opportunities, q, cat, city, mode]);

  const showEvents = type !== "opportunities";
  const showOpps = type !== "events";

  const allCats = [...categories, ...opportunityCategories];

  return (
    <div className="page">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Search</h1>
          <p className="mt-2 text-sm text-[var(--text-primary)]/60 md:text-base">
            Find anything across events, tickets and opportunities.
          </p>
        </header>

        {/* Search bar */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-[var(--bg-card)] px-5 py-4 ring-1 ring-[var(--border-subtle)]">
          <Search className="h-5 w-5 text-[var(--text-tertiary)]" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (e.target.value) setParams({ q: e.target.value });
              else setParams({});
            }}
            placeholder="Search events, opportunities, organizers..."
            className="flex-1 bg-transparent text-sm placeholder:text-[var(--text-tertiary)] outline-none"
          />
          {q && (
            <button onClick={() => { setQ(""); setParams({}); }} aria-label="Clear">
              <X className="h-4 w-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" />
            </button>
          )}
        </div>

        {/* Type tabs */}
        <div className="mb-4 flex gap-2 rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)] w-fit">
          {[
            { key: "all", label: "All" },
            { key: "events", label: "Events" },
            { key: "opportunities", label: "Opportunities" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key as any)}
              className={clsx(
                "rounded-full px-5 py-2 text-sm font-medium transition",
                type === t.key
                  ? "bg-white text-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <FilterField label="Category">
              <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-sm ring-1 ring-[var(--border-default)] outline-none">
                <option className="bg-[var(--bg-card)]">All</option>
                {allCats.map((c) => (
                  <option key={c} className="bg-[var(--bg-card)]">{c}</option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Location">
              <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-sm ring-1 ring-[var(--border-default)] outline-none">
                {cities.map((c) => (
                  <option key={c} className="bg-[var(--bg-card)]">{c}</option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Price">
              <div className="flex gap-1.5">
                {(["any", "free", "paid"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrice(p)}
                    className={pill(price === p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </FilterField>
            <FilterField label="Mode">
              <div className="flex gap-1.5">
                {(["any", "online", "physical"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={pill(mode === m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </FilterField>
            <FilterField label="Sort">
              <div className="relative">
                <ArrowDownUp className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="w-full rounded-lg bg-[var(--bg-elevated)] pl-8 pr-3 py-2 text-sm ring-1 ring-[var(--border-default)] outline-none"
                >
                  <option className="bg-[var(--bg-card)]" value="relevance">Relevance</option>
                  <option className="bg-[var(--bg-card)]" value="date">Date</option>
                  <option className="bg-[var(--bg-card)]" value="distance">Distance</option>
                </select>
              </div>
            </FilterField>
          </div>
        </div>

        <div className="mb-4 text-sm text-[var(--text-tertiary)]">
          {showEvents && `${filteredEvents.length} events`}
          {showEvents && showOpps && " · "}
          {showOpps && `${filteredOpps.length} opportunities`}
        </div>

        {showEvents && filteredEvents.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold">Events</h2>
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
          </section>
        )}

        {showOpps && filteredOpps.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Opportunities</h2>
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
          </section>
        )}

        {((showEvents && filteredEvents.length === 0) ||
          (showOpps && filteredOpps.length === 0)) && (
          <div className="rounded-2xl bg-[var(--bg-card)] p-16 text-center ring-1 ring-[var(--border-subtle)]">
            <Search className="mx-auto h-10 w-10 text-[var(--text-disabled)]" />
            <p className="mt-4 text-[var(--text-tertiary)]">No results found. Try different filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">{label}</label>
      {children}
    </div>
  );
}

function pill(active: boolean) {
  return clsx(
    "flex-1 rounded-lg px-3 py-2 text-sm capitalize ring-1 ring-[var(--border-default)] transition",
    active
      ? "bg-white text-black"
      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]",
  );
}
