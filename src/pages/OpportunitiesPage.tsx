import { useMemo, useState } from "react";
import { opportunityCategories } from "../data/mock";
import { useOpportunities } from "../hooks/useListings";
import { OpportunityCard } from "../components/cards/OpportunityCard";
import { CardGrid } from "../components/ui/CardGrid";
import { useSaved } from "../hooks/useSaved";
import { Filter, X } from "lucide-react";

export function OpportunitiesPage() {
  const { isOpportunitySaved, toggleOpportunity } = useSaved();
  const opportunities = useOpportunities();
  const [cat, setCat] = useState("All");
  const [mode, setMode] = useState<"any" | "online" | "physical">("any");
  const [sort, setSort] = useState<"deadline" | "newest">("deadline");

  const filtered = useMemo(() => {
    let list = opportunities.slice();
    if (cat !== "All") list = list.filter((o) => o.category === cat);
    if (mode === "online") list = list.filter((o) => o.mode === "Online");
    if (mode === "physical")
      list = list.filter((o) => o.mode === "Physical");
    if (sort === "deadline")
      list.sort((a, b) => a.deadline.localeCompare(b.deadline));
    return list;
  }, [opportunities, cat, mode, sort]);

  return (
    <div className="page">
      <div className="container">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Opportunities
            </h1>
            <p className="mt-2 text-sm text-[var(--text-primary)]/60 md:text-base">
              {filtered.length} opportunities matching your filters
            </p>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-full bg-[var(--bg-card)] px-4 py-2 text-sm ring-1 ring-[var(--border-default)] outline-none"
          >
            <option className="bg-[var(--bg-card)]" value="deadline">
              Closest deadline
            </option>
            <option className="bg-[var(--bg-card)]" value="newest">
              Recently added
            </option>
          </select>
        </header>

        <div className="mb-8 rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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
                {opportunityCategories.map((c) => (
                  <option key={c} className="bg-[var(--bg-card)]">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
                Mode
              </label>
              <div className="flex gap-2">
                {(["any", "online", "physical"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm capitalize ring-1 ring-[var(--border-default)] transition ${
                      mode === m
                        ? "bg-white text-black"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {(cat !== "All" || mode !== "any") && (
            <button
              onClick={() => {
                setCat("All");
                setMode("any");
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>

        <CardGrid>
          {filtered.map((o) => (
            <OpportunityCard
              key={o.id}
              opp={o}
              saved={isOpportunitySaved(o.id)}
              onToggleSave={toggleOpportunity}
            />
          ))}
        </CardGrid>
      </div>
    </div>
  );
}
