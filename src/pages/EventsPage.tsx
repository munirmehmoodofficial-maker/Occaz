import { useMemo, useState } from "react";
import { categories, cities } from "../data/mock";
import { useEvents } from "../hooks/useListings";
import { EventCard } from "../components/cards/EventCard";
import { CardGrid } from "../components/ui/CardGrid";
import { useSaved } from "../hooks/useSaved";
import { Filter, X } from "lucide-react";

export function EventsPage() {
  const { isEventSaved, toggleEvent } = useSaved();
  const events = useEvents();
  const [cat, setCat] = useState("All");
  const [city, setCity] = useState("All Cities");
  const [price, setPrice] = useState<"any" | "free" | "paid">("any");
  const [sort, setSort] = useState<"date" | "popularity">("date");

  const filtered = useMemo(() => {
    let list = events.slice();
    if (cat !== "All") list = list.filter((e) => e.category === cat);
    if (city !== "All Cities") list = list.filter((e) => e.city === city);
    if (price === "free") list = list.filter((e) => e.price === 0);
    if (price === "paid") list = list.filter((e) => e.price > 0);
    if (sort === "date") list.sort((a, b) => a.date.localeCompare(b.date));
    if (sort === "popularity") list.sort((a, b) => b.attendees - a.attendees);
    return list;
  }, [events, cat, city, price, sort]);

  return (
    <div className="page">
      <div className="container">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Events</h1>
            <p className="mt-2 text-sm text-[var(--text-primary)]/60 md:text-base">
              {filtered.length} events matching your filters
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-full bg-[var(--bg-card)] px-4 py-2 text-sm ring-1 ring-[var(--border-default)] outline-none"
            >
              <option className="bg-[var(--bg-card)]" value="date">Soonest first</option>
              <option className="bg-[var(--bg-card)]" value="popularity">Most popular</option>
            </select>
          </div>
        </header>

        {/* Filter bar */}
        <div className="mb-8 rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
                Category
              </label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="w-full rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-sm ring-1 ring-[var(--border-default)] outline-none"
              >
                <option className="bg-[var(--bg-card)]">All</option>
                {categories.map((c) => (
                  <option key={c} className="bg-[var(--bg-card)]">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
                City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-sm ring-1 ring-[var(--border-default)] outline-none"
              >
                {cities.map((c) => (
                  <option key={c} className="bg-[var(--bg-card)]">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
                Price
              </label>
              <div className="flex gap-2">
                {(["any", "free", "paid"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrice(p)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm capitalize ring-1 ring-[var(--border-default)] transition ${
                      price === p
                        ? "bg-white text-black"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {(cat !== "All" || city !== "All Cities" || price !== "any") && (
            <button
              onClick={() => {
                setCat("All");
                setCity("All Cities");
                setPrice("any");
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>

        <CardGrid>
          {filtered.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              saved={isEventSaved(e.id)}
              onToggleSave={toggleEvent}
            />
          ))}
        </CardGrid>
      </div>
    </div>
  );
}
