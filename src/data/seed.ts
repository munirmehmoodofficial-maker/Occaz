import { supabase } from "../lib/supabase";
import {
  events as seedEvents,
  opportunities as seedOpps,
} from "./mock";

function eventToJson(e: any) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    image: e.image,
    gallery: e.gallery ?? [],
    category: e.category,
    organizer: e.organizer,
    city: e.city,
    mode: e.mode,
    date: e.date || "",
    time: e.time,
    location: e.location || e.city,
    price: e.price,
    capacity: e.capacity,
    attendees: e.attendees,
    ticket_types: e.ticketTypes ?? [],
    featured: !!e.featured,
    published: e.published ?? true,
  };
}

function oppToJson(o: any) {
  return {
    id: o.id,
    title: o.title,
    description: o.description,
    image: o.image,
    gallery: o.gallery ?? [],
    category: o.category,
    organizer: o.organizer,
    city: o.city,
    mode: o.mode,
    deadline: o.deadline || "",
    requirements: o.requirements ?? [],
    eligibility: o.eligibility ?? [],
    apply_url: o.applyUrl ?? "",
    stipend: o.stipend ?? "",
    price: o.price ?? 0,
    currency: o.currency ?? "PKR",
    featured: !!o.featured,
    published: o.published ?? true,
  };
}

/**
 * Idempotently seeds the demo dataset into the database by calling the
 * `seed_demo_data` RPC, which only inserts when the tables are empty.
 */
export async function seedIfEmpty(): Promise<{
  ok: boolean;
  eventsInserted: number;
  oppsInserted: number;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase.rpc("seed_demo_data", {
      p_events: seedEvents.map(eventToJson),
      p_opportunities: seedOpps.map(oppToJson),
    });
    if (error) {
      return {
        ok: false,
        eventsInserted: 0,
        oppsInserted: 0,
        error: error.message,
      };
    }
    return {
      ok: true,
      eventsInserted: (data as any)?.eventsInserted ?? 0,
      oppsInserted: (data as any)?.oppsInserted ?? 0,
      error: null,
    };
  } catch (e: any) {
    return {
      ok: false,
      eventsInserted: 0,
      oppsInserted: 0,
      error: e?.message ?? String(e),
    };
  }
}
