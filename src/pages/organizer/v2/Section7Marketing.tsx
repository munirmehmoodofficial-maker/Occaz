import { Megaphone, Star, Tag, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../lib/toast";

/**
 * Section 7 — Marketing & Promotion
 * Featured events, promo codes.
 */
export function Section7Marketing() {
  const { user } = useAuth();
  const { push } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: evs } = await supabase
        .from("events")
        .select("id, title, image, date, featured, published")
        .eq("organizer_id", user.id)
        .order("date", { ascending: false });
      setEvents(evs ?? []);
      const { data: cps } = await supabase
        .from("coupons")
        .select("id, code, kind, amount, plan, redemptions, max_redemptions, active, valid_until")
        .order("created_at", { ascending: false });
      setCoupons(cps ?? []);
      setLoading(false);
    })();
  }, [user]);

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await supabase
      .from("events")
      .update({ featured: !current })
      .eq("id", id);
    if (error) {
      push({ tone: "red", title: "Update failed", message: error.message });
      return;
    }
    setEvents((evs) => evs.map((e) => (e.id === id ? { ...e, featured: !current } : e)));
    push({
      tone: "green",
      title: current ? "Removed from featured" : "Marked as featured",
      message: "Saved.",
    });
  }

  function shareLink(e: any) {
    const url = `${window.location.origin}/events/${e.id}`;
    navigator.clipboard?.writeText(url);
    push({ tone: "green", title: "Link copied", message: url });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Marketing & promotion</h2>
        <p className="text-xs text-zinc-500">
          Feature events, share links, manage promo codes
        </p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Featured events</h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Featured events show up first in the homepage feed
            </p>
          </div>
        </div>
        {loading ? (
          <div className="mt-3 text-sm text-zinc-500">Loading…</div>
        ) : events.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-500">
            No events to feature yet.
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {events.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3"
              >
                <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-zinc-900">
                  {e.image ? (
                    <img src={e.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Megaphone className="h-4 w-4 text-zinc-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{e.title}</div>
                  <div className="text-[10px] text-zinc-500">
                    {e.published ? "Live" : "Draft"} · {e.date ? new Date(e.date).toLocaleDateString() : "—"}
                  </div>
                </div>
                <button
                  onClick={() => shareLink(e)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
                  title="Copy link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleFeatured(e.id, e.featured)}
                  className={
                    "rounded-lg px-2.5 py-1 text-[11px] font-semibold " +
                    (e.featured
                      ? "bg-pink-500/20 text-pink-300"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10")
                  }
                >
                  <Star
                    className={
                      "mr-1 inline h-3 w-3 " + (e.featured ? "fill-current" : "")
                    }
                  />
                  {e.featured ? "Featured" : "Feature"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Promo codes</h3>
          <button className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10">
            + New code
          </button>
        </div>
        {coupons.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-500">
            No promo codes yet. Create your first one to give attendees a discount.
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3"
              >
                <Tag className="h-4 w-4 text-pink-300" />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm font-semibold text-white">
                    {c.code}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {c.kind === "percent"
                      ? `${c.amount}% off`
                      : `₨ ${c.amount} off`}{" "}
                    · {c.redemptions ?? 0}/{c.max_redemptions ?? "∞"} used
                  </div>
                </div>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                    (c.active
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-zinc-500/15 text-zinc-300")
                  }
                >
                  {c.active ? "Active" : "Disabled"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
