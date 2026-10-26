import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { EventListing, OpportunityListing } from "./mock";
import { seedIfEmpty } from "./seed";
import { resolveBlobUrl, resolveBlobUrls } from "../lib/blobResolver";

interface StoreCtx {
  events: EventListing[];
  opportunities: OpportunityListing[];
  loading: boolean;
  error: string | null;

  addEvent: (e: EventListing) => Promise<{ error: string | null }>;
  updateEvent: (id: string, patch: Partial<EventListing>) => Promise<{ error: string | null }>;
  removeEvent: (id: string) => Promise<{ error: string | null }>;

  addOpportunity: (o: OpportunityListing) => Promise<{ error: string | null }>;
  updateOpportunity: (id: string, patch: Partial<OpportunityListing>) => Promise<{ error: string | null }>;
  removeOpportunity: (id: string) => Promise<{ error: string | null }>;
}

const Ctx = createContext<StoreCtx | null>(null);

// ----------------------------- row → UI adapters ----------------------
type EventRow = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  gallery: string[] | null;
  category: string | null;
  city: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  mode: string | null;
  organizer: string | null;
  organizer_id: string | null;
  price: number | null;
  capacity: number | null;
  attendees: number | null;
  ticket_types: any[] | null;
  featured: boolean | null;
  published: boolean | null;
  registrations_open: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type OppRow = {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  gallery: string[] | null;
  category: string | null;
  city: string | null;
  mode: string | null;
  organizer: string | null;
  deadline: string | null;
  apply_url: string | null;
  stipend: string | null;
  has_stipend: boolean | null;
  price: number | null;
  currency: string | null;
  fee_type: string | null;
  fee_tiers: any[] | null;
  fee_period: string | null;
  requirements: string[] | null;
  eligibility: string[] | null;
  featured: boolean | null;
  published: boolean | null;
  registrations_open: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * Map of organizer_id → brand display name.
 * Used to show WHO listed an event/opportunity on every card.
 */
async function loadOrganizerNames(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const { data } = await supabase
      .from("organizer_profiles")
      .select("id, display_name, slug");
    for (const row of (data ?? []) as any[]) {
      const name = (row.display_name || row.slug || "").trim();
      if (row?.id && name) map.set(row.id, name);
    }
  } catch {
    // Non-fatal — fall back to the text column.
  }
  return map;
}

function rowToEvent(r: EventRow): EventListing {
  const gallery = Array.isArray(r.gallery) ? r.gallery : [];
  const image = r.image || gallery[0] || "";
  return {
    id: r.id,
    type: "event",
    title: r.title ?? "",
    description: r.description ?? "",
    image,
    gallery,
    category: (r.category as any) ?? "Workshops",
    organizer: r.organizer ?? "",
    organizerId: (r as any).organizer_id ?? undefined,
    city: r.city ?? r.location ?? "",
    mode: (r.mode as any) ?? "Physical",
    date: r.date ?? "",
    time: r.time ?? "",
    location: r.location ?? r.city ?? "",
    venue: r.location ?? r.city ?? "",
    price: Number(r.price ?? 0),
    currency: "PKR",
    capacity: Number(r.capacity ?? 0),
    attendees: Number(r.attendees ?? 0),
    ticketTypes: Array.isArray(r.ticket_types) ? r.ticket_types : [],
    featured: !!r.featured,
    published: r.published ?? true,
    registrationsOpen: r.registrations_open ?? true,
  };
}

function rowToOpp(r: OppRow): OpportunityListing {
  const gallery = Array.isArray(r.gallery) ? r.gallery : [];
  const image = r.image || gallery[0] || "";
  return {
    id: r.id,
    type: "opportunity",
    title: r.title ?? "",
    description: r.description ?? "",
    image,
    gallery,
    category: (r.category as any) ?? "Scholarships",
    organizer: r.organizer ?? "",
    organizerId: (r as any).organizer_id ?? undefined,
    city: r.city ?? "",
    location: r.city ?? "",
    mode: (r.mode as any) ?? "Online",
    deadline: r.deadline ?? "",
    requirements: Array.isArray(r.requirements) ? r.requirements : [],
    eligibility: Array.isArray(r.eligibility) ? r.eligibility : [],
    applyUrl: r.apply_url ?? "",
    stipend: r.stipend ?? "",
    hasStipend: r.has_stipend ?? !!r.stipend,
    feeType: ((r.fee_type as any) || "free") as "free" | "one_time" | "recurring",
    feeTiers: Array.isArray(r.fee_tiers) ? r.fee_tiers : [],
    feePeriod: r.fee_period ?? "",
    registrationsOpen: r.registrations_open ?? true,
    price: Number(r.price ?? 0),
    currency: r.currency ?? "PKR",
    featured: !!r.featured,
    published: r.published ?? true,
  };
}

function eventToRow(e: Partial<EventListing>): any {
  const r: any = {};
  if (e.id !== undefined) r.id = e.id;
  if (e.title !== undefined) r.title = e.title;
  if (e.description !== undefined) r.description = e.description;
  // Real schema: image is text (singular), gallery is jsonb
  if (e.image !== undefined && e.image) r.image = e.image;
  if (e.gallery !== undefined && e.gallery.length > 0) r.gallery = e.gallery;
  if (e.category !== undefined) r.category = e.category;
  if (e.organizer !== undefined) r.organizer = e.organizer;
  if (e.organizerId !== undefined) r.organizer_id = e.organizerId;
  if (e.city !== undefined) r.city = e.city;
  if (e.location !== undefined) r.location = e.location || e.city || "";
  if (e.date !== undefined) r.date = e.date || null;
  if (e.time !== undefined) r.time = e.time;
  if (e.mode !== undefined) r.mode = e.mode;
  if (e.price !== undefined) r.price = e.price;
  if (e.capacity !== undefined) r.capacity = e.capacity;
  if (e.attendees !== undefined) r.attendees = e.attendees;
  if (e.ticketTypes !== undefined) r.ticket_types = e.ticketTypes;
  if (e.featured !== undefined) r.featured = e.featured;
  if (e.published !== undefined) r.published = e.published;
  // Always set registrations_open — boolean (default true if not provided)
  r.registrations_open = e.registrationsOpen !== undefined ? !!e.registrationsOpen : true;
  r.updated_at = new Date().toISOString();
  return r;
}

function oppToRow(o: Partial<OpportunityListing>): any {
  const r: any = {};
  if (o.id !== undefined) r.id = o.id;
  if (o.title !== undefined) r.title = o.title;
  if (o.description !== undefined) r.description = o.description;
  // Real schema: image is text (singular), gallery is jsonb
  if (o.image !== undefined) r.image = o.image;
  if (o.gallery !== undefined) r.gallery = o.gallery;
  if (o.category !== undefined) r.category = o.category;
  if (o.city !== undefined) r.city = o.city;
  if (o.organizer !== undefined) r.organizer = o.organizer;
  if (o.organizerId !== undefined) r.organizer_id = o.organizerId;
  if (o.mode !== undefined) r.mode = o.mode;
  if (o.deadline !== undefined) r.deadline = o.deadline || null;
  if (o.applyUrl !== undefined) r.apply_url = o.applyUrl;
  if (o.stipend !== undefined) r.stipend = o.stipend;
  if (o.hasStipend !== undefined) r.has_stipend = o.hasStipend;
  if (o.price !== undefined) r.price = o.price;
  if (o.currency !== undefined) r.currency = o.currency;
  if (o.feeType !== undefined) r.fee_type = o.feeType;
  if (o.feeTiers !== undefined) r.fee_tiers = o.feeTiers;
  if (o.feePeriod !== undefined) r.fee_period = o.feePeriod;
  // Always set registrations_open — boolean (default true if not provided)
  r.registrations_open = o.registrationsOpen !== undefined ? !!o.registrationsOpen : true;
  if (o.requirements !== undefined) r.requirements = o.requirements;
  if (o.eligibility !== undefined) r.eligibility = o.eligibility;
  if (o.featured !== undefined) r.featured = o.featured;
  if (o.published !== undefined) r.published = o.published;
  r.updated_at = new Date().toISOString();
  return r;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventListing[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --------------------------- initial load ---------------------------
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    // First boot: seed the DB with the demo dataset if both tables are empty.
    await seedIfEmpty();
    const [eRes, oRes] = await Promise.all([
      supabase.from("events").select("*").order("created_at", { ascending: false }),
      supabase.from("opportunities").select("*").order("created_at", { ascending: false }),
    ]);
    if (eRes.error) setError(eRes.error.message);
    if (oRes.error) setError((prev) => prev ?? oRes.error!.message);

    // Resolve the real organizer brand name for every listing.
    //
    // Some legacy rows stored the EVENT TITLE in the `organizer` text column
    // (an old editor bug), and some rows have no `organizer` text at all.
    // When we know the owning organizer (organizer_id), we look up their
    // display_name and use that instead — so cards always show WHO listed
    // the event, never the event title.
    const orgNames = await loadOrganizerNames();
    const resolveOrganizer = (
      row: { organizer?: string | null; organizer_id?: string | null; title?: string | null },
    ): string => {
      const byId = row.organizer_id ? orgNames.get(row.organizer_id) : undefined;
      if (byId) return byId;
      const text = (row.organizer ?? "").trim();
      // The text column holds the title → useless as an organizer name.
      if (!text || text === (row.title ?? "").trim()) return "";
      return text;
    };

    // Resolve any legacy blob: URLs in the data by matching UUIDs
    // against the occaz storage bucket. Skip rows that don't have any.
    const needsResolve = (urls: string[]): boolean =>
      urls.some((u) => u && u.startsWith("blob:"));

    const eventsResolved = eRes.data
      ? await Promise.all(
          eRes.data.map(async (r) => {
            const event = rowToEvent(r as EventRow);
            const orgName = resolveOrganizer(r as any);
            const allUrls = [event.image, ...event.gallery].filter(Boolean) as string[];
            if (!needsResolve(allUrls)) {
              return orgName ? { ...event, organizer: orgName } : event;
            }
            return {
              ...event,
              organizer: orgName || event.organizer,
              image: (await resolveBlobUrl(event.image)) ?? event.image,
              gallery: await resolveBlobUrls(event.gallery),
            };
          }),
        )
      : [];
    const oppsResolved = oRes.data
      ? await Promise.all(
          oRes.data.map(async (r) => {
            const opp = rowToOpp(r as OppRow);
            const orgName = resolveOrganizer(r as any);
            const allUrls = [opp.image, ...opp.gallery].filter(Boolean) as string[];
            if (!needsResolve(allUrls)) {
              return orgName ? { ...opp, organizer: orgName } : opp;
            }
            return {
              ...opp,
              organizer: orgName || opp.organizer,
              image: (await resolveBlobUrl(opp.image)) ?? opp.image,
              gallery: await resolveBlobUrls(opp.gallery),
            };
          }),
        )
      : [];

    setEvents(eventsResolved);
    setOpportunities(oppsResolved);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // --------------------------- realtime -------------------------------
  useEffect(() => {
    const channel = supabase
      .channel("occaz-listings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload) => {
          // Re-resolve the organizer name — a realtime row may carry the
          // legacy "organizer = event title" value.
          const applyOrganizer = async (e: EventListing): Promise<EventListing> => {
            const row = payload.new as any;
            if (!row?.organizer_id) return e;
            const names = await loadOrganizerNames();
            const name = names.get(row.organizer_id);
            return name ? { ...e, organizer: name } : e;
          };
          if (payload.eventType === "INSERT") {
            setEvents((prev) => {
              if (prev.some((e) => e.id === (payload.new as any).id)) return prev;
              const next = rowToEvent(payload.new as EventRow);
              void applyOrganizer(next).then((resolved) => {
                setEvents((p2) => p2.map((e) => (e.id === resolved.id ? resolved : e)));
              });
              return [next, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setEvents((prev) =>
              prev.map((e) => {
                if (e.id !== (payload.new as any).id) return e;
                const next = rowToEvent(payload.new as EventRow);
                void applyOrganizer(next).then((resolved) => {
                  setEvents((p2) => p2.map((x) => (x.id === resolved.id ? resolved : x)));
                });
                return next;
              }),
            );
          } else if (payload.eventType === "DELETE") {
            setEvents((prev) =>
              prev.filter((e) => e.id !== (payload.old as any).id),
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "opportunities" },
        (payload) => {
          const applyOrganizer = async (o: OpportunityListing): Promise<OpportunityListing> => {
            const row = payload.new as any;
            if (!row?.organizer_id) return o;
            const names = await loadOrganizerNames();
            const name = names.get(row.organizer_id);
            return name ? { ...o, organizer: name } : o;
          };
          if (payload.eventType === "INSERT") {
            setOpportunities((prev) => {
              if (prev.some((o) => o.id === (payload.new as any).id)) return prev;
              const next = rowToOpp(payload.new as OppRow);
              void applyOrganizer(next).then((resolved) => {
                setOpportunities((p2) =>
                  p2.map((o) => (o.id === resolved.id ? resolved : o)),
                );
              });
              return [next, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setOpportunities((prev) =>
              prev.map((o) => {
                if (o.id !== (payload.new as any).id) return o;
                const next = rowToOpp(payload.new as OppRow);
                void applyOrganizer(next).then((resolved) => {
                  setOpportunities((p2) =>
                    p2.map((x) => (x.id === resolved.id ? resolved : x)),
                  );
                });
                return next;
              }),
            );
          } else if (payload.eventType === "DELETE") {
            setOpportunities((prev) =>
              prev.filter((o) => o.id !== (payload.old as any).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --------------------------- mutations ------------------------------
  const addEvent = useCallback(async (e: EventListing) => {
    const { error } = await supabase.from("events").insert(eventToRow(e));
    return { error: error?.message ?? null };
  }, []);

  const updateEvent = useCallback(
    async (id: string, patch: Partial<EventListing>) => {
      const { error } = await supabase
        .from("events")
        .update(eventToRow(patch))
        .eq("id", id);
      return { error: error?.message ?? null };
    },
    [],
  );

  const removeEvent = useCallback(async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    return { error: error?.message ?? null };
  }, []);

  const addOpportunity = useCallback(async (o: OpportunityListing) => {
    const { error } = await supabase
      .from("opportunities")
      .insert(oppToRow(o));
    return { error: error?.message ?? null };
  }, []);

  const updateOpportunity = useCallback(
    async (id: string, patch: Partial<OpportunityListing>) => {
      const { error } = await supabase
        .from("opportunities")
        .update(oppToRow(patch))
        .eq("id", id);
      return { error: error?.message ?? null };
    },
    [],
  );

  const removeOpportunity = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("opportunities")
      .delete()
      .eq("id", id);
    return { error: error?.message ?? null };
  }, []);

  const value = useMemo<StoreCtx>(
    () => ({
      events,
      opportunities,
      loading,
      error,
      addEvent,
      updateEvent,
      removeEvent,
      addOpportunity,
      updateOpportunity,
      removeOpportunity,
    }),
    [
      events,
      opportunities,
      loading,
      error,
      addEvent,
      updateEvent,
      removeEvent,
      addOpportunity,
      updateOpportunity,
      removeOpportunity,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDataStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDataStore must be used inside DataProvider");
  return v;
}
