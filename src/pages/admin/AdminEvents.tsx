import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit3, Trash2, Eye, EyeOff, Search, Crown, Sparkles, X } from "lucide-react";
import { categories as mockCategories } from "../../data/mock";
import { useDataStore } from "../../data/store";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { ImageUploader, type ImageItem } from "../../components/admin/ImageUploader";
import { useSubscription } from "../../hooks/useSubscription";
import { useAuth } from "../../lib/auth";
import { useCategories } from "../../hooks/useCategories";
import { supabase } from "../../lib/supabase";

export function AdminEvents() {
  const { events, addEvent, updateEvent, removeEvent } = useDataStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [organizerFilter, setOrganizerFilter] = useState("All");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [editing, setEditing] = useState<typeof events[0] | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Live categories from the admin-managed `categories` table, with a
  // mock-data fallback so the dropdown is never empty.
  const dbCats = useCategories("event");
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of dbCats) if (!seen.has(c.name)) { seen.add(c.name); out.push(c.name); }
    for (const c of mockCategories) if (!seen.has(c)) { seen.add(c); out.push(c); }
    return out;
  }, [dbCats]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (q && !`${e.title} ${e.organizer}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (cat !== "All" && e.category !== cat) return false;
      if (organizerFilter !== "All" && e.organizer !== organizerFilter) return false;
      if (status === "published" && !e.published) return false;
      if (status === "draft" && e.published) return false;
      return true;
    });
  }, [events, q, cat, status, organizerFilter]);

  // Distinct organizers that have at least one event, for the filter.
  const organizerNames = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of events) {
      const n = (e.organizer || "").trim();
      if (n && !seen.has(n)) { seen.add(n); out.push(n); }
    }
    return out.sort((a, b) => a.localeCompare(b));
  }, [events]);

  const togglePublish = (id: string) => {
    const e = events.find((x) => x.id === id);
    if (e) updateEvent(id, { published: !e.published });
  };

  const remove = (id: string) => {
    if (confirm("Delete this event? This cannot be undone.")) {
      removeEvent(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Manage your event listings
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowNew(true)}
        >
          Add event
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-[var(--bg-card)] px-4 py-2.5 ring-1 ring-[var(--border-subtle)]">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events..."
            className="flex-1 bg-transparent text-sm placeholder:text-[var(--text-tertiary)] outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="rounded-xl bg-[var(--bg-card)] px-3 py-2.5 text-sm ring-1 ring-[var(--border-subtle)] outline-none"
          >
            <option className="bg-[var(--bg-card)]">All</option>
            {categories.map((c) => (
              <option key={c} className="bg-[var(--bg-card)]">{c}</option>
            ))}
          </select>
          <select
            value={organizerFilter}
            onChange={(e) => setOrganizerFilter(e.target.value)}
            className="rounded-xl bg-[var(--bg-card)] px-3 py-2.5 text-sm ring-1 ring-[var(--border-subtle)] outline-none"
            title="Filter by organizer"
          >
            <option className="bg-[var(--bg-card)]">All</option>
            {organizerNames.map((n) => (
              <option key={n} className="bg-[var(--bg-card)]">{n}</option>
            ))}
          </select>
          <div className="flex gap-1 rounded-xl bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)]">
            {(["all", "published", "draft"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-lg px-3 py-1.5 text-sm capitalize transition ${
                  status === s ? "bg-white text-black" : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Organizer</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Pricing</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Tickets sold</th>
                <th className="px-5 py-3 font-medium">Revenue</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={e.image} className="h-10 w-10 rounded-lg object-cover" />
                      <div>
                        <div className="font-medium">{e.title}</div>
                        <div className="text-xs text-[var(--text-tertiary)]">{e.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {e.organizer ? (
                      <div className="flex items-center gap-2">
                        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-accent-500 to-pink-500 text-[10px] font-bold text-white">
                          {e.organizer.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="max-w-[140px] truncate text-[var(--text-secondary)]">
                          {e.organizer}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{e.category}</td>
                  <td className="px-5 py-3">
                    {(e.ticketTypes ?? []).length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {(e.ticketTypes ?? []).map((t: any, i: number) => (
                          <div
                            key={t.id ?? i}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span className="text-[var(--text-secondary)]">
                              {t.name}
                            </span>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {Number(t.price ?? 0) === 0
                                ? "Free"
                                : `₨ ${Number(t.price ?? 0).toLocaleString()}`}
                            </span>
                            <span className="text-[10px] text-[var(--text-tertiary)]">
                              ×{t.qty ?? 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[var(--text-secondary)]">
                        {Number(e.price ?? 0) === 0
                          ? "Free"
                          : `₨ ${Number(e.price ?? 0).toLocaleString()}`}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{e.date}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{e.attendees.toLocaleString()}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">
                    ₨ {(e.attendees * e.price).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={e.published ? "emerald" : "default"}>
                      {e.published ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn
                        label={e.published ? "Unpublish" : "Publish"}
                        onClick={() => togglePublish(e.id)}
                        Icon={e.published ? EyeOff : Eye}
                      />
                      <IconBtn label="Edit" onClick={() => setEditing(e)} Icon={Edit3} />
                      <IconBtn label="Delete" onClick={() => remove(e.id)} Icon={Trash2} tone="red" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(editing || showNew) && (
        <EventForm
          initial={editing || undefined}
          onClose={() => {
            setEditing(null);
            setShowNew(false);
          }}
          onSave={(data) => {
            // Only persist items that are fully uploaded (status === "ready")
            // with real http(s) URLs. blob: URLs are tab-local and break on reload.
            const readyItems = (data.gallery || []).filter(
              (i: ImageItem) => i.status === "ready",
            );
            const allUrls = readyItems
              .map((i: ImageItem) => i.url)
              .filter(
                (u: string | undefined): u is string =>
                  !!u && !u.startsWith("blob:") && u.startsWith("http"),
              );
            const fallback = data.image && !data.image.startsWith("blob:") && data.image.startsWith("http")
              ? [data.image]
              : [];
            const finalImages = allUrls.length > 0 ? allUrls : fallback;
            const payload = {
              ...data,
              image: finalImages[0] || "",
              gallery: finalImages,
            };
            if (editing) {
              updateEvent(editing.id, payload);
            } else {
              const id = "newev" + Date.now();
              addEvent({ ...payload, id, type: "event" } as any);
            }
            setEditing(null);
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  Icon,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  Icon: any;
  tone?: "default" | "red";
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-lg transition ${
        tone === "red"
          ? "text-[var(--text-tertiary)] hover:bg-red-500/15 hover:text-red-400"
          : "text-[var(--text-tertiary)] hover:bg-[var(--bg-card-hover)] hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function EventForm({
  initial,
  onClose,
  onSave,
}: {
  initial?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  // Registered organizers — so an admin-created event can be linked to a
  // real owner and show up in that organizer's dashboard.
  const [organizerOptions, setOrganizerOptions] = useState<
    { id: string; name: string }[]
  >([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("organizer_profiles")
          .select("id, display_name")
          .order("display_name", { ascending: true });
        if (!alive) return;
        setOrganizerOptions(
          (data ?? [])
            .map((o: any) => ({ id: o.id, name: o.display_name }))
            .filter((o: { id: string; name: string }) => !!o.id && !!o.name),
        );
      } catch {
        // Non-fatal — the free-text organizer field still works.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Live categories from the admin-managed `categories` table, with a
  // mock-data fallback so the dropdown is never empty.
  const dbCats = useCategories("event");
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of dbCats) if (!seen.has(c.name)) { seen.add(c.name); out.push(c.name); }
    for (const c of mockCategories) if (!seen.has(c)) { seen.add(c); out.push(c); }
    return out;
  }, [dbCats]);

  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    category: initial?.category || "Concerts",
    date: initial?.date || "",
    time: initial?.time || "20:00",
    venue: initial?.venue || "",
    city: initial?.city || "",
    organizer: initial?.organizer || "",
    organizerId: initial?.organizerId ?? undefined,
    image: initial?.image || "https://picsum.photos/seed/new/1200/800",
    price: initial?.price ?? 0,
    isFree: Number(initial?.price ?? 0) === 0,
    ticketTypes: (initial?.ticketTypes ?? []).map((t: any) => ({ ...t })),
    mode: initial?.mode || "Physical",
    featured: !!initial?.featured,
    published: initial?.published ?? true,
    registrationsOpen: initial?.registrationsOpen ?? true,
    requirements: "",
  });
  const [gallery, setGallery] = useState<ImageItem[]>(() => {
    const safe = (u?: string | null): string | null =>
      u && !u.startsWith("blob:") && u.startsWith("http") ? u : null;
    const cover = safe(initial?.image) ?? safe(initial?.gallery?.[0]) ?? null;
    const restGallery = (initial?.gallery ?? []).filter(
      (u) => safe(u) && safe(u) !== cover,
    );
    if (cover || restGallery.length > 0) {
      return [
        ...(cover ? [{ id: "cover", url: cover, isCover: true, status: "ready" as const }] : []),
        ...restGallery.map((url, i) => ({
          id: `g${i}`,
          url: url as string,
          isCover: false,
          status: "ready" as const,
        })),
      ];
    }
    return [{
      id: "cover",
      url: "https://picsum.photos/seed/new/1200/800",
      isCover: true,
      status: "ready" as const,
    }];
  });

  // Keep latest gallery in a ref so the Save handler always reads
  // the current state, not a stale closure value.
  const galleryRef = useRef<ImageItem[]>(gallery);
  useEffect(() => {
    galleryRef.current = gallery;
  }, [gallery]);

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // ------------------------- pricing tier helpers -------------------------
  const updateTier = (idx: number, patch: any) =>
    setForm((p) => ({
      ...p,
      ticketTypes: (p.ticketTypes ?? []).map((t: any, i: number) =>
        i === idx ? { ...t, ...patch } : t,
      ),
    }));

  const addTier = () =>
    setForm((p) => ({
      ...p,
      ticketTypes: [
        ...(p.ticketTypes ?? []),
        {
          id: `tt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          name: "Standard",
          price: p.isFree ? 0 : Number(p.price ?? 0),
          qty: 100,
          sold: 0,
          description: "",
          perks: [],
        },
      ],
    }));

  const removeTier = (idx: number) =>
    setForm((p) => ({
      ...p,
      ticketTypes: (p.ticketTypes ?? []).filter((_: any, i: number) => i !== idx),
    }));

  const addPerk = (tierIdx: number) =>
    setForm((p) => ({
      ...p,
      ticketTypes: (p.ticketTypes ?? []).map((t: any, i: number) =>
        i === tierIdx ? { ...t, perks: [...(t.perks ?? []), ""] } : t,
      ),
    }));

  const updatePerk = (tierIdx: number, perkIdx: number, value: string) =>
    setForm((p) => ({
      ...p,
      ticketTypes: (p.ticketTypes ?? []).map((t: any, i: number) =>
        i === tierIdx
          ? {
              ...t,
              perks: (t.perks ?? []).map((pk: string, j: number) =>
                j === perkIdx ? value : pk,
              ),
            }
          : t,
      ),
    }));

  const removePerk = (tierIdx: number, perkIdx: number) =>
    setForm((p) => ({
      ...p,
      ticketTypes: (p.ticketTypes ?? []).map((t: any, i: number) =>
        i === tierIdx
          ? { ...t, perks: (t.perks ?? []).filter((_: string, j: number) => j !== perkIdx) }
          : t,
      ),
    }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-default)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-5">
          <h2 className="text-lg font-semibold">
            {initial ? "Edit event" : "New event"}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--bg-card-hover)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Title" full>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Description" full>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              className="input resize-none"
            />
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="input"
            >
              {categories.map((c) => (
                <option key={c} className="bg-[var(--bg-card)]">{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Mode">
            <select
              value={form.mode}
              onChange={(e) => update("mode", e.target.value)}
              className="input"
            >
              <option className="bg-[var(--bg-card)]">Physical</option>
              <option className="bg-[var(--bg-card)]">Online</option>
            </select>
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
          <Field label="Venue">
            <input
              value={form.venue}
              onChange={(e) => update("venue", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="City">
            <input
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Organizer">
            <input
              value={form.organizer}
              onChange={(e) => update("organizer", e.target.value)}
              className="input"
              placeholder="Type or pick a registered organizer"
            />
            {organizerOptions.length > 0 && (
              <select
                value={form.organizerId ?? ""}
                onChange={(e) => {
                  const id = e.target.value || undefined;
                  const opt = organizerOptions.find((o) => o.id === id);
                  setForm((p) => ({
                    ...p,
                    organizerId: id,
                    // Keep the display name in sync with the owner.
                    organizer: opt ? opt.name : p.organizer,
                  }));
                }}
                className="input mt-2"
              >
                <option value="">— Not linked to an organizer —</option>
                {organizerOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}
            {form.organizerId && (
              <p className="mt-1.5 text-xs text-emerald-400">
                Linked — this event will appear in that organizer's dashboard.
              </p>
            )}
          </Field>
          <Field label="Price (PKR)">
            <input
              type="number"
              min={0}
              disabled={form.isFree}
              value={form.isFree ? 0 : form.price}
              onChange={(e) => update("price", Number(e.target.value))}
              className="input disabled:opacity-50"
              placeholder={form.isFree ? "Free" : "0"}
            />
          </Field>
          <Field label="Free event" full>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isFree: e.target.checked,
                    price: e.target.checked ? 0 : form.price,
                    // Free event → every tier costs 0.
                    ticketTypes: e.target.checked
                      ? (form.ticketTypes ?? []).map((t: any) => ({ ...t, price: 0 }))
                      : form.ticketTypes,
                  })
                }
                className="h-4 w-4 accent-emerald-500"
              />
              <span>
                This event is free — attendees register without paying and no
                payment is collected.
              </span>
            </label>
          </Field>

          {/* Pricing tiers */}
          <Field label="Pricing tiers" full>
            <div className="space-y-2">
              <p className="text-xs text-[var(--text-tertiary)]">
                Add multiple ticket tiers (e.g. Early Bird, Standard, VIP).
                Each tier has its own price, quantity and perks. Leave empty
                to use the single price above.
              </p>

              {(form.ticketTypes ?? []).map((t: any, idx: number) => (
                <div
                  key={t.id ?? `tier-${idx}`}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3"
                >
                  <div className="grid gap-2 sm:grid-cols-12">
                    <div className="sm:col-span-4">
                      <input
                        value={t.name ?? ""}
                        onChange={(e) => updateTier(idx, { name: e.target.value })}
                        className="input"
                        placeholder="Tier name"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min={0}
                        disabled={form.isFree}
                        value={form.isFree ? 0 : Number(t.price ?? 0)}
                        onChange={(e) => updateTier(idx, { price: Number(e.target.value) })}
                        className="input disabled:opacity-50"
                        placeholder={form.isFree ? "Free" : "Price (₨)"}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min={0}
                        value={Number(t.qty ?? 0)}
                        onChange={(e) => updateTier(idx, { qty: Number(e.target.value) })}
                        className="input"
                        placeholder="Quantity"
                      />
                    </div>
                    <div className="flex items-center sm:col-span-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => removeTier(idx)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-tertiary)] hover:bg-red-500/10 hover:text-red-400"
                        title="Remove tier"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <input
                    value={t.description ?? ""}
                    onChange={(e) => updateTier(idx, { description: e.target.value })}
                    className="input mt-2"
                    placeholder="Short description (optional)"
                  />

                  {/* Perks */}
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Perks
                      </span>
                      <button
                        type="button"
                        onClick={() => addPerk(idx)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-card-hover)] px-2 py-1 text-[10px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-card)]"
                      >
                        <Plus className="h-3 w-3" /> Add perk
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {(t.perks ?? []).map((p: string, pi: number) => (
                        <div key={pi} className="flex items-center gap-2">
                          <input
                            value={p}
                            onChange={(e) => updatePerk(idx, pi, e.target.value)}
                            className="input flex-1"
                            placeholder="e.g. Front row seating"
                          />
                          <button
                            type="button"
                            onClick={() => removePerk(idx, pi)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--text-tertiary)] hover:bg-red-500/10 hover:text-red-400"
                            title="Remove perk"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {(t.perks ?? []).length === 0 && (
                        <p className="text-[10px] text-[var(--text-tertiary)]">
                          No perks added.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addTier}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--border-default)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-accent-500/50 hover:text-accent-300"
              >
                <Plus className="h-3.5 w-3.5" /> Add pricing tier
              </button>
            </div>
          </Field>
          <Field label="Images" full>
            <ImageUploader
              images={gallery}
              storageKind="events"
              onChange={(next) => {
                // CRITICAL: use the functional updater so we always work
                // with the latest gallery state. The ImageUploader calls
                // onChange twice (once for placeholder, once for real URL).
                // Each call must apply to the latest state, not a stale
                // closure value.
                setGallery((prev) => {
                  const arr = typeof next === "function" ? next(prev) : next;
                  const cover =
                    arr.find((i) => i.isCover && i.status === "ready") ??
                    arr.find((i) => i.status === "ready");
                  if (cover) update("image", cover.url);
                  return arr;
                });
              }}
            />
          </Field>
          <Field label="Featured" full>
            <FeaturedToggle
              checked={form.featured}
              onChange={(v) => update("featured", v)}
            />
          </Field>
          <Field label="Status" full>
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => update("published", e.target.checked)}
                  className="h-4 w-4 accent-accent-500"
                />
                Published — visible to users
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.registrationsOpen}
                  onChange={(e) => update("registrationsOpen", e.target.checked)}
                  className="h-4 w-4 accent-accent-500"
                />
                Open for registrations
              </label>
            </div>
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] p-5">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={gallery.some((g) => g.status === "uploading")}
            onClick={async () => {
              // Use ref so we always read the latest gallery state,
              // not a stale closure value.
              let cur = galleryRef.current;
              const start = Date.now();
              while (
                cur.some((g) => g.status === "uploading") &&
                Date.now() - start < 30000
              ) {
                await new Promise((r) => setTimeout(r, 200));
                cur = galleryRef.current;
              }
              const cover =
                cur.find((g) => g.isCover && g.status === "ready") ??
                cur.find((g) => g.status === "ready");
              const finalForm = cover
                ? { ...form, image: cover.url }
                : form;

              // A free event always saves with price 0 and every tier at 0.
              const tiers = (finalForm.ticketTypes ?? []).map((t: any) => ({
                ...t,
                price: finalForm.isFree ? 0 : Number(t.price ?? 0),
                perks: (t.perks ?? []).filter((p: string) => (p ?? "").trim() !== ""),
              }));

              // The top-level price mirrors the cheapest tier so legacy
              // surfaces (cards, filters) show the right headline price.
              const derivedPrice = tiers.length
                ? Math.min(...tiers.map((t: any) => Number(t.price ?? 0)))
                : Number(finalForm.price ?? 0);

              onSave({
                ...finalForm,
                ticketTypes: tiers,
                price: finalForm.isFree ? 0 : derivedPrice,
                gallery: cur,
              });
            }}
          >
            {gallery.some((g) => g.status === "uploading")
              ? "Uploading…"
              : initial
              ? "Save changes"
              : "Create event"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={full ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">{label}</span>
      {children}
    </label>
  );
}

function FeaturedToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const { plan, can } = useSubscription();
  const { isAdmin } = useAuth();
  // Admins bypass the subscription gate — they can feature anything.
  const allowed = isAdmin || can("canFeature");
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          disabled={!allowed}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-accent-500 disabled:opacity-50"
        />
        Show in featured listings on homepage
      </label>
      {!allowed && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <span className="flex items-center gap-2">
            <Crown className="h-3.5 w-3.5" />
            Featured placement is on Occaz Pro and Business.
          </span>
          <Link
            to="/organizer/billing"
            className="font-medium text-amber-100 hover:underline"
          >
            Upgrade →
          </Link>
        </div>
      )}
      {allowed && plan.id !== "starter" && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
          <Sparkles className="h-3.5 w-3.5 text-accent-400" />
          Active on your {plan.name} plan
        </div>
      )}
    </div>
  );
}
