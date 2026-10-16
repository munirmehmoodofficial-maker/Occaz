import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Plus, Filter, Search } from "lucide-react";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

/**
 * Section 2 — My Events
 * List of events created by this organizer, with create/edit/delete.
 */
export function Section2Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft" | "past">("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("id, title, date, time, city, category, image, price, published, featured, capacity, attendees")
        .eq("organizer_id", user.id)
        .order("date", { ascending: false });
      setEvents(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);
  const filtered = events.filter((e) => {
    if (q && !`${e.title} ${e.city ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (status === "published" && !e.published) return false;
    if (status === "draft" && e.published) return false;
    if (status === "past" && e.date >= today) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">My events</h2>
          <p className="text-xs text-zinc-500">
            Create, edit, and publish your events
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:opacity-90">
          <Plus className="h-4 w-4" /> New event
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/5 bg-[var(--bg-card)] px-3 py-2">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-white/5 bg-[var(--bg-card)] p-1">
          {["all", "published", "draft", "past"].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s as any)}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize " +
                (status === s
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-8 text-center text-sm text-zinc-500">
          Loading events…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[var(--bg-card)] p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-zinc-600" />
          <h3 className="mt-3 text-base font-semibold text-white">
            No events yet
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Create your first event to start selling tickets.
          </p>
          <button className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-pink-500/15 px-4 py-2 text-sm font-semibold text-pink-300 hover:bg-pink-500/25">
            <Plus className="h-4 w-4" /> Create event
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="overflow-hidden rounded-2xl border border-white/5 bg-[var(--bg-card)]"
            >
              <div className="relative aspect-[16/9] bg-zinc-900">
                {e.image ? (
                  <img
                    src={e.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-zinc-700">
                    <Calendar className="h-8 w-8" />
                  </div>
                )}
                <span
                  className={
                    "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                    (e.published
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300")
                  }
                >
                  {e.published ? "Live" : "Draft"}
                </span>
              </div>
              <div className="p-3">
                <div className="line-clamp-1 text-sm font-semibold text-white">
                  {e.title}
                </div>
                <div className="mt-0.5 text-[10px] text-zinc-500">
                  {e.date ? new Date(e.date).toLocaleDateString() : "—"} ·{" "}
                  {e.city ?? "—"}
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{e.attendees ?? 0} registered</span>
                  <span>₨ {Number(e.price ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-[10px] text-zinc-600">
        Full event editor with ticket types, deadlines, and image gallery — Phase 1b build.
      </p>
    </div>
  );
}
