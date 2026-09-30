import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

type Saved = {
  events: string[];
  opportunities: string[];
};

const empty: Saved = { events: [], opportunities: [] };

/**
 * Bookmarks are stored in the `saved_items` table.
 * Columns: id (uuid), user_id (uuid), event_id (uuid, nullable), created_at.
 *
 * Since `saved_items` only has `event_id` (no opportunity_id), we encode
 * the kind in a special id pattern: id starts with "opp-" for opportunities.
 * This is fine — `id` is just the primary key, it's freeform.
 */
export function useSaved() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<Saved>(empty);
  const [loaded, setLoaded] = useState(false);

  // load on user change
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) {
        setSaved(empty);
        setLoaded(true);
        return;
      }
      setLoaded(false);
      const { data, error } = await supabase
        .from("saved_items")
        .select("id, event_id")
        .eq("user_id", user.id);
      if (!alive) return;
      if (error) {
        setSaved(empty);
      } else {
        const events: string[] = [];
        const opportunities: string[] = [];
        (data ?? []).forEach((r: any) => {
          if (typeof r.id === "string" && r.id.startsWith("opp:")) {
            opportunities.push(r.id.slice(4));
          } else if (r.event_id) {
            events.push(r.event_id);
          }
        });
        setSaved({ events, opportunities });
      }
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const persist = useCallback(
    async (kind: "event" | "opportunity", id: string, isSaved: boolean) => {
      if (!user) return;
      if (isSaved) {
        if (kind === "event") {
          await supabase
            .from("saved_items")
            .delete()
            .eq("user_id", user.id)
            .eq("event_id", id);
        } else {
          await supabase
            .from("saved_items")
            .delete()
            .eq("user_id", user.id)
            .eq("id", `opp:${id}`);
        }
      } else {
        if (kind === "event") {
          await supabase.from("saved_items").insert({
            user_id: user.id,
            event_id: id,
          });
        } else {
          // Opportunities aren't in saved_items directly — store by `id` prefix
          await supabase.from("saved_items").insert({
            id: `opp:${id}`,
            user_id: user.id,
            event_id: null,
          });
        }
      }
    },
    [user],
  );

  const toggleEvent = useCallback(
    (id: string) => {
      const has = saved.events.includes(id);
      setSaved((prev) => ({
        ...prev,
        events: has ? prev.events.filter((x) => x !== id) : [...prev.events, id],
      }));
      void persist("event", id, has);
    },
    [saved.events, persist],
  );

  const toggleOpportunity = useCallback(
    (id: string) => {
      const has = saved.opportunities.includes(id);
      setSaved((prev) => ({
        ...prev,
        opportunities: has
          ? prev.opportunities.filter((x) => x !== id)
          : [...prev.opportunities, id],
      }));
      void persist("opportunity", id, has);
    },
    [saved.opportunities, persist],
  );

  return {
    saved,
    loaded,
    toggleEvent,
    toggleOpportunity,
    isEventSaved: (id: string) => saved.events.includes(id),
    isOpportunitySaved: (id: string) => saved.opportunities.includes(id),
  };
}
