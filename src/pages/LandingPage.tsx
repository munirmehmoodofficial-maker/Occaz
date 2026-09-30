import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Calendar,
  Briefcase,
  Ticket,
  Search,
  Crown,
  CheckCircle2,
  Building2,
  Heart,
  Music,
  Trophy,
  Code,
  GraduationCap,
  Mail,
  Bell,
  Smartphone,
  ChevronRight,
  Star,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/Button";
import { useEvents, useOpportunities } from "../hooks/useListings";
import clsx from "clsx";

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const events = useEvents();
  const opportunities = useOpportunities();
  const [activePreview, setActivePreview] = useState<"events" | "opps" | "tickets">("events");

  // if user is signed in, the welcome page is unnecessary — auto-redirect home
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Top nav (minimal — no sidebar) */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/welcome" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-pink-500">
              <span className="text-base font-bold text-white">O</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Occaz</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            <NavLink href="#discover">Discover</NavLink>
            <NavLink href="#opportunities">Opportunities</NavLink>
            <NavLink href="#organizers">For organizers</NavLink>
            <NavLink href="#how">How it works</NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-white sm:inline-block"
            >
              Log in
            </Link>
            <Link to="/signup">
              <Button>
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Events, tickets & opportunities — all in one place</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mt-5 text-4xl font-bold tracking-tight md:text-6xl"
              >
                The home for{" "}
                <span className="bg-gradient-to-br from-accent-400 to-pink-500 bg-clip-text text-transparent">
                  things worth showing up for
                </span>
                .
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-5 max-w-xl text-base text-[var(--text-secondary)] md:text-lg"
              >
                Discover concerts, hackathons, scholarships, and meetups near
                you. Save what you love. Buy tickets. Apply to opportunities.
                Follow the organizers you trust.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Link to="/signup">
                  <Button size="lg" leftIcon={<Mail className="h-4 w-4" />}>
                    Create free account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    I already have one
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--text-tertiary)]"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Free forever
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Email or social
                </span>
              </motion.div>
            </div>

            {/* Right side — interactive preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative"
            >
              <Preview active={activePreview} setActive={setActivePreview} events={events} opportunities={opportunities} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-[var(--border-subtle)] bg-[var(--bg-card)]/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { num: `${events.length || 12}+`, label: "Live events" },
              { num: `${opportunities.length || 12}+`, label: "Open opportunities" },
              { num: "3-step", label: "Booking flow" },
              { num: "PKR", label: "Local payments" },
            ].map((s) => (
              <div key={s.label} className="text-center sm:text-left">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{s.num}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discover section */}
      <section id="discover" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-accent-400">
                Discover
              </div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Something for every kind of plan
              </h2>
              <p className="mt-2 max-w-xl text-sm text-[var(--text-tertiary)]">
                Concerts, comedy, workshops, conferences, hackathons, and
                everything in between. Use the discover page to filter by
                city, category, or price.
              </p>
            </div>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent-400 hover:text-accent-300"
            >
              Browse all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: Music, name: "Concerts", color: "from-pink-500/20 to-fuchsia-500/20" },
              { Icon: Trophy, name: "Hackathons", color: "from-amber-500/20 to-orange-500/20" },
              { Icon: Code, name: "Workshops", color: "from-cyan-500/20 to-blue-500/20" },
              { Icon: GraduationCap, name: "Scholarships", color: "from-emerald-500/20 to-teal-500/20" },
              { Icon: Heart, name: "Meetups", color: "from-rose-500/20 to-pink-500/20" },
              { Icon: Building2, name: "Conferences", color: "from-violet-500/20 to-purple-500/20" },
            ].map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 transition hover:border-accent-500/40"
              >
                <div
                  className={clsx(
                    "absolute inset-0 bg-gradient-to-br opacity-0 transition group-hover:opacity-100",
                    c.color,
                  )}
                />
                <div className="relative flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--bg-elevated)] ring-1 ring-[var(--border-subtle)]">
                    <c.Icon className="h-5 w-5 text-[var(--text-primary)]" />
                  </div>
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">Curated weekly</div>
                  </div>
                  <ChevronRight className="ml-auto h-4 w-4 text-[var(--text-tertiary)] group-hover:text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Opportunities section */}
      <section
        id="opportunities"
        className="border-y border-[var(--border-subtle)] bg-[var(--bg-card)]/40 py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-accent-400">
                Opportunities
              </div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                One place for every next step
              </h2>
              <p className="mt-3 text-sm text-[var(--text-tertiary)]">
                Scholarships, internships, fellowships, grants, MUNs, olympiads
                — all in one feed, with deadlines visible at a glance.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Apply to multiple opportunities in one session",
                  "Get reminders before deadlines via email or WhatsApp",
                  "See eligibility and requirements before you apply",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                    <span className="text-[var(--text-secondary)]">{p}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="mt-7 inline-block">
                <Button>
                  Find your next opportunity <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="grid gap-3 sm:grid-cols-2">
                {(opportunities.slice(0, 4) || []).map((o, i) => (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4"
                  >
                    <div className="line-clamp-2 text-sm font-semibold">{o.title}</div>
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                      {o.organizer}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300 ring-1 ring-emerald-500/30">
                        {o.category}
                      </span>
                      <span className="text-[var(--text-tertiary)]">PKR</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For organizers */}
      <section id="organizers" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-accent-500/30 bg-gradient-to-br from-accent-500/15 via-pink-500/5 to-transparent p-8 md:p-12">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-accent-500/20 px-3 py-1 text-xs font-medium text-accent-200 ring-1 ring-accent-500/30">
                  <Crown className="h-3.5 w-3.5" /> For organizers
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                  Run events, get discovered
                </h2>
                <p className="mt-3 max-w-xl text-sm text-[var(--text-tertiary)]">
                  Set up your organizer page in minutes. Publish events,
                  process ticket sales, reach attendees — and upgrade to
                  Pro when you want featured placement and audience insights.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    "Branded organizer page",
                    "Ticketing + checkout",
                    "Email + WhatsApp updates",
                    "Featured placement (Pro)",
                    "Audience insights (Pro)",
                    "Advanced analytics (Business)",
                  ].map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-card)] px-3 py-1 text-xs ring-1 ring-[var(--border-subtle)]"
                    >
                      <CheckCircle2 className="h-3 w-3 text-accent-400" />
                      {f}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex gap-2">
                  <Link to="/signup?intent=organizer">
                    <Button size="lg" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                      Become an organizer
                    </Button>
                  </Link>
                  <Link to="/organizers">
                    <Button size="lg" variant="outline">
                      See who's already on Occaz
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-6 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 text-2xl font-bold text-white">
                      B
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">BizzEvents</h3>
                        <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                          <CheckCircle2 className="mr-0.5 inline h-2.5 w-2.5" />
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Concerts, art, and culture in Karachi
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    {[
                      { n: "12", l: "Events" },
                      { n: "4.8k", l: "Followers" },
                      { n: "8.2k", l: "Tickets" },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="rounded-xl bg-[var(--bg-card)] p-2 ring-1 ring-[var(--border-subtle)]"
                      >
                        <div className="text-lg font-bold">{s.n}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">
                          {s.l}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="text-xs font-medium uppercase tracking-wider text-accent-400">
              How it works
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              From discovery to door, in 3 steps
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Find what you love",
                body: "Browse curated events and opportunities. Filter by city, category, price, or deadline. Save the ones you love.",
                Icon: Search,
              },
              {
                step: "02",
                title: "Buy or apply in seconds",
                body: "Tickets, attendee info, and payment — all in one flow. Get confirmations on email and WhatsApp.",
                Icon: Ticket,
              },
              {
                step: "03",
                title: "Show up & follow",
                body: "Your QR ticket is in your account. Follow organizers to be the first to hear about their next event.",
                Icon: Star,
              },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-accent-400">{s.step}</span>
                  <s.Icon className="h-5 w-5 text-accent-400" />
                </div>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--text-tertiary)]">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to start?
          </h2>
          <p className="mt-3 text-sm text-[var(--text-tertiary)]">
            Free account, no card needed, 30 seconds to set up.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup">
              <Button size="lg" leftIcon={<Mail className="h-4 w-4" />}>
                Create free account
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/40 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent-500 to-pink-500">
              <span className="text-xs font-bold text-white">O</span>
            </div>
            <span className="text-sm font-semibold">Occaz</span>
            <span className="text-xs text-[var(--text-tertiary)]">· Made in Pakistan</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
            <Link to="/organizers" className="hover:text-white">Organizers</Link>
            <Link to="/events" className="hover:text-white">Events</Link>
            <Link to="/opportunities" className="hover:text-white">Opportunities</Link>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-full px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-card)] hover:text-white"
    >
      {children}
    </a>
  );
}

function BackgroundOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl" />
      <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
      <div className="absolute left-1/2 top-96 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
    </div>
  );
}

function Preview({
  active,
  setActive,
  events,
  opportunities,
}: {
  active: "events" | "opps" | "tickets";
  setActive: (v: "events" | "opps" | "tickets") => void;
  events: any[];
  opportunities: any[];
}) {
  return (
    <div className="relative">
      {/* Floating cards backdrop */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-6 -top-6 hidden h-32 w-32 rounded-3xl bg-gradient-to-br from-pink-500/40 to-fuchsia-500/40 blur-2xl lg:block"
      />
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-8 -left-8 hidden h-40 w-40 rounded-3xl bg-gradient-to-br from-accent-500/40 to-violet-500/40 blur-2xl lg:block"
      />

      <div className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 shadow-2xl">
        {/* Tabs */}
        <div className="mb-3 inline-flex gap-1 rounded-full bg-[var(--bg-elevated)] p-1">
          {([
            { v: "events", label: "Events", Icon: Calendar },
            { v: "opps", label: "Opportunities", Icon: Briefcase },
            { v: "tickets", label: "Tickets", Icon: Ticket },
          ] as const).map((t) => (
            <button
              key={t.v}
              onClick={() => setActive(t.v)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                active === t.v
                  ? "bg-white text-black"
                  : "text-[var(--text-tertiary)] hover:text-white",
              )}
            >
              <t.Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-2.5">
          {active === "events" && (events.slice(0, 3) || []).map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-2xl bg-[var(--bg-elevated)] p-2.5 ring-1 ring-[var(--border-subtle)]"
            >
              <img src={e.image} className="h-12 w-12 rounded-xl object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold">{e.title}</div>
                <div className="truncate text-xs text-[var(--text-tertiary)]">
                  {e.organizer} · {e.city}
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-semibold">
                  {e.price === 0 ? "Free" : `₨ ${e.price.toLocaleString()}`}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)]">
                  {e.attendees} going
                </div>
              </div>
            </motion.div>
          ))}
          {active === "opps" && (opportunities.slice(0, 3) || []).map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-2xl bg-[var(--bg-elevated)] p-2.5 ring-1 ring-[var(--border-subtle)]"
            >
              <img src={o.image} className="h-12 w-12 rounded-xl object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-semibold">{o.title}</div>
                <div className="truncate text-xs text-[var(--text-tertiary)]">
                  {o.organizer} · {o.category}
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                Apply
              </span>
            </motion.div>
          ))}
          {active === "tickets" && (
            <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-center">
              <Ticket className="mx-auto h-8 w-8 text-[var(--text-tertiary)]" />
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Sign up to claim QR-coded tickets
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                We'll save them under your account
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--bg-elevated)] p-3 ring-1 ring-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <Bell className="h-3.5 w-3.5" />
            Updates on
          </div>
          <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-[10px] font-medium text-accent-300 ring-1 ring-accent-500/30">
            <Smartphone className="mr-0.5 inline h-2.5 w-2.5" /> Email + WhatsApp
          </span>
        </div>
      </div>
    </div>
  );
}
