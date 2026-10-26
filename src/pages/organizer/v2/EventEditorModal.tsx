import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save, Image as ImageIcon, Trash2, Plus, Ticket as TicketIcon } from "lucide-react";
import { useAuth } from "../../../lib/auth";
import { useToast } from "../../../lib/toast";
import { supabase } from "../../../lib/supabase";
import { categories as mockCategories } from "../../../data/mock";
import { useCategories } from "../../../hooks/useCategories";
import { SingleImageDrop } from "../../../components/admin/SingleImageDrop";

type TicketType = {
  id: string;
  name: string;
  price: number;
  qty: number;
  sold: number;
};

type EventForm = {
  id?: string;
  title: string;
  description: string;
  category: string;
  city: string;
  location: string;
  date: string;
  time: string;
  mode: "Online" | "Physical";
  image: string;
  gallery?: string[];
  capacity: number;
  ticket_types: TicketType[];
  featured: boolean;
  published: boolean;
  registrationsOpen: boolean;
  registration_deadline?: string;
  sales_start?: string;
  sales_end?: string;
};

const DEFAULT_FORM: EventForm = {
  title: "",
  description: "",
  category: mockCategories[0],
  city: "Karachi",
  location: "",
  date: "",
  time: "20:00",
  mode: "Physical",
  image: "",
  capacity: 100,
  ticket_types: [
    { id: "tt-1", name: "General", price: 500, qty: 100, sold: 0 },
  ],
  featured: false,
  published: true,
  registrationsOpen: true,
};

export function EventEditorModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: EventForm | null;
  onClose: () => void;
  onSaved: (e: any) => void;
}) {
  const { user } = useAuth();
  const { push } = useToast();
  const [form, setForm] = useState<EventForm>(initial ?? DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  // The organizer's brand name (display_name) — cached so the event's
  // `organizer` field always holds the ORGANIZER, not the event title.
  const [organizerNameCache, setOrganizerNameCache] = useState("");

  // Live categories from the admin-managed `categories` table.
  // Falls back to the hardcoded mock list on first paint, so the form
  // is never empty while the network request is in flight.
  const dbCategories = useCategories("event");
  const categoryOptions = useMemo(() => {
    const names = new Set<string>();
    const out: string[] = [];
    for (const c of dbCategories) {
      if (!names.has(c.name)) {
        names.add(c.name);
        out.push(c.name);
      }
    }
    for (const c of mockCategories) {
      if (!names.has(c)) {
        names.add(c);
        out.push(c);
      }
    }
    return out;
  }, [dbCategories]);

  // If the loaded event's category is no longer in the list, keep it
  // visible by injecting it at the top.
  const categoryList = useMemo(() => {
    if (form.category && !categoryOptions.includes(form.category)) {
      return [form.category, ...categoryOptions];
    }
    return categoryOptions;
  }, [categoryOptions, form.category]);

  function update<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addTicketType() {
    const id = `tt-${Date.now().toString(36)}`;
    setForm((f) => ({
      ...f,
      ticket_types: [
        ...f.ticket_types,
        { id, name: "New tier", price: 0, qty: 50, sold: 0 },
      ],
    }));
  }

  function updateTicketType(idx: number, patch: Partial<TicketType>) {
    setForm((f) => ({
      ...f,
      ticket_types: f.ticket_types.map((t, i) =>
        i === idx ? { ...t, ...patch } : t,
      ),
    }));
  }

  function removeTicketType(idx: number) {
    setForm((f) => ({
      ...f,
      ticket_types: f.ticket_types.filter((_, i) => i !== idx),
    }));
  }

  async function save() {
    if (!user) return;
    if (!form.title.trim()) {
      push({ tone: "red", title: "Title required", message: "Enter an event title." });
      return;
    }
    if (!form.date) {
      push({ tone: "red", title: "Date required", message: "Pick an event date." });
      return;
    }
    setSaving(true);
    const isEdit = !!form.id;
    const id = form.id ?? `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    // Derive a top-level "price" from the cheapest ticket type for legacy fields
    const minPrice = form.ticket_types.length
      ? Math.min(...form.ticket_types.map((t) => t.price))
      : 0;
    const totalCapacity = form.ticket_types.reduce((s, t) => s + (t.qty ?? 0), 0);

    // Resolve the organizer's brand name — the event's `organizer` field
    // must hold the ORGANIZER, not the event title.
    let organizerName = organizerNameCache;
    if (!organizerName) {
      const { data: prof } = await supabase
        .from("organizer_profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      organizerName = (prof as any)?.display_name || "";
      if (!organizerName) {
        const { data: p } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        organizerName = (p as any)?.full_name || "Occaz Organizer";
      }
      setOrganizerNameCache(organizerName);
    }

    const payload: any = {
      id,
      title: form.title.trim(),
      description: form.description,
      image: form.image,
      gallery: form.gallery ?? [],
      category: form.category,
      organizer: organizerName,
      city: form.city,
      mode: form.mode,
      date: form.date,
      time: form.time,
      location: form.location,
      price: minPrice,
      capacity: totalCapacity || form.capacity,
      ticket_types: form.ticket_types,
      featured: form.featured,
      published: form.published,
      registrations_open: form.registrationsOpen,
      organizer_id: user.id,
      updated_at: new Date().toISOString(),
    };

    // Prefer the SECURITY DEFINER RPC — it sets organizer_id and the
    // organizer brand name correctly and is immune to RLS. Fall back to
    // a direct write if the RPC isn't installed.
    let error: any = null;
    let saved = false;
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc("upsert_event", {
        p_event: payload,
      });
      if (!rpcErr && rpcData && (rpcData as any)?.ok) {
        saved = true;
        if ((rpcData as any)?.organizer) {
          setOrganizerNameCache((rpcData as any).organizer);
        }
      } else if (rpcErr) {
        error = rpcErr;
      }
    } catch (e: any) {
      error = e;
    }

    if (!saved) {
      if (isEdit) {
        const r = await supabase.from("events").update(payload).eq("id", id);
        error = r.error;
      } else {
        const r = await supabase.from("events").insert(payload);
        error = r.error;
      }
    }

    setSaving(false);
    if (error) {
      push({
        tone: "red",
        title: "Save failed",
        message: error.message ?? "Could not save the event.",
      });
      return;
    }
    push({
      tone: "green",
      title: isEdit ? "Event updated" : "Event created",
      message: isEdit ? "Your changes are live." : "Your event is in your list.",
    });
    onSaved({ id, ...payload });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 12, scale: 0.98, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 12, scale: 0.98, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="my-8 w-full max-w-3xl rounded-2xl border border-white/5 bg-[#0b0b14] text-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <div>
              <h2 className="text-lg font-bold">
                {form.id ? "Edit event" : "New event"}
              </h2>
              <p className="text-xs text-zinc-500">
                {form.id
                  ? "Update your event details and ticket types"
                  : "Create an event to start selling tickets"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 p-5">
            {/* Image */}
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Cover image
              </div>
              <SingleImageDrop
                value={form.image}
                onChange={(url) => update("image", url)}
                storageKind="events"
                label="Cover image"
              />
            </div>

            {/* Title + Category */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Title" full>
                <input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  className="input"
                  placeholder="Concert, conference, exhibition…"
                />
              </Field>
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className="input"
                >
                  {categoryList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Mode">
                <select
                  value={form.mode}
                  onChange={(e) => update("mode", e.target.value as any)}
                  className="input"
                >
                  <option value="Physical">Physical</option>
                  <option value="Online">Online</option>
                </select>
              </Field>
            </div>

            {/* Description */}
            <Field label="Description" full>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                className="input"
                placeholder="What attendees should know…"
              />
            </Field>

            {/* City + Location + Date + Time */}
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="City">
                <input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="input"
                  placeholder="Karachi"
                />
              </Field>
              <Field label="Venue" full>
                <input
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  className="input"
                  placeholder="Venue name & address"
                />
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => update("time", e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            {/* Sales window */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Registration deadline">
                <input
                  type="date"
                  value={form.registration_deadline ?? ""}
                  onChange={(e) => update("registration_deadline", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Ticket sales start">
                <input
                  type="date"
                  value={form.sales_start ?? ""}
                  onChange={(e) => update("sales_start", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Ticket sales end">
                <input
                  type="date"
                  value={form.sales_end ?? ""}
                  onChange={(e) => update("sales_end", e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            {/* Ticket types */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Ticket types
                </div>
                <button
                  type="button"
                  onClick={addTicketType}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-white/10"
                >
                  <Plus className="h-3 w-3" /> Add tier
                </button>
              </div>
              <div className="space-y-2">
                {form.ticket_types.map((t, idx) => (
                  <div
                    key={t.id}
                    className="grid grid-cols-12 items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2"
                  >
                    <div className="col-span-4">
                      <input
                        value={t.name}
                        onChange={(e) => updateTicketType(idx, { name: e.target.value })}
                        className="input"
                        placeholder="Tier name"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={t.price}
                        onChange={(e) =>
                          updateTicketType(idx, { price: Number(e.target.value) })
                        }
                        className="input"
                        placeholder="Price (₨)"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={t.qty}
                        onChange={(e) =>
                          updateTicketType(idx, { qty: Number(e.target.value) })
                        }
                        className="input"
                        placeholder="Quantity"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeTicketType(idx)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-red-500/15 hover:text-red-400"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Toggle
                label="Published"
                desc="Visible to attendees"
                value={form.published}
                onChange={(v) => update("published", v)}
              />
              <Toggle
                label="Registrations open"
                desc="Accept new tickets"
                value={form.registrationsOpen}
                onChange={(v) => update("registrationsOpen", v)}
              />
              <Toggle
                label="Featured"
                desc="Show on homepage feed (Pro+)"
                value={form.featured}
                onChange={(v) => update("featured", v)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-white/5 p-5">
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : form.id ? "Save changes" : "Create event"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, full, children }: any) {
  return (
    <label className={full ? "sm:col-span-3" : ""}>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      {children}
    </label>
  );
}

function Toggle({ label, desc, value, onChange }: any) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-white/[0.02] p-3">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-[10px] text-zinc-500">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={
          "relative h-5 w-9 rounded-full transition " +
          (value ? "bg-pink-500" : "bg-white/10")
        }
      >
        <span
          className={
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition " +
            (value ? "left-4" : "left-0.5")
          }
        />
      </button>
    </label>
  );
}
