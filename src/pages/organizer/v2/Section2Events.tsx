import { useEffect, useState } from "react";
import { Calendar, Plus, Search, Edit3, Trash2, Eye, EyeOff, Star, Copy, Send, Sparkles } from "lucide-react";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../lib/toast";
import { EventEditorModal } from "./EventEditorModal";

/**
 * Section 2 — My Events
 * Full CRUD: create / edit / publish / unpublish / delete
 */
export function Section2Events() {
  const { user, profile } = useAuth();
  const { push } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft" | "past">("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const isAdminUser = profile?.role === "admin";

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("events")
        .select("id, title, date, time, city, category, image, price, published, featured, capacity, attendees, ticket_types")
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

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }
  function openEdit(ev: any) {
    setEditing(ev);
    setEditorOpen(true);
  }
  function onSaved(e: any) {
    setEditorOpen(false);
    // Re-fetch
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, date, time, city, category, image, price, published, featured, capacity, attendees, ticket_types")
        .eq("organizer_id", user!.id)
        .order("date", { ascending: false });
      setEvents(data ?? []);
    })();
  }

  async function togglePublish(ev: any) {
    setBusyId(ev.id);
    const { error } = await supabase
      .from("events")
      .update({ published: !ev.published })
      .eq("id", ev.id);
    setBusyId(null);
    if (error) {
      push({ tone: "red", title: "Failed", message: error.message });
      return;
    }
    setEvents((es) =>
      es.map((e) => (e.id === ev.id ? { ...e, published: !ev.published } : e)),
    );
    push({
      tone: "green",
      title: ev.published ? "Unpublished" : "Published",
      message: ev.published ? "Event hidden from attendees." : "Event is live.",
    });
  }

  async function toggleFeatured(ev: any) {
    setBusyId(ev.id);
    const { error } = await supabase
      .from("events")
      .update({ featured: !ev.featured })
      .eq("id", ev.id);
    setBusyId(null);
    if (error) {
      push({ tone: "red", title: "Failed", message: error.message });
      return;
    }
    setEvents((es) =>
      es.map((e) => (e.id === ev.id ? { ...e, featured: !ev.featured } : e)),
    );
  }

  async function remove(ev: any) {
    if (!confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    setBusyId(ev.id);
    const { error } = await supabase.from("events").delete().eq("id", ev.id);
    setBusyId(null);
    if (error) {
      push({ tone: "red", title: "Delete failed", message: error.message });
      return;
    }
    setEvents((es) => es.filter((e) => e.id !== ev.id));
    push({ tone: "green", title: "Event deleted", message: "Removed from your list." });
  }

  function duplicate(ev: any) {
    setEditing({
      ...ev,
      id: undefined,
      title: `${ev.title} (copy)`,
      published: false,
    });
    setEditorOpen(true);
  }

  function shareLink(ev: any) {
    const url = `${window.location.origin}/events/${ev.id}`;
    navigator.clipboard?.writeText(url);
    push({ tone: "green", title: "Link copied", message: url });
  }

  return (
    <div className="space-y-4">
      {isAdminUser && (
        <div className="flex items-center gap-2 rounded-2xl border border-pink-500/30 bg-pink-500/10 p-3 text-sm text-pink-100">
          <Sparkles className="h-4 w-4 text-pink-300" />
          <div>
            <div className="font-semibold text-pink-200">Admin mode — unlimited events, all features</div>
            <div className="text-xs text-pink-100/80">
              You're viewing this organizer dashboard as the admin. There's no event limit, no plan gate, and no plan switch needed.
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">My events</h2>
          <p className="text-xs text-zinc-500">
            Create, edit, and publish your events
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New event
        </button>
      </div>

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

      {loading ? (
        <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-8 text-center text-sm text-zinc-500">
          Loading events…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[var(--bg-card)] p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-zinc-600" />
          <h3 className="mt-3 text-base font-semibold text-white">
            {events.length === 0 ? "No events yet" : "No events match your filter"}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Create your first event to start selling tickets.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-pink-500/15 px-4 py-2 text-sm font-semibold text-pink-300 hover:bg-pink-500/25"
          >
            <Plus className="h-4 w-4" /> Create event
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => {
            const isBusy = busyId === e.id;
            return (
              <div
                key={e.id}
                className="group overflow-hidden rounded-2xl border border-white/5 bg-[var(--bg-card)]"
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
                  <div className="absolute right-2 top-2 flex flex-col gap-1">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                        (e.published
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300")
                      }
                    >
                      {e.published ? "Live" : "Draft"}
                    </span>
                    {e.featured && (
                      <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pink-300">
                        <Star className="mr-1 inline h-2.5 w-2.5 fill-current" />
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <div className="line-clamp-1 text-sm font-semibold text-white">
                    {e.title}
                  </div>
                  <div className="mt-0.5 text-[10px] text-zinc-500">
                    {e.date ? new Date(e.date).toLocaleDateString() : "—"} · {e.city ?? "—"}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>{e.attendees ?? 0} registered</span>
                    <span>₨ {Number(e.price ?? 0).toLocaleString()}</span>
                  </div>
                  {/* Action buttons */}
                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    <button
                      onClick={() => openEdit(e)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-semibold text-zinc-200 hover:bg-white/10 disabled:opacity-50"
                      title="Edit"
                    >
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => duplicate(e)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-semibold text-zinc-200 hover:bg-white/10 disabled:opacity-50"
                      title="Duplicate"
                    >
                      <Copy className="h-3 w-3" /> Duplicate
                    </button>
                    <button
                      onClick={() => togglePublish(e)}
                      disabled={isBusy}
                      className={
                        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold disabled:opacity-50 " +
                        (e.published
                          ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                          : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25")
                      }
                      title={e.published ? "Unpublish" : "Publish"}
                    >
                      {e.published ? (
                        <>
                          <EyeOff className="h-3 w-3" /> Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" /> Publish
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => toggleFeatured(e)}
                      disabled={isBusy}
                      className={
                        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold disabled:opacity-50 " +
                        (e.featured
                          ? "bg-pink-500/20 text-pink-300"
                          : "bg-white/5 text-zinc-200 hover:bg-white/10")
                      }
                      title="Toggle featured"
                    >
                      <Star
                        className={
                          "h-3 w-3 " + (e.featured ? "fill-current" : "")
                        }
                      />
                    </button>
                    <button
                      onClick={() => shareLink(e)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px] font-semibold text-zinc-200 hover:bg-white/10 disabled:opacity-50"
                      title="Copy share link"
                    >
                      <Send className="h-3 w-3" /> Share
                    </button>
                    <button
                      onClick={() => remove(e)}
                      disabled={isBusy}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-2 py-1 text-[10px] font-semibold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editorOpen && (
        <EventEditorModal
          initial={editing}
          onClose={() => setEditorOpen(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
