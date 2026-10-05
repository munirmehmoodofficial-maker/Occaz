import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  Crown,
  Sparkles,
  CheckCircle2,
  Users,
  Calendar,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useEvents } from "../hooks/useListings";
import { getPlan } from "../lib/plans";
import clsx from "clsx";

interface Org {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  category: string | null;
  verification_status: string | null;
  created_at: string;
}

const PLAN_FILTERS = [
  { id: "all", label: "All" },
  { id: "starter", label: "Starter" },
  { id: "pro", label: "Pro" },
  { id: "business", label: "Business" },
] as const;

export function OrganizersDirectoryPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<(typeof PLAN_FILTERS)[number]["id"]>("all");
  const [loading, setLoading] = useState(true);
  const events = useEvents();

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url, description, category, verification_status, created_at")
        .order("created_at", { ascending: false });
      if (!alive) return;
      if (!error && data) setOrgs(data as Org[]);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = orgs.filter((o) => {
    if (plan !== "all" && o.category !== plan) return false;
    if (q) {
      const t = q.toLowerCase();
      if (
        !o.name.toLowerCase().includes(t) &&
        !(o.description?.toLowerCase().includes(t) ?? false)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="page pb-20">
      <div className="container">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[var(--border-subtle)] bg-gradient-to-br from-accent-500/15 via-pink-500/5 to-transparent p-8 md:p-12"
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent-300">
            <Building2 className="h-3.5 w-3.5" /> Organizers
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
            Discover organizers on Occaz
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-tertiary)] md:text-base">
            Browse the people behind the events, scholarships, and opportunities
            you love. Follow your favorites to get notified the moment they
            publish something new.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search organizers…"
                className="input pl-10"
              />
            </div>
            <div className="inline-flex rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)]">
              {PLAN_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPlan(f.id)}
                  className={clsx(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    plan === f.id
                      ? "bg-white text-black"
                      : "text-[var(--text-tertiary)] hover:text-white",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex items-center justify-between text-sm text-[var(--text-tertiary)]">
          <span>
            {loading ? "Loading…" : `${filtered.length} organizer${filtered.length === 1 ? "" : "s"}`}
          </span>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs text-accent-300 hover:text-accent-200"
          >
            <Sparkles className="h-3.5 w-3.5" /> Become an organizer →
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
            <p className="mt-3 text-sm text-[var(--text-tertiary)]">
              {q
                ? `No organizers matching "${q}".`
                : "No organizers have signed up yet."}
            </p>
            <Link
              to="/profile"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Be the first →
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((o, idx) => (
              <OrgCard key={o.id} org={o} index={idx} eventsCount={
                events.filter((e) => e.organizer === o.name).length
              } />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrgCard({
  org,
  index,
  eventsCount,
}: {
  org: Org;
  index: number;
  eventsCount: number;
}) {
  const plan = getPlan(org.category);
  const isPro = plan.id !== "starter";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link
        to={`/organizers/${org.slug}`}
        className="group block h-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition hover:border-accent-500/40 hover:bg-[var(--bg-card-hover)]"
      >
        <div className="relative h-24 bg-gradient-to-br from-accent-500/20 to-pink-500/10">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt=""
              className="absolute -bottom-8 left-5 h-16 w-16 rounded-2xl border-4 border-[var(--bg-card)] object-cover"
            />
          ) : (
            <div className="absolute -bottom-8 left-5 grid h-16 w-16 place-items-center rounded-2xl border-4 border-[var(--bg-card)] bg-gradient-to-br from-accent-500 to-pink-500 text-2xl font-bold text-white">
              {org.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          {org.verification_status === "verified" && (
            <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </div>
          )}
        </div>
        <div className="px-5 pb-5 pt-10">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{org.name}</h3>
            {isPro && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-500/15 px-1.5 py-0.5 text-[10px] font-medium text-accent-300 ring-1 ring-accent-500/30">
                <Crown className="h-2.5 w-2.5" /> {plan.name.replace("Occaz ", "")}
              </span>
            )}
          </div>
          {org.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-tertiary)]">
              {org.description}
            </p>
          ) : (
            <p className="mt-1 text-xs italic text-[var(--text-tertiary)]">
              No bio yet
            </p>
          )}
          <div className="mt-3 flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {eventsCount} event{eventsCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              Joined {new Date(org.created_at).toLocaleDateString("en-PK", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
