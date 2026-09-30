import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit3, Trash2, Eye, EyeOff, Search, Crown, Sparkles } from "lucide-react";
import { categories } from "../../data/mock";
import { useDataStore } from "../../data/store";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { ImageUploader, type ImageItem } from "../../components/admin/ImageUploader";
import { useSubscription } from "../../hooks/useSubscription";

export function AdminEvents() {
  const { events, addEvent, updateEvent, removeEvent } = useDataStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [editing, setEditing] = useState<typeof events[0] | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (q && !`${e.title} ${e.organizer}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (cat !== "All" && e.category !== cat) return false;
      if (status === "published" && !e.published) return false;
      if (status === "draft" && e.published) return false;
      return true;
    });
  }, [events, q, cat, status]);

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
                <th className="px-5 py-3 font-medium">Category</th>
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
                        <div className="text-xs text-[var(--text-tertiary)]">{e.organizer}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{e.category}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{e.date}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{e.attendees.toLocaleString()}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">
                    ${(e.attendees * e.price).toLocaleString()}
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
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    category: initial?.category || "Concerts",
    date: initial?.date || "",
    time: initial?.time || "20:00",
    venue: initial?.venue || "",
    city: initial?.city || "",
    organizer: initial?.organizer || "",
    image: initial?.image || "https://picsum.photos/seed/new/1200/800",
    price: initial?.price ?? 0,
    mode: initial?.mode || "Physical",
    featured: !!initial?.featured,
    published: initial?.published ?? true,
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

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

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
            />
          </Field>
          <Field label="Price (PKR)">
            <input
              type="number"
              value={form.price}
              onChange={(e) => update("price", Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Images" full>
            <ImageUploader
              images={gallery}
              storageKind="events"
              onChange={(next) => {
                const arr = typeof next === "function" ? next(gallery) : next;
                setGallery(arr);
                const cover =
                  arr.find((i) => i.isCover && i.status === "ready") ??
                  arr.find((i) => i.status === "ready");
                if (cover) update("image", cover.url);
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
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => update("published", e.target.checked)}
                className="h-4 w-4 accent-accent-500"
              />
              Published — visible to users
            </label>
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border-subtle)] p-5">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={gallery.some((g) => g.status === "uploading")}
            onClick={async () => {
              const start = Date.now();
              while (
                gallery.some((g) => g.status === "uploading") &&
                Date.now() - start < 30000
              ) {
                await new Promise((r) => setTimeout(r, 200));
              }
              const cover =
                gallery.find((g) => g.isCover && g.status === "ready") ??
                gallery.find((g) => g.status === "ready");
              const finalForm = cover
                ? { ...form, image: cover.url }
                : form;
              onSave({ ...finalForm, gallery });
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
  const allowed = can("canFeature");
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
      {allowed && plan.id !== "free" && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
          <Sparkles className="h-3.5 w-3.5 text-accent-400" />
          Active on your {plan.name} plan
        </div>
      )}
    </div>
  );
}
