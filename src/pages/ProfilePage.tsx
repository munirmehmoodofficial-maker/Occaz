import { Badge } from "../components/ui/Badge";
import { CardGrid } from "../components/ui/CardGrid";
import { EventCard } from "../components/cards/EventCard";
import { OpportunityCard } from "../components/cards/OpportunityCard";
import { Button } from "../components/ui/Button";
import { useSaved } from "../hooks/useSaved";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useEvents, useOpportunities } from "../hooks/useListings";
import { supabase } from "../lib/supabase";
import { Mail, MapPin, Calendar, Bell, LogOut, Edit3, Save, X, Camera, Building2, ArrowRight } from "lucide-react";
import clsx from "clsx";

const tabs = [
  { key: "events", label: "Saved Events" },
  { key: "opps", label: "Saved Opportunities" },
  { key: "preferences", label: "Preferences" },
];

const CATS = [
  "Concerts", "Qawwali", "Theatre", "Comedy", "Meetups",
  "Workshops", "Hackathons", "Scholarships", "Conferences", "Exhibitions",
];

interface UserPrefs {
  categories: string[];
  distanceKm: number;
  notifications: boolean;
  newsletter: boolean;
}

export function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const events = useEvents();
  const opportunities = useOpportunities();
  const { saved, toggleEvent, toggleOpportunity, loaded } = useSaved();

  const [tab, setTab] = useState<"events" | "opps" | "preferences">("events");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [becomingOrg] = useState(false);

  const [cats, setCats] = useState<string[]>([]);
  const [distance, setDistance] = useState(25);
  const [notifs, setNotifs] = useState(true);
  const [news, setNews] = useState(false);

  // initial values from profile
  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name ?? "");
    // try reading user_metadata for extras
    const meta = (user?.user_metadata as any) ?? {};
    setBio(meta.bio ?? "");
    setCity(meta.city ?? "New York, USA");
  }, [profile, user]);

  // load preferences
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("bio, city, preferences")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        if (data.bio) setBio(data.bio);
        if (data.city) setCity(data.city);
        const p = (data as any).preferences as UserPrefs | null;
        if (p) {
          setCats(p.categories ?? []);
          setDistance(p.distanceKm ?? 25);
          setNotifs(p.notifications ?? true);
          setNews(p.newsletter ?? false);
        }
      }
    })();
  }, [user]);

  const savedEvents = events.filter((e) => saved.events.includes(e.id));
  const savedOpps = opportunities.filter((o) => saved.opportunities.includes(o.id));

  async function saveProfile() {
    if (!user) return;
    setSavingProfile(true);
    await supabase
      .from("profiles")
      .update({
        full_name: name,
        bio,
        city,
        preferences: { categories: cats, distanceKm: distance, notifications: notifs, newsletter: news },
      })
      .eq("id", user.id);
    setSavingProfile(false);
    setEditing(false);
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "You";
  const initial = displayName.slice(0, 1).toUpperCase();
  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently";

  return (
    <div className="page">
      <div className="container">
        {/* Header card */}
        <div className="overflow-hidden rounded-3xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
          <div className="relative h-40 md:h-48">
            <img
              src="https://picsum.photos/seed/cover1/1800/400"
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-card to-transparent" />
          </div>
          <div className="px-6 pb-6 md:px-8">
            <div className="-mt-12 flex flex-col gap-5 md:-mt-16 md:flex-row md:items-end">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-24 w-24 rounded-2xl object-cover ring-4 ring-bg-card md:h-32 md:w-32"
                  />
                ) : (
                  <div className="grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 text-3xl font-bold text-white ring-4 ring-bg-card md:h-32 md:w-32">
                    {initial}
                  </div>
                )}
                {editing && (
                  <button
                    className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] ring-2 ring-bg-card"
                    title="Change avatar (coming soon)"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                {editing ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="input text-2xl font-bold md:text-3xl"
                  />
                ) : (
                  <h1 className="text-2xl font-bold md:text-3xl">{displayName}</h1>
                )}
                <p className="text-sm text-[var(--text-tertiary)]">
                  {user?.email}
                </p>
                {editing ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    placeholder="A short bio about you"
                    className="input mt-3 w-full max-w-xl"
                  />
                ) : (
                  <p className="mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
                    {bio || "Designer, runner, terrible cook. Always looking for concerts and design meetups."}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-tertiary)]">
                  {editing ? (
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="input w-40"
                    />
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {city || "—"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {user?.email}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Joined {joined}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {editing ? (
                  <>
                    <Button
                      onClick={saveProfile}
                      disabled={savingProfile}
                    >
                      <Save className="h-4 w-4" /> {savingProfile ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditing(false)}
                    >
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setEditing(true)}
                    >
                      <Edit3 className="h-4 w-4" /> Edit profile
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => signOut()}
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </Button>
                  </>
                )}
              </div>
            </div>

            {!profile?.is_organizer && (
              <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-accent-500/40 bg-gradient-to-br from-accent-500/15 via-pink-500/10 to-transparent p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-500/20 ring-1 ring-accent-500/30">
                    <Building2 className="h-4 w-4 text-accent-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Run events on Occaz?</div>
                    <div className="text-xs text-[var(--text-tertiary)]">
                      Get a public organizer page, ticketing, and a dashboard.
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    // Go to the dedicated multi-step organizer onboarding flow.
                    // The user fills in brand, plan, payment there.
                    navigate("/become-organizer");
                  }}
                  disabled={becomingOrg}
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  {becomingOrg ? "Setting up…" : "Become an organizer"}
                </Button>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {(cats.length ? cats : ["Concerts", "Workshops"]).map((i) => (
                <Badge key={i} tone="accent">
                  {i}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 mb-6 flex gap-2 rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)] w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
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

        {tab === "events" &&
          (savedEvents.length === 0 ? (
            <p className="rounded-2xl bg-[var(--bg-card)] p-12 text-center text-sm text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
              {loaded ? "You haven't saved any events yet." : "Loading your saved events…"}
            </p>
          ) : (
            <CardGrid>
              {savedEvents.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  saved
                  onToggleSave={toggleEvent}
                />
              ))}
            </CardGrid>
          ))}

        {tab === "opps" &&
          (savedOpps.length === 0 ? (
            <p className="rounded-2xl bg-[var(--bg-card)] p-12 text-center text-sm text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
              {loaded ? "You haven't saved any opportunities yet." : "Loading…"}
            </p>
          ) : (
            <CardGrid>
              {savedOpps.map((o) => (
                <OpportunityCard
                  key={o.id}
                  opp={o}
                  saved
                  onToggleSave={toggleOpportunity}
                />
              ))}
            </CardGrid>
          ))}

        {tab === "preferences" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
              <h3 className="text-base font-semibold">Interested categories</h3>
              <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                We'll prioritize these in recommendations.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {CATS.map((c) => {
                  const on = cats.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() =>
                        setCats((p) =>
                          on ? p.filter((x) => x !== c) : [...p, c],
                        )
                      }
                      className={clsx(
                        "rounded-full px-3.5 py-1.5 text-sm transition",
                        on
                          ? "bg-white text-black"
                          : "bg-[var(--bg-card-hover)] text-[var(--text-secondary)] ring-1 ring-[var(--border-default)] hover:bg-[var(--bg-card-hover)]",
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
                <h3 className="text-base font-semibold">Distance</h3>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                  Show events within {distance}km of your city.
                </p>
                <input
                  type="range"
                  min={5}
                  max={200}
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="mt-4 w-full accent-accent-500"
                />
                <div className="mt-1 flex justify-between text-xs text-[var(--text-tertiary)]">
                  <span>5 km</span>
                  <span>200 km</span>
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
                <h3 className="text-base font-semibold">Notifications</h3>
                <div className="mt-4 space-y-3">
                  <Toggle
                    icon={<Bell className="h-4 w-4" />}
                    label="Push notifications"
                    desc="Reminders before events you've saved"
                    on={notifs}
                    onChange={setNotifs}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({
  icon,
  label,
  desc,
  on,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--bg-card-hover)] text-[var(--text-secondary)]">
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-[var(--text-tertiary)]">{desc}</div>
        </div>
      </div>
      <button
        onClick={() => onChange(!on)}
        className={clsx(
          "relative h-6 w-11 rounded-full transition",
          on ? "bg-accent-500" : "bg-[var(--bg-card-hover)]",
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition",
            on ? "left-5" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}
