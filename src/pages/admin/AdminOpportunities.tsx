import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Edit3, Trash2, Search, Eye, EyeOff } from "lucide-react";
import clsx from "clsx";
import { opportunityCategories } from "../../data/mock";
import { useDataStore } from "../../data/store";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { ImageUploader, type ImageItem } from "../../components/admin/ImageUploader";
import { resolveBlobUrl } from "../../lib/blobResolver";

export function AdminOpportunities() {
  const { opportunities, addOpportunity, updateOpportunity, removeOpportunity } = useDataStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [editing, setEditing] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [dbg, setDbg] = useState<string[]>([]);

  const filtered = useMemo(
    () =>
      opportunities.filter((o) => {
        if (q && !`${o.title} ${o.organizer}`.toLowerCase().includes(q.toLowerCase())) return false;
        if (cat !== "All" && o.category !== cat) return false;
        return true;
      }),
    [opportunities, q, cat],
  );

  const toggle = (id: string) => {
    const o = opportunities.find((x) => x.id === id);
    if (o) updateOpportunity(id, { published: !o.published });
  };
  const remove = (id: string) => {
    if (confirm("Delete this opportunity?")) removeOpportunity(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Manage scholarships, internships and more
          </p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowNew(true)}>
          Add opportunity
        </Button>
      </div>

      {dbg.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 font-mono text-xs">
          <div className="mb-1 font-semibold text-amber-300">Debug log (copy this if you see an error):</div>
          {dbg.map((m, i) => (
            <div key={i} className="text-amber-200">{m}</div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-[var(--bg-card)] px-4 py-2.5 ring-1 ring-[var(--border-subtle)]">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search opportunities..."
            className="flex-1 bg-transparent text-sm placeholder:text-[var(--text-tertiary)] outline-none"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-xl bg-[var(--bg-card)] px-3 py-2.5 text-sm ring-1 ring-[var(--border-subtle)] outline-none"
        >
          <option className="bg-[var(--bg-card)]">All</option>
          {opportunityCategories.map((c) => (
            <option key={c} className="bg-[var(--bg-card)]">{c}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((o) => (
          <div key={o.id} className="overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
            <div className="relative aspect-[16/9]">
              <img src={o.image} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-card to-transparent" />
              <div className="absolute left-3 top-3">
                <Badge tone="accent">{o.category}</Badge>
              </div>
              <div className="absolute right-3 top-3">
                <Badge tone={o.published ? "emerald" : "default"}>
                  {o.published ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="line-clamp-2 font-semibold">{o.title}</h3>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">{o.organizer}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                <span>Deadline {o.deadline || "—"}</span>
                <span>{o.city}</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent-500/10 px-2.5 py-1 text-xs font-semibold text-accent-300 ring-1 ring-accent-500/25">
                {o.price === 0 || o.price === undefined
                  ? "Free to apply"
                  : `₨ ${Number(o.price).toLocaleString()} to apply`}
              </div>
              <div className="mt-4 flex justify-end gap-1">
                <button onClick={() => toggle(o.id)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-card-hover)] hover:text-white">
                  {o.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => setEditing(o)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-card-hover)] hover:text-white">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button onClick={() => remove(o.id)} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-tertiary)] hover:bg-red-500/15 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(editing || showNew) && (
        <OppForm
          initial={editing || undefined}
          onClose={() => { setEditing(null); setShowNew(false); }}
          onSave={(data) => {
            // Build a single "all URLs" array — cover first, then gallery.
            // CRITICAL: only persist items that are fully uploaded (status === "ready")
            // with real http(s) URLs. blob: URLs are tab-local and break on reload.
            // Items still uploading are dropped, not saved with their blob preview.
            const readyItems = (data.gallery || []).filter(
              (i: ImageItem) => i.status === "ready",
            );
            const allUrls = readyItems
              .map((i: ImageItem) => i.url)
              .filter(
                (u: string | undefined): u is string =>
                  !!u && !u.startsWith("blob:") && u.startsWith("http"),
              );
            // Fallback to form.image if it's a real URL
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
              setDbg((d) => [...d, `update ${editing.id} image=${payload.image}`]);
              updateOpportunity(editing.id, payload).then((r) =>
                setDbg((d) => [...d, `update result: ${JSON.stringify(r)}`]),
              );
            } else {
              const id = "newopp" + Date.now();
              setDbg((d) => [...d, `add ${id} image=${payload.image}`]);
              addOpportunity({ ...payload, id, type: "opportunity" } as any).then((r) =>
                setDbg((d) => [...d, `add result: ${JSON.stringify(r)}`]),
              );
            }
            setEditing(null);
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function OppForm({
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
    category: initial?.category || "Scholarships",
    requirementsText: (initial?.requirements ?? []).join("\n"),
    eligibilityText: (initial?.eligibility ?? []).join("\n"),
    showRequirements: (initial?.requirements ?? []).length > 0,
    showEligibility: (initial?.eligibility ?? []).length > 0,
    organizer: initial?.organizer || "",
    deadline: initial?.deadline || "",
    city: initial?.city || "",
    mode: initial?.mode || "Online",
    image: initial?.image || "https://picsum.photos/seed/newopp/1200/800",
    applyUrl: initial?.applyUrl || "",
    stipend: initial?.stipend || "",
    hasStipend: initial?.hasStipend ?? !!initial?.stipend,
    price: initial?.price ?? 0,
    currency: initial?.currency || "PKR",
    feeType: initial?.feeType || "free",
    feePeriod: initial?.feePeriod || "",
    published: initial?.published ?? true,
    featured: !!initial?.featured,
    registrationsOpen: initial?.registrationsOpen ?? true,
  });
  const [gallery, setGallery] = useState<ImageItem[]>(() => {
    // If we have a cover image (prefer non-blob), build a single-element
    // cover. Otherwise, fall back to the first non-blob gallery item.
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
      url: "https://picsum.photos/seed/newopp/1200/800",
      isCover: true,
      status: "ready" as const,
    }];
  });

  // Keep latest gallery in a ref so the onClick handler always reads
  // the current state, not a stale closure value.
  const galleryRef = useRef<ImageItem[]>(gallery);
  useEffect(() => {
    galleryRef.current = gallery;
  }, [gallery]);

  // Async-resolve any remaining blob: URLs in the initial data.
  // This is what makes the form's image actually display + persist
  // when editing a row that has blob URLs in the DB.
  useEffect(() => {
    let alive = true;
    (async () => {
      const blobUrls: string[] = [];
      if (form.image?.startsWith("blob:")) blobUrls.push(form.image);
      gallery.forEach((g) => {
        if (g.url.startsWith("blob:")) blobUrls.push(g.url);
      });
      if (blobUrls.length === 0) return;
      const resolved = await Promise.all(blobUrls.map((u) => resolveBlobUrl(u)));
      if (!alive) return;
      const resolvedMap = new Map(blobUrls.map((u, i) => [u, resolved[i]]));
      // Update form.image
      if (form.image?.startsWith("blob:")) {
        const newImage = resolvedMap.get(form.image);
        if (newImage && !newImage.startsWith("blob:")) {
          setForm((f) => ({ ...f, image: newImage }));
        }
      }
      // Update gallery
      setGallery((gs) =>
        gs.map((g) => {
          if (!g.url.startsWith("blob:")) return g;
          const newUrl = resolvedMap.get(g.url);
          return newUrl && !newUrl.startsWith("blob:")
            ? { ...g, url: newUrl }
            : g;
        }),
      );
    })();
    return () => {
      alive = false;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-default)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-5">
          <h2 className="text-lg font-semibold">
            {initial ? "Edit opportunity" : "New opportunity"}
          </h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--bg-card-hover)]" aria-label="Close">×</button>
        </div>

        <div
          id="image-uploader-debug"
          className="border-b border-[var(--border-subtle)] bg-amber-500/10 px-5 py-2 font-mono text-[11px]"
        >
          <div className="font-semibold text-amber-300">Upload log (watch this when you drop a file):</div>
          <div className="text-amber-200/70">Drop a file to see what happens</div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Title" full>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
          </Field>
          <Field label="Description" full>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input resize-none" />
          </Field>

          {/* Requirements & Eligibility — toggle + textarea (one per line) */}
          <Field label="Requirements" full>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <input
                  type="checkbox"
                  checked={form.showRequirements}
                  onChange={(e) => setForm({ ...form, showRequirements: e.target.checked })}
                  className="h-4 w-4 accent-accent-500"
                />
                Show requirements on the public listing
              </label>
              {form.showRequirements && (
                <textarea
                  value={form.requirementsText}
                  onChange={(e) => setForm({ ...form, requirementsText: e.target.value })}
                  rows={3}
                  placeholder={"One per line, e.g.\nBachelor's degree\nOutstanding academic record"}
                  className="input resize-none"
                />
              )}
            </div>
          </Field>

          <Field label="Eligibility" full>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <input
                  type="checkbox"
                  checked={form.showEligibility}
                  onChange={(e) => setForm({ ...form, showEligibility: e.target.checked })}
                  className="h-4 w-4 accent-accent-500"
                />
                Show eligibility criteria on the public listing
              </label>
              {form.showEligibility && (
                <textarea
                  value={form.eligibilityText}
                  onChange={(e) => setForm({ ...form, eligibilityText: e.target.value })}
                  rows={3}
                  placeholder={"One per line, e.g.\nPakistani citizen\nAges 18-25"}
                  className="input resize-none"
                />
              )}
            </div>
          </Field>

          <Field label="Category">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
              {opportunityCategories.map((c) => (
                <option key={c} className="bg-[var(--bg-card)]">{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Mode">
            <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="input">
              <option className="bg-[var(--bg-card)]">Online</option>
              <option className="bg-[var(--bg-card)]">Physical</option>
            </select>
          </Field>
          <Field label="Deadline">
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input" />
          </Field>
          <Field label="Location">
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
          </Field>
          <Field label="Organization">
            <input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} className="input" />
          </Field>

          {/* Stipend toggle + amount */}
          <Field label="Stipend / value">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.hasStipend}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      hasStipend: e.target.checked,
                      stipend: e.target.checked ? form.stipend : "",
                    })
                  }
                  className="h-4 w-4 accent-accent-500"
                />
                This opportunity offers a stipend
              </label>
              {form.hasStipend && (
                <input
                  value={form.stipend}
                  onChange={(e) => setForm({ ...form, stipend: e.target.value })}
                  placeholder="e.g. PKR 30,000 / month"
                  className="input"
                />
              )}
            </div>
          </Field>

          {/* Fee type: free / one-time / recurring */}
          <Field label="Application fee">
            <div className="space-y-2">
              <div className="flex gap-2">
                {(["free", "one_time", "recurring"] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setForm({ ...form, feeType: t, price: t === "free" ? 0 : form.price })}
                    className={clsx(
                      "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition",
                      form.feeType === t
                        ? "border-accent-500 bg-accent-500/15 text-accent-200"
                        : "border-[var(--border-default)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    {t === "free" ? "Free" : t === "one_time" ? "One-time fee" : "Recurring"}
                  </button>
                ))}
              </div>
              {form.feeType !== "free" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-tertiary)]">₨</span>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    placeholder="0"
                    className="input flex-1"
                  />
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {form.feeType === "recurring" ? "Per period" : "Per applicant"}
                  </span>
                </div>
              )}
              {form.feeType === "recurring" && (
                <input
                  value={form.feePeriod}
                  onChange={(e) => setForm({ ...form, feePeriod: e.target.value })}
                  placeholder='e.g. "4 months", "per semester", "12 weeks"'
                  className="input"
                />
              )}
            </div>
          </Field>
          <Field label="Application URL" full>
            <input value={form.applyUrl} onChange={(e) => setForm({ ...form, applyUrl: e.target.value })} className="input" />
          </Field>
          <Field label="Images" full>
            <ImageUploader
              images={gallery}
              storageKind="opportunities"
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
                  if (cover) {
                    setForm((f) => ({ ...f, image: cover.url }));
                  }
                  return arr;
                });
              }}
            />
          </Field>
          <Field label="Featured">
            <label className="flex items-center gap-3 text-sm pt-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="h-4 w-4 accent-accent-500" />
              Show in featured listings
            </label>
          </Field>
          <Field label="Published">
            <div className="space-y-2">
              <label className="flex items-center gap-3 text-sm pt-2">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 accent-accent-500" />
                Visible to users
              </label>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.registrationsOpen}
                  onChange={(e) => setForm({ ...form, registrationsOpen: e.target.checked })}
                  className="h-4 w-4 accent-accent-500"
                />
                Open for applications
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
              // If any uploads are still in flight, wait for them.
              const start = Date.now();
              while (
                cur.some((g) => g.status === "uploading") &&
                Date.now() - start < 30000
              ) {
                await new Promise((r) => setTimeout(r, 200));
                cur = galleryRef.current;
              }
              // Re-derive cover from latest gallery state
              const cover =
                cur.find((g) => g.isCover && g.status === "ready") ??
                cur.find((g) => g.status === "ready");
              const finalForm = cover
                ? { ...form, image: cover.url }
                : form;
              // Convert requirements/eligibility textareas (one per line)
              // into arrays; drop the field entirely if the toggle is off.
              const splitLines = (t: string) =>
                t
                  .split("\n")
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0);
              const payload = {
                ...finalForm,
                gallery: cur,
                requirements: form.showRequirements
                  ? splitLines(form.requirementsText)
                  : [],
                eligibility: form.showEligibility
                  ? splitLines(form.eligibilityText)
                  : [],
              };
              onSave(payload);
            }}
          >
            {gallery.some((g) => g.status === "uploading")
              ? "Uploading…"
              : initial
              ? "Save changes"
              : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={full ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">{label}</span>
      {children}
    </label>
  );
}
