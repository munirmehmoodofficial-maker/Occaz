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
  fee_period: string | null;
  requirements: string[] | null;
  eligibility: string[] | null;
  featured: boolean | null;
  published: boolean | null;
  registrations_open: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

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
  if (e.registrationsOpen !== undefined) r.registrations_open = e.registrationsOpen;
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
  if (o.mode !== undefined) r.mode = o.mode;
  if (o.deadline !== undefined) r.deadline = o.deadline || null;
  if (o.applyUrl !== undefined) r.apply_url = o.applyUrl;
  if (o.stipend !== undefined) r.stipend = o.stipend;
  if (o.hasStipend !== undefined) r.has_stipend = o.hasStipend;
  if (o.price !== undefined) r.price = o.price;
  if (o.currency !== undefined) r.currency = o.currency;
  if (o.feeType !== undefined) r.fee_type = o.feeType;
  if (o.feePeriod !== undefined) r.fee_period = o.feePeriod;
  if (o.registrationsOpen !== undefined) r.registrations_open = o.registrationsOpen;
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

    // Resolve any legacy blob: URLs in the data by matching UUIDs
    // against the occaz storage bucket. Skip rows that don't have any.
    const needsResolve = (urls: string[]): boolean =>
      urls.some((u) => u && u.startsWith("blob:"));

    const eventsResolved = eRes.data
      ? await Promise.all(
          eRes.data.map(async (r) => {
            const event = rowToEvent(r as EventRow);
            const allUrls = [event.image, ...event.gallery].filter(Boolean) as string[];
            if (!needsResolve(allUrls)) return event;
            return {
              ...event,
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
            const allUrls = [opp.image, ...opp.gallery].filter(Boolean) as string[];
            if (!needsResolve(allUrls)) return opp;
            return {
              ...opp,
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
          if (payload.eventType === "INSERT") {
            setEvents((prev) => {
              if (prev.some((e) => e.id === (payload.new as any).id)) return prev;
              return [rowToEvent(payload.new as EventRow), ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setEvents((prev) =>
              prev.map((e) =>
                e.id === (payload.new as any).id
                  ? rowToEvent(payload.new as EventRow)
                  : e,
              ),
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
          if (payload.eventType === "INSERT") {
            setOpportunities((prev) => {
              if (prev.some((o) => o.id === (payload.new as any).id)) return prev;
              return [rowToOpp(payload.new as OppRow), ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setOpportunities((prev) =>
              prev.map((o) =>
                o.id === (payload.new as any).id
                  ? rowToOpp(payload.new as OppRow)
                  : o,
              ),
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
