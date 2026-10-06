import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Star,
  Sparkles,
  ChevronRight,
  MapPin,
  Users,
  Banknote,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../lib/auth";
import { useDataStore } from "../../data/store";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../lib/toast";
import { supabase } from "../../lib/supabase";
import clsx from "clsx";

type Status = "all" | "live" | "draft" | "ended";
type Sort = "newest" | "oldest" | "popular" | "revenue";

export function OrganizerEventsPage() {
  const { user } = useAuth();
  const { events, removeEvent, updateEvent } = useDataStore();
  const { push } = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [regCounts, setRegCounts] = useState<Record<string, number>>({});

  // Filter to events owned by this organizer (match by organizer name or owner)
  const myOrgName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const myEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          e.organizer === myOrgName ||
          (e as any).created_by === user?.id ||
          (e as any).organizer_id === user?.id,
      ),
    [events, user, myOrgName],
  );

  // Filter + sort
  const filtered = useMemo(() => {
    let list = myEvents.filter((e) => {
      if (q && !e.title.toLowerCase().includes(q.toLowerCase()) && !e.city.toLowerCase().includes(q.toLowerCase()))
        return false;
      if (status === "live" && !e.published) return false;
      if (status === "draft" && e.published) return false;
      if (status === "ended") {
        const d = new Date(e.date);
        if (d > new Date()) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "popular":
          return (b.attendees ?? 0) - (a.attendees ?? 0);
        case "revenue":
          return b.price * (b.attendees ?? 0) - a.price * (a.attendees ?? 0);
      }
    });
    return list;
  }, [myEvents, q, status, sort]);

  // Load registration counts for each event
  useEffect(() => {
    let alive = true;
    (async () => {
      if (myEvents.length === 0) return;
      const ids = myEvents.map((e) => e.id);
      const { data, error } = await supabase
        .from("registrations")
        .select("id, event_id, status")
        .in("event_id", ids);
      if (!alive || error) return;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        if (r.status !== "cancelled") {
          counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
        }
      });
      setRegCounts(counts);
    })();
    return () => {
      alive = false;
    };
  }, [myEvents]);

  async function togglePublish(id: string, current: boolean) {
    setTogglingId(id);
    const res = await updateEvent(id, { published: !current });
    setTogglingId(null);
    if (res.error) push("err", res.error);
    else
      push(
        "ok",
        current ? "Event unpublished" : "Event published — now live on Occaz",
      );
  }

  async function toggleFeatured(id: string, current: boolean) {
    setTogglingId(id);
    const res = await updateEvent(id, { featured: !current });
    setTogglingId(null);
    if (res.error) push("err", res.error);
    else push("ok", current ? "Removed from featured" : "Featured on Occaz");
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const res = await removeEvent(deleteId);
    setDeleteId(null);
    if (res.error) push("err", res.error);
    else push("ok", "Event deleted");
  }

  const counts = {
    all: myEvents.length,
    live: myEvents.filter((e) => e.published).length,
    draft: myEvents.filter((e) => !e.published).length,
    ended: myEvents.filter((e) => new Date(e.date) < new Date()).length,
  };

  return (
    <div className="page pb-20">
      <div className="container">
        {/* Header */}
        <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Organizer
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">My events</h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              All events you've published on Occaz
            </p>
          </div>
          <Link to="/admin/events">
            <Button leftIcon={<Plus className="h-4 w-4" />}>New event</Button>
          </Link>
        </div>

        {/* Tabs + Search */}
        <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-[var(--border-subtle)]">
          {(["all", "live", "draft", "ended"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={clsx(
                "border-b-2 px-4 py-2.5 text-sm font-medium transition",
                status === s
                  ? "border-accent-500 text-white"
                  : "border-transparent text-[var(--text-tertiary)] hover:text-white",
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 text-xs opacity-70">({counts[s]})</span>
            </button>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-2 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title, city…"
                className="input min-w-[220px] py-2 pl-9 text-sm"
              />
            </div>
            <SortDropdown sort={sort} setSort={setSort} />
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-[var(--text-tertiary)]" />
            <h3 className="mt-3 text-lg font-semibold">
              {myEvents.length === 0 ? "No events yet" : "No events match your filters"}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              {myEvents.length === 0
                ? "Create your first event to start getting registrations"
                : "Try clearing filters or searching for something else"}
            </p>
            {myEvents.length === 0 && (
              <Link to="/admin/events" className="mt-4 inline-block">
                <Button leftIcon={<Plus className="h-4 w-4" />}>Create your first event</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((e) => {
              const isPast = new Date(e.date) < new Date();
              const regCount = regCounts[e.id] ?? e.attendees ?? 0;
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-accent-500/30"
                >
                  {/* Image */}
                  <Link
                    to={`/events/${e.id}`}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-elevated)]"
                  >
                    {e.image ? (
                      <img
                        src={e.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-2xl font-bold text-white/20">
                        {e.title.charAt(0)}
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/events/${e.id}`}
                        className="truncate font-semibold hover:text-accent-400"
                      >
                        {e.title}
                      </Link>
                      {e.featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/15 px-2 py-0.5 text-[10px] font-medium text-accent-300 ring-1 ring-accent-500/30">
                          <Sparkles className="h-2.5 w-2.5" /> Featured
                        </span>
                      )}
                      {isPast ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/15 px-2 py-0.5 text-[10px] font-medium text-zinc-300 ring-1 ring-zinc-500/30">
                          <Clock className="h-2.5 w-2.5" /> Ended
                        </span>
                      ) : e.published ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300 ring-1 ring-amber-500/30">
                          <XCircle className="h-2.5 w-2.5" /> Draft
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(e.date).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {e.city || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {regCount} registered
                      </span>
                      <span className="flex items-center gap-1">
                        <Banknote className="h-3 w-3" />
                        {e.price === 0
                          ? "Free"
                          : `₨ ${e.price.toLocaleString()} · ₨ ${(e.price * regCount).toLocaleString()} earned`}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => togglePublish(e.id, e.published)}
                      disabled={togglingId === e.id}
                      className={clsx(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                        e.published
                          ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25"
                          : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30 hover:bg-amber-500/25",
                      )}
                    >
                      {togglingId === e.id ? "…" : e.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => toggleFeatured(e.id, e.featured)}
                      disabled={togglingId === e.id}
                      className={clsx(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                        e.featured
                          ? "bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/30"
                          : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-accent-300",
                      )}
                    >
                      <Star
                        className={clsx("h-3 w-3", e.featured && "fill-current")}
                      />
                    </button>
                    <Link to={`/events/${e.id}`}>
                      <button
                        className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-elevated)] hover:text-white"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                    <Link to={`/admin/events`}>
                      <button
                        className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-elevated)] hover:text-white"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                    <button
                      onClick={() => setDeleteId(e.id)}
                      className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition hover:bg-red-500/15 hover:text-red-300"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Delete confirmation */}
        {deleteId && (
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur"
            onClick={() => setDeleteId(null)}
          >
            <div
              className="w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold">Delete this event?</h3>
              <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                This will permanently remove the event and all its registrations. This cannot be undone.
              </p>
              <div className="mt-5 flex gap-3">
                <Button
                  fullWidth
                  variant="outline"
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  variant="danger"
                  onClick={confirmDelete}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                >
                  Delete event
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SortDropdown({ sort, setSort }: { sort: Sort; setSort: (s: Sort) => void }) {
  const [open, setOpen] = useState(false);
  const labels: Record<Sort, string> = {
    newest: "Newest first",
    oldest: "Oldest first",
    popular: "Most popular",
    revenue: "Highest revenue",
  };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white"
      >
        <Filter className="h-3.5 w-3.5" />
        {labels[sort]}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl">
            {(Object.keys(labels) as Sort[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSort(s);
                  setOpen(false);
                }}
                className={clsx(
                  "block w-full px-4 py-2 text-left text-sm transition",
                  sort === s
                    ? "bg-accent-500/10 text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]",
                )}
              >
                {labels[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
