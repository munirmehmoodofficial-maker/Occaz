import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, MapPin, Calendar, Bell, LogOut, Edit3, Save, X, Building2, ArrowRight } from "lucide-react";
import { EventCard } from "../components/cards/EventCard";
import { OpportunityCard } from "../components/cards/OpportunityCard";
import { Button } from "../components/ui/Button";
import { useSaved } from "../hooks/useSaved";
import { useAuth } from "../lib/auth";
import { useEvents, useOpportunities } from "../hooks/useListings";
import { supabase } from "../lib/supabase";
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

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name ?? "");
    const meta = (user?.user_metadata as any) ?? {};
    setBio(meta.bio ?? "");
    setCity(meta.city ?? "");
  }, [profile, user]);

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
        preferences: {
          categories: cats,
          distanceKm: distance,
          notifications: notifs,
          newsletter: news,
        },
      })
      .eq("id", user.id);
    setSavingProfile(false);
    setEditing(false);
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "You";
  const initial = displayName.slice(0, 1).toUpperCase();
  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="page">
      <div className="container w-full max-w-3xl">
        {/* Compact profile card */}
        <div className="overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
          <div className="flex items-start gap-3 p-4 md:gap-4 md:p-5">
            {/* Avatar */}
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[var(--bg-card)] md:h-16 md:w-16"
              />
            ) : (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent-500 to-pink-500 text-xl font-bold text-white ring-2 ring-[var(--bg-card)] md:h-16 md:w-16">
                {initial}
              </div>
            )}

            {/* Name + meta + actions */}
            <div className="min-w-0 flex-1">
              {editing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="input w-full text-base font-semibold"
                />
              ) : (
                <h1 className="truncate text-base font-bold md:text-lg">
                  {displayName}
                </h1>
              )}
              <p className="truncate text-xs text-[var(--text-tertiary)]">
                {user?.email}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-tertiary)]">
                {editing ? (
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="input w-32 py-1 text-xs"
                  />
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {city || "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {joined}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-col gap-1.5">
              {editing ? (
                <>
                  <Button
                    size="sm"
                    onClick={saveProfile}
                    disabled={savingProfile}
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingProfile ? "Saving" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Bio */}
          {editing ? (
            <div className="px-4 pb-4 md:px-5">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="A short bio about you"
                className="input w-full text-sm"
              />
            </div>
          ) : bio ? (
            <div className="px-4 pb-3 text-xs text-[var(--text-secondary)] md:px-5">
              {bio}
            </div>
          ) : null}

          {/* Organizer status (inline pill) */}
          {profile?.is_organizer && (
            <div className="mx-4 mb-4 flex items-center justify-between gap-2 rounded-xl border border-violet-500/30 bg-violet-500/5 p-2.5 md:mx-5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet-500/20">
                  <Building2 className="h-3.5 w-3.5 text-violet-300" />
                </div>
                <div className="min-w-0 text-xs">
                  <div className="font-medium text-violet-200">Organizer</div>
                  <div className="truncate text-[10px] text-[var(--text-tertiary)]">
                    Manage events, profile & billing
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigate("/organizer")}
                leftIcon={<Building2 className="h-3.5 w-3.5" />}
              >
                Open
              </Button>
            </div>
          )}

          {!profile?.is_organizer && (
            <div className="mx-4 mb-4 flex items-center justify-between gap-2 rounded-xl border border-accent-500/30 bg-accent-500/5 p-2.5 md:mx-5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-accent-500/20">
                  <Building2 className="h-3.5 w-3.5 text-accent-300" />
                </div>
                <div className="min-w-0 text-xs">
                  <div className="font-medium text-accent-200">Become an organizer</div>
                  <div className="truncate text-[10px] text-[var(--text-tertiary)]">
                    Sell tickets, host events
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => navigate("/become-organizer")}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Start
              </Button>
            </div>
          )}

          {/* Category badges */}
          {cats.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-[var(--border-subtle)] px-4 py-2.5 md:px-5">
              {cats.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-3 flex w-fit gap-1 rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={clsx(
                "whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium transition",
                tab === t.key
                  ? "bg-white text-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "events" && (
          <div className="mt-3">
            {savedEvents.length === 0 ? (
              <div className="rounded-xl bg-[var(--bg-card)] p-6 text-center text-xs text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
                {loaded
                  ? "No saved events yet. Tap the bookmark on any event to save it."
                  : "Loading…"}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {savedEvents.map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    saved
                    onToggleSave={toggleEvent}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "opps" && (
          <div className="mt-3">
            {savedOpps.length === 0 ? (
              <div className="rounded-xl bg-[var(--bg-card)] p-6 text-center text-xs text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
                {loaded
                  ? "No saved opportunities yet."
                  : "Loading…"}
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {savedOpps.map((o) => (
                  <OpportunityCard
                    key={o.id}
                    opp={o}
                    saved
                    onToggleSave={toggleOpportunity}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "preferences" && (
          <div className="mt-3 space-y-3">
            <div className="rounded-xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
              <h3 className="text-sm font-semibold">Interested categories</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
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
                        "rounded-full px-2.5 py-1 text-[11px] transition",
                        on
                          ? "bg-white text-black"
                          : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] ring-1 ring-[var(--border-default)]",
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Distance</h3>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {distance} km
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={200}
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="mt-2 w-full accent-accent-500"
              />
            </div>

            <div className="rounded-xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
              <h3 className="text-sm font-semibold">Notifications</h3>
              <div className="mt-2 space-y-2">
                <PrefRow
                  icon={<Bell className="h-3.5 w-3.5" />}
                  label="Push notifications"
                  desc="Reminders for saved events"
                  on={notifs}
                  onChange={setNotifs}
                />
                <PrefRow
                  icon={<Mail className="h-3.5 w-3.5" />}
                  label="Email newsletter"
                  desc="New events & opportunities"
                  on={news}
                  onChange={setNews}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PrefRow({
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
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium">{label}</div>
          <div className="truncate text-[10px] text-[var(--text-tertiary)]">
            {desc}
          </div>
        </div>
      </div>
      <button
        onClick={() => onChange(!on)}
        className={clsx(
          "relative h-5 w-9 shrink-0 rounded-full transition",
          on ? "bg-accent-500" : "bg-[var(--bg-elevated)]",
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition",
            on ? "left-4" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}
