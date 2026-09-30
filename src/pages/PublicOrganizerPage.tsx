import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Globe,
  Twitter,
  Instagram,
  Linkedin,
  CheckCircle2,
  Building2,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { CardGrid } from "../components/ui/CardGrid";
import { EventCard } from "../components/cards/EventCard";
import { useEvents } from "../hooks/useListings";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { getPlan } from "../lib/plans";

interface OrgProfile {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  social_links: { twitter?: string; instagram?: string; linkedin?: string } | null;
  verification_status: string | null;
}

export function PublicOrganizerPage() {
  const { slug } = useParams();
  const events = useEvents();
  const { user } = useAuth();
  const [profile, setProfile] = useState<OrgProfile | null | "notfound">(null);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!alive) return;
      setProfile((data as OrgProfile) ?? "notfound");
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  // match events by organizer name
  const myEvents = profile && profile !== "notfound"
    ? events
        .filter((e) => e.organizer === profile.name)
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const upcoming = myEvents.filter((e) => new Date(e.date) >= new Date()).slice(0, 8);
  const past = myEvents.filter((e) => new Date(e.date) < new Date()).slice(-4);

  if (profile === "notfound") {
    return (
      <div className="page container text-center">
        <h1 className="text-2xl font-semibold">Organizer not found</h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">
          The organizer "{slug}" doesn't exist or has been removed.
        </p>
        <Link to="/" className="mt-5 inline-block">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
            Back home
          </Button>
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page container text-center">
        <p className="text-sm text-[var(--text-tertiary)]">Loading…</p>
      </div>
    );
  }

  const plan = getPlan("free");
  const isPro = plan.id !== "free";
  const isOwnPage = user?.id === profile.id;

  return (
    <div className="page pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-gradient-to-br from-accent-500/10 via-transparent to-pink-500/5">
        <div className="container py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start gap-6 md:flex-row md:items-center"
          >
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt=""
                className="h-24 w-24 rounded-2xl object-cover ring-2 ring-[var(--border-default)] md:h-28 md:w-28"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 text-3xl font-bold text-white md:h-28 md:w-28">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold md:text-3xl">{profile.name}</h1>
                {profile.verification_status === "verified" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                )}
                {isPro && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/15 px-2 py-0.5 text-xs font-medium text-accent-300 ring-1 ring-accent-500/30">
                    <Sparkles className="h-3 w-3" /> {plan.name}
                  </span>
                )}
              </div>
              {profile.description ? (
                <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
                  {profile.description}
                </p>
              ) : (
                <p className="mt-2 text-sm text-[var(--text-tertiary)]">
                  Organizer on Occaz
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] px-3 py-1.5 ring-1 ring-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)]"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
                {profile.social_links?.twitter && (
                  <a
                    href={profile.social_links?.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] px-3 py-1.5 ring-1 ring-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)]"
                  >
                    <Twitter className="h-3.5 w-3.5" /> X / Twitter
                  </a>
                )}
                {profile.social_links?.instagram && (
                  <a
                    href={profile.social_links?.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] px-3 py-1.5 ring-1 ring-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)]"
                  >
                    <Instagram className="h-3.5 w-3.5" /> Instagram
                  </a>
                )}
                {profile.social_links?.linkedin && (
                  <a
                    href={profile.social_links?.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-card)] px-3 py-1.5 ring-1 ring-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)]"
                  >
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isOwnPage ? (
                <Link to="/organizer">
                  <Button variant="outline">Edit dashboard</Button>
                </Link>
              ) : (
                <Button
                  variant={following ? "outline" : "primary"}
                  onClick={() => setFollowing((f) => !f)}
                >
                  {following ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Following
                    </>
                  ) : (
                    "+ Follow"
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mt-10">
        {upcoming.length === 0 && past.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
            <p className="mt-3 text-sm text-[var(--text-tertiary)]">
              {profile.name} hasn't published any events yet.
            </p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold">Upcoming events</h2>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                  {upcoming.length} event{upcoming.length === 1 ? "" : "s"} coming up
                </p>
                <div className="mt-5">
                  <CardGrid>
                    {upcoming.map((e) => (
                      <EventCard key={e.id} event={e} />
                    ))}
                  </CardGrid>
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section className="mt-12">
                <h2 className="text-lg font-semibold">Past events</h2>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                  Highlights from previous events
                </p>
                <div className="mt-5">
                  <CardGrid>
                    {past.map((e) => (
                      <EventCard key={e.id} event={e} />
                    ))}
                  </CardGrid>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
