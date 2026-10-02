import { Search, MapPin, Sparkles, TrendingUp, Compass, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { isGuest } from "../lib/guest";
import { useEffect } from "react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useEvents, useOpportunities } from "../hooks/useListings";
import { supabase } from "../lib/supabase";
import { EventCard } from "../components/cards/EventCard";
import { OpportunityCard } from "../components/cards/OpportunityCard";
import { CardGrid } from "../components/ui/CardGrid";
import { Section } from "../components/ui/Section";
import { FadeIn, Stagger } from "../components/motion/Motion";
import { useSaved } from "../hooks/useSaved";

const categories = [
  "Concerts",
  "Qawwali",
  "Theatre",
  "Comedy",
  "Meetups",
  "Hackathons",
  "Scholarships",
  "Workshops",
  "Conferences",
];

export function HomePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isEventSaved, isOpportunitySaved, toggleEvent, toggleOpportunity } =
    useSaved();
  const [city, setCity] = useState("New York, USA");
  const [q, setQ] = useState("");
  const [sectionOrder, setSectionOrder] = useState<string[] | null>(null);
  const [heroBgUrl, setHeroBgUrl] = useState<string | null>(null);

  // Fetch admin-configured section order + hero background (poll every 5s
  // so admin changes appear on the home page without a manual refresh)
  useEffect(() => {
    let alive = true;
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("homepage_settings")
        .select("section_order, hero_bg_url")
        .eq("id", "default")
        .maybeSingle();
      if (!alive) return;
      if (!data) return;
      if (Array.isArray(data.section_order) && data.section_order.length > 0) {
        const newOrder = data.section_order as string[];
        setSectionOrder((prev) => {
          if (!prev) return newOrder;
          if (prev.length !== newOrder.length) return newOrder;
          for (let i = 0; i < prev.length; i++) {
            if (prev[i] !== newOrder[i]) return newOrder;
          }
          return prev;
        });
      }
      if (data.hero_bg_url) {
        setHeroBgUrl((prev) => (prev === data.hero_bg_url ? prev : data.hero_bg_url));
      }
    };
    fetchSettings();
    const interval = setInterval(fetchSettings, 5000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  // first-visit redirect: send unauthenticated non-guests through onboarding
  useEffect(() => {
    if (authLoading) return;
    if (!user && !isGuest()) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // IMPORTANT: call all hooks BEFORE any conditional return.
  // React requires hooks to be called in the same order every render.
  const events = useEvents();
  const opportunities = useOpportunities();

  // Avoid flashing the app chrome before the redirect kicks in.
  if (authLoading || (!user && !isGuest())) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const happeningToday = useMemo(
    () => events.filter((e) => e.date === today).slice(0, 4),
    [events],
  );
  const popular = useMemo(
    () => [...events].sort((a, b) => b.attendees - a.attendees).slice(0, 4),
    [events],
  );
  const recommended = useMemo(() => {
    const cats = ["Concerts", "Workshops", "Conferences"];
    return events.filter((e) => cats.includes(e.category)).slice(0, 4);
  }, [events]);
  const upcoming = useMemo(
    () => [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4),
    [events],
  );
  const latestOpps = useMemo(
    () =>
      [...opportunities]
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
        .slice(0, 4),
    [opportunities],
  );
  const featured = useMemo(
    () => events.filter((e) => e.featured).slice(0, 3),
    [events],
  );

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl ring-1 ring-[var(--border-default)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-elevated)] via-[var(--bg-card)] to-[var(--bg-elevated)]">
            {heroBgUrl && (
              <img
                src={heroBgUrl}
                alt=""
                className="h-full w-full object-cover opacity-50"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--bg-base)] via-[var(--bg-base)]/85 to-[var(--bg-base)]/30" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.25),transparent_60%)]" />
          </div>
          <div className="relative grid gap-10 p-8 md:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-card)]/80 px-3 py-1 text-xs font-medium text-[var(--text-primary)] ring-1 ring-[var(--border-default)] backdrop-blur"
              >
                <Sparkles className="h-3 w-3 text-accent-400" />
                Discover what's happening near you
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
              >
                Events, tickets & opportunities —{" "}
                <span className="bg-gradient-to-r from-accent-400 to-pink-500 bg-clip-text text-transparent">
                  beautifully curated.
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="mt-5 max-w-xl text-base text-[var(--text-secondary)] md:text-lg"
              >
                Find concerts, conferences, scholarships and more — all in one
                elegant, distraction-free experience.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <button
                  type="button"
                  onClick={() => navigate("/explore")}
                  className="group inline-flex h-12 flex-1 items-center gap-3 rounded-full bg-white px-5 text-left text-black shadow-[0_8px_24px_rgba(255,255,255,0.12)] transition hover:bg-white/90"
                >
                  <Search className="h-4 w-4 text-black/60" />
                  <span className="flex-1 text-sm font-medium text-black/80">
                    Find events, tickets & opportunities
                  </span>
                  <ArrowRight className="h-4 w-4 -translate-x-1 text-black/60 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/explore")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 px-5 text-sm font-medium text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-white/15"
                >
                  <Compass className="h-4 w-4" />
                  Explore
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-8 flex flex-wrap items-center gap-2"
              >
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Trending:
                </span>
                {categories.slice(0, 6).map((c) => (
                  <Link
                    key={c}
                    to={`/explore?category=${encodeURIComponent(c)}`}
                    className="rounded-full bg-[var(--bg-card)]/80 px-3 py-1 text-xs text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] backdrop-blur transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                  >
                    {c}
                  </Link>
                ))}
              </motion.div>
            </div>

            <div className="relative hidden lg:block">
              <Stagger className="grid grid-cols-2 gap-4" stagger={0.1}>
                {featured.map((e, i) => (
                  <motion.div
                    key={e.id}
                    variants={{
                      hidden: { opacity: 0, scale: 0.95, y: 16 },
                      show: { opacity: 1, scale: 1, y: 0 },
                    }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={
                      i === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"
                    }
                  >
                    <Link
                      to={`/events/${e.id}`}
                      className="group relative block h-full overflow-hidden rounded-2xl ring-1 ring-[var(--border-default)] transition hover:ring-[var(--border-strong)]"
                    >
                      <motion.img
                        src={e.image}
                        alt=""
                        className="h-full w-full object-cover"
                        whileHover={{ scale: 1.06 }}
                        transition={{ duration: 0.7 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      <div className="absolute inset-x-3 bottom-3">
                        <div className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur w-fit">
                          {e.category}
                        </div>
                        <div className="mt-1.5 line-clamp-2 text-sm font-semibold text-white">
                          {e.title}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </Stagger>
            </div>
          </div>
        </motion.section>

        {/* Search + Location strip */}
        <FadeIn delay={0.4} className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--bg-card)] px-5 py-4 ring-1 ring-[var(--border-subtle)] focus-within:ring-[var(--border-default)]">
            <Search className="h-5 w-5 text-[var(--text-tertiary)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (q.trim()) navigate(`/search?q=${encodeURIComponent(q)}`);
                  else navigate("/explore");
                }
              }}
              placeholder="Find events, tickets & opportunities"
              className="flex-1 bg-transparent text-sm placeholder:text-[var(--text-tertiary)] outline-none"
            />
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--bg-card)] px-5 py-4 ring-1 ring-[var(--border-subtle)]">
            <MapPin className="h-5 w-5 text-accent-400" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            >
              <option className="bg-[var(--bg-card)]">New York, USA</option>
              <option className="bg-[var(--bg-card)]">London, UK</option>
              <option className="bg-[var(--bg-card)]">San Francisco, USA</option>
              <option className="bg-[var(--bg-card)]">Berlin, Germany</option>
              <option className="bg-[var(--bg-card)]">Lahore, Pakistan</option>
              <option className="bg-[var(--bg-card)]">Remote / Online</option>
            </select>
          </div>
        </FadeIn>

        {/* Sections */}
        <div className="mt-12 flex flex-col gap-16">
          {happeningToday.length > 0 && (
            <Section
              title="Happening Today"
              subtitle="Don't miss these — they're on right now."
              actionLabel="See all"
              actionTo="/events"
              style={sectionOrder ? { order: sectionOrder.indexOf("Happening Today") } : undefined}
            >
              <CardGrid>
                {happeningToday.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    saved={isEventSaved(e.id)}
                    onToggleSave={toggleEvent}
                  />
                ))}
              </CardGrid>
            </Section>
          )}

          <Section
            title="Popular Near You"
            subtitle="The most booked events in your city this week."
            actionLabel="More nearby"
            actionTo="/explore"
            style={sectionOrder ? { order: sectionOrder.indexOf("Popular Near You") } : undefined}
          >
            <CardGrid>
              {popular.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  saved={isEventSaved(e.id)}
                  onToggleSave={toggleEvent}
                />
              ))}
            </CardGrid>
          </Section>

          <Section
            title="Recommended For You"
            subtitle="Based on your interests and recent activity."
            actionLabel="Personalize"
            actionTo="/profile"
            style={sectionOrder ? { order: sectionOrder.indexOf("Recommended For You") } : undefined}
          >
            <CardGrid>
              {recommended.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  saved={isEventSaved(e.id)}
                  onToggleSave={toggleEvent}
                />
              ))}
            </CardGrid>
          </Section>

          <Section
            title="Upcoming Events"
            subtitle="Plan ahead — book early, save more."
            actionLabel="All events"
            actionTo="/events"
            style={sectionOrder ? { order: sectionOrder.indexOf("Upcoming Events") } : undefined}
          >
            <CardGrid>
              {upcoming.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  saved={isEventSaved(e.id)}
                  onToggleSave={toggleEvent}
                />
              ))}
            </CardGrid>
          </Section>

          <Section
            title="Latest Opportunities"
            subtitle="Scholarships, internships and competitions — fresh this week."
            actionLabel="Browse all"
            actionTo="/opportunities"
            style={sectionOrder ? { order: sectionOrder.indexOf("Latest Opportunities") } : undefined}
          >
            <CardGrid>
              {latestOpps.map((o) => (
                <OpportunityCard
                  key={o.id}
                  opp={o}
                  saved={isOpportunitySaved(o.id)}
                  onToggleSave={toggleOpportunity}
                />
              ))}
            </CardGrid>
          </Section>

          <Section
            title="Featured Events"
            subtitle="Hand-picked by our editors."
            actionLabel="View all"
            actionTo="/events"
            style={sectionOrder ? { order: sectionOrder.indexOf("Featured Events") } : undefined}
          >
            <CardGrid>
              {events
                .filter((e) => e.featured)
                .slice(0, 4)
                .map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    saved={isEventSaved(e.id)}
                    onToggleSave={toggleEvent}
                  />
                ))}
            </CardGrid>
          </Section>
        </div>

        {/* CTA strip */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          style={sectionOrder ? { order: sectionOrder.indexOf("List your event CTA") } : undefined}
          className="mt-16 overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500/20 via-pink-500/15 to-cyan-500/15 p-8 ring-1 ring-[var(--border-default)] md:p-12"
        >
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h3 className="text-2xl font-bold md:text-3xl">
                List your event on Occaz
              </h3>
              <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)] md:text-base">
                Reach thousands of engaged attendees. Get powerful tools for
                ticketing, check-in and analytics.
              </p>
            </div>
            <Link
              to="/admin"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90"
            >
              <TrendingUp className="h-4 w-4" />
              Open Admin Panel
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
