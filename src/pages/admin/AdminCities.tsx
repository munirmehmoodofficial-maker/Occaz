import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Edit3, Trash2, MapPin, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../lib/toast";

interface CityRow {
  id: string;
  name: string;
  slug: string | null;
  country: string | null;
  province: string | null;
  status: string | null;
  order_idx: number | null;
  created_at: string | null;
}

const emptyForm = {
  name: "",
  slug: "",
  country: "Pakistan",
  province: "",
  status: "active",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function AdminCities() {
  const { push } = useToast();
  const [rows, setRows] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<CityRow | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cities")
      .select("*")
      .order("order_idx", { ascending: true, nullsFirst: false });
    if (error) {
      push("err", `Failed to load cities: ${error.message}`);
    } else {
      setRows((data ?? []) as CityRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        (c.country ?? "").toLowerCase().includes(t) ||
        (c.province ?? "").toLowerCase().includes(t),
    );
  }, [rows, q]);

  function openNew() {
    setForm(emptyForm);
    setEditing(null);
    setShowNew(true);
  }

  function openEdit(c: CityRow) {
    setForm({
      name: c.name ?? "",
      slug: c.slug ?? "",
      country: c.country ?? "Pakistan",
      province: c.province ?? "",
      status: c.status ?? "active",
    });
    setEditing(c);
    setShowNew(true);
  }

  function closeForm() {
    setShowNew(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function save() {
    if (!form.name.trim()) {
      push("err", "Name is required");
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: (form.slug || slugify(form.name)).trim(),
      country: form.country.trim() || null,
      province: form.province.trim() || null,
      status: form.status,
    };
    let error;
    if (editing) {
      const res = await supabase
        .from("cities")
        .update(payload)
        .eq("id", editing.id);
      error = res.error;
    } else {
      const res = await supabase.from("cities").insert(payload);
      error = res.error;
    }
    if (error) {
      push("err", `Save failed: ${error.message}`);
      return;
    }
    push("ok", editing ? "City updated" : "City created");
    closeForm();
    load();
  }

  async function remove(c: CityRow) {
    if (!confirm(`Delete city "${c.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("cities").delete().eq("id", c.id);
    if (error) {
      push("err", `Delete failed: ${error.message}`);
    } else {
      push("ok", "City deleted");
      load();
    }
  }

  async function toggleStatus(c: CityRow) {
    const newStatus = c.status === "active" ? "draft" : "active";
    const { error } = await supabase
      .from("cities")
      .update({ status: newStatus })
      .eq("id", c.id);
    if (error) {
      push("err", `Update failed: ${error.message}`);
    } else {
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cities</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Manage the city directory used across events and opportunities
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openNew}
        >
          Add city
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)]">
        <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, country or province..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
        />
        <span className="text-xs text-[var(--text-tertiary)]">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-default)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {editing ? `Edit city — ${editing.name}` : "New city"}
              </h2>
              <button
                onClick={closeForm}
                className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--bg-card-hover)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Name *
                </span>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name: v,
                      // Auto-fill slug from name if slug hasn't been edited
                      slug: f.slug && f.slug !== slugify(f.name) ? f.slug : slugify(v),
                    }));
                  }}
                  placeholder="e.g. Lahore"
                  className="input"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Slug
                </span>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="auto from name"
                  className="input"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Country
                </span>
                <input
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  placeholder="Pakistan"
                  className="input"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Province / State
                </span>
                <input
                  value={form.province}
                  onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                  placeholder="Punjab"
                  className="input"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Status
                </span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="input"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button onClick={save}>{editing ? "Save changes" : "Create city"}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-[var(--text-tertiary)]">
            Loading cities...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-sm text-[var(--text-tertiary)]">
            <MapPin className="h-8 w-8 opacity-30" />
            {rows.length === 0
              ? "No cities yet. Click \"Add city\" to add one."
              : "No cities match your search."}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 p-4 transition hover:bg-[var(--bg-card-hover)]"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-500/15 text-accent-400">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {c.name}
                    </div>
                    <Badge tone={c.status === "active" ? "emerald" : "amber"}>
                      {c.status ?? "draft"}
                    </Badge>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
                    {c.province || "—"}
                    {c.province && c.country ? " · " : ""}
                    {c.country || ""}
                    {c.slug ? ` · /${c.slug}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleStatus(c)}
                    className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                    aria-label="Toggle status"
                    title={
                      c.status === "active"
                        ? "Deactivate (set to draft)"
                        : "Activate"
                    }
                  >
                    {c.status === "active" ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                    aria-label="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-red-500/15 hover:text-red-400"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
