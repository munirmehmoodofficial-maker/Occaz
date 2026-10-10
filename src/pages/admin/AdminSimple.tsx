import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Tag,
  CheckCircle2,
  Star,
  Download,
  X,
  Search,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  Calendar,
  Users,
  Shield,
  ShieldCheck,
  ShieldOff,
  Crown,
  Sparkles,
  Check,
  Ban,
  ExternalLink,
  User as UserIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  user as mockUser,
} from "../../data/mock";
import { useDataStore } from "../../data/store";
import { useEvents } from "../../hooks/useListings";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../lib/toast";
import clsx from "clsx";

export function AdminCategories() {
  const { push } = useToast();
  type Cat = { id: string; name: string; kind: string; created_at?: string };
  const [rows, setRows] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [newOpp, setNewOpp] = useState("");
  const [editing, setEditing] = useState<Cat | null>(null);
  const [editValue, setEditValue] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, kind, created_at")
      .order("kind", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      push("err", `Failed to load categories: ${error.message}`);
    } else {
      setRows((data ?? []) as Cat[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventCats = rows.filter((r) => r.kind === "event");
  const oppCats = rows.filter((r) => r.kind === "opportunity");

  function matchesQ(c: Cat) {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return c.name.toLowerCase().includes(t);
  }

  async function addCategory(kind: "event" | "opportunity", name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      push("err", "Category name is required");
      return;
    }
    // Unique check
    const existing = rows.find(
      (r) => r.kind === kind && r.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      push("err", `"${trimmed}" already exists in ${kind} categories`);
      return;
    }
    const id =
      kind + ":" + trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { error } = await supabase.from("categories").insert({
      id,
      name: trimmed,
      kind,
    });
    if (error) {
      push("err", `Add failed: ${error.message}`);
      return;
    }
    push("ok", `Added "${trimmed}"`);
    if (kind === "event") setNewEvent("");
    else setNewOpp("");
    load();
  }

  async function saveEdit() {
    if (!editing) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      push("err", "Category name is required");
      return;
    }
    const { error } = await supabase
      .from("categories")
      .update({ name: trimmed })
      .eq("id", editing.id);
    if (error) {
      push("err", `Update failed: ${error.message}`);
      return;
    }
    push("ok", "Category updated");
    setEditing(null);
    setEditValue("");
    load();
  }

  async function remove(c: Cat) {
    if (!confirm(`Delete category "${c.name}"? Items using it will keep the ID but lose the label.`))
      return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) {
      push("err", `Delete failed: ${error.message}`);
    } else {
      push("ok", "Category deleted");
      load();
    }
  }

  function startEdit(c: Cat) {
    setEditing(c);
    setEditValue(c.name);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Manage event and opportunity categories
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search categories..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)]"
        />
        <span className="text-xs text-[var(--text-tertiary)]">
          {rows.length} total
        </span>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-[var(--bg-elevated)] p-6 ring-1 ring-[var(--border-default)]"
            >
              <h2 className="mb-4 text-lg font-semibold">
                Edit {editing.kind} category
              </h2>
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") setEditing(null);
                }}
                autoFocus
                className="input w-full"
              />
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button onClick={saveEdit}>Save</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event categories */}
      <CategorySection
        title="Event categories"
        kind="event"
        accentClass="text-accent-400"
        rows={eventCats}
        loading={loading}
        matchesQ={matchesQ}
        value={newEvent}
        onChange={setNewEvent}
        onAdd={() => addCategory("event", newEvent)}
        onEdit={startEdit}
        onDelete={remove}
      />

      {/* Opportunity categories */}
      <CategorySection
        title="Opportunity categories"
        kind="opportunity"
        accentClass="text-pink-400"
        rows={oppCats}
        loading={loading}
        matchesQ={matchesQ}
        value={newOpp}
        onChange={setNewOpp}
        onAdd={() => addCategory("opportunity", newOpp)}
        onEdit={startEdit}
        onDelete={remove}
      />
    </div>
  );
}

function CategorySection({
  title,
  kind,
  accentClass,
  rows,
  loading,
  matchesQ,
  value,
  onChange,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string;
  kind: string;
  accentClass: string;
  rows: { id: string; name: string; kind: string; created_at?: string }[];
  loading: boolean;
  matchesQ: (c: { name: string }) => boolean;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  onEdit: (c: { id: string; name: string; kind: string }) => void;
  onDelete: (c: { id: string; name: string; kind: string }) => void;
}) {
  const filtered = rows.filter(matchesQ);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="rounded-full bg-[var(--bg-card)] px-2 py-0.5 text-xs text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
            {rows.length}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onAdd();
            }}
            placeholder={`New ${kind} category...`}
            className="input w-56"
          />
          <Button onClick={onAdd} leftIcon={<Plus className="h-4 w-4" />}>
            Add
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
          {rows.length === 0
            ? `No ${kind} categories yet. Add one above.`
            : "No matches for your search."}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((c) => (
            <motion.div
              key={c.id}
              layout
              className="group flex items-center justify-between rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)] hover:ring-[var(--border-default)]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Tag className={`h-4 w-4 shrink-0 ${accentClass}`} />
                <span className="truncate text-sm font-medium">{c.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => onEdit(c)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                  aria-label="Edit"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDelete(c)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-[var(--text-tertiary)] hover:bg-red-500/15 hover:text-red-400"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminUsers() {
  const users = [
    { ...mockUser, role: "User", status: "Active", joined: mockUser.joined },
    {
      id: "u2",
      name: "Marcus Chen",
      handle: "@marcuschen",
      avatar: "https://picsum.photos/seed/u2/200/200",
      email: "marcus@occaz.app",
      role: "Admin",
      status: "Active",
      joined: "January 2024",
    },
    {
      id: "u3",
      name: "Priya Patel",
      handle: "@priya",
      avatar: "https://picsum.photos/seed/u3/200/200",
      email: "priya@gmail.com",
      role: "Organizer",
      status: "Active",
      joined: "August 2025",
    },
    {
      id: "u4",
      name: "Diego Lopez",
      handle: "@diego",
      avatar: "https://picsum.photos/seed/u4/200/200",
      email: "diego@gmail.com",
      role: "User",
      status: "Suspended",
      joined: "March 2025",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">{users.length} registered users</p>
        </div>
        <Button leftIcon={<Download className="h-4 w-4" />} variant="outline">Export CSV</Button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-[var(--text-tertiary)]">{u.handle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{u.email}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{u.role}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{u.joined}</td>
                  <td className="px-5 py-3">
                    <Badge tone={u.status === "Active" ? "emerald" : "red"}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--bg-card-hover)] hover:text-white">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-tertiary)] hover:bg-red-500/15 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminOrganizers() {
  const events = useEvents();
  const { push } = useToast();
  const [list, setList] = useState<any[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "starter" | "pro" | "business" | "none">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "published" | "unpublished">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Manual add organizer modal
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<"existing" | "standalone">("existing");
  const [addEmail, setAddEmail] = useState("");
  const [addDisplayName, setAddDisplayName] = useState("");
  const [addSlug, setAddSlug] = useState("");
  const [addPlan, setAddPlan] = useState<"starter" | "pro" | "business" | "none">("starter");
  const [addBio, setAddBio] = useState("");
  const [addCity, setAddCity] = useState("");
  const [addContactEmail, setAddEmail2] = useState("");
  const [addContactPhone, setAddPhone] = useState("");
  const [addOrganizerType, setAddOrganizerType] = useState<"individual" | "event_company" | "university_society" | "business_venue" | "ngo_organization" | "other">("individual");
  const [addPublishImmediately, setAddPublishImmediately] = useState(false);
  const [addVerifying, setAddVerifying] = useState(false);

  // Standalone organizer: organizer_profiles.id has to reference auth.users(id).
  // For a brand-only entry we generate a deterministic UUID from a stable seed.
  // In practice the admin should add an existing user. We surface this clearly.
  const STANDALONE_UUID_PREFIX = "00000000-0000-0000-0000-";

  function makeStandaloneUuid(slug: string): string {
    // Use a simple hash so the same slug always produces the same UUID.
    // The first 24 chars are zeroed; the last 12 are 0-padded hex from a hash.
    let h = 5381;
    for (let i = 0; i < slug.length; i++) {
      h = (h * 33) ^ slug.charCodeAt(i);
    }
    const hex = (h >>> 0).toString(16).padStart(8, "0");
    return `${STANDALONE_UUID_PREFIX}${hex.slice(0, 12)}`;
  }

  function resetAdd() {
    setAddEmail("");
    setAddDisplayName("");
    setAddSlug("");
    setAddPlan("starter");
    setAddBio("");
    setAddCity("");
    setAddEmail2("");
    setAddPhone("");
    setAddOrganizerType("individual");
    setAddPublishImmediately(false);
    setAddVerifying(false);
    setAddMode("existing");
  }

  async function submitAdd() {
    if (addMode === "existing") {
      if (!addEmail.trim()) {
        push({ tone: "red", title: "Email required", message: "Enter the user's email address." });
        return;
      }
    } else {
      if (!addDisplayName.trim()) {
        push({ tone: "red", title: "Brand name required", message: "Enter the brand / organizer name." });
        return;
      }
      if (!addSlug.trim()) {
        push({ tone: "red", title: "Slug required", message: "Enter a public slug (e.g. blooms-bloomers)." });
        return;
      }
      // validate slug format
      if (!/^[a-z0-9-]+$/.test(addSlug.trim())) {
        push({ tone: "red", title: "Invalid slug", message: "Use lowercase letters, numbers, and dashes only." });
        return;
      }
    }
    setAddVerifying(true);
    try {
      let userId: string | null = null;
      let userEmail: string | null = null;
      let userFullName: string | null = null;

      if (addMode === "existing") {
        // 1. Look up the user by email from profiles
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("id, email, full_name, is_organizer")
          .eq("email", addEmail.trim().toLowerCase())
          .maybeSingle();
        if (profErr) {
          push({ tone: "red", title: "Lookup failed", message: profErr.message });
          return;
        }
        if (!prof) {
          push({
            tone: "red",
            title: "User not found",
            message: `No user with email "${addEmail}". They must sign up first.`,
          });
          return;
        }
        userId = prof.id;
        userEmail = prof.email ?? addEmail.trim().toLowerCase();
        userFullName = prof.full_name ?? null;
        // 2. Check if an organizer profile already exists
        const { data: existing } = await supabase
          .from("organizer_profiles")
          .select("id")
          .eq("id", prof.id)
          .maybeSingle();
        if (existing) {
          push({
            tone: "amber",
            title: "Already an organizer",
            message: `${prof.email} already has an organizer profile.`,
          });
          return;
        }
      } else {
        // Standalone mode: use a deterministic UUID derived from the slug
        userId = makeStandaloneUuid(addSlug.trim());
        userEmail = addContactEmail.trim() || null;
        userFullName = addDisplayName.trim();
      }

      // 3. Build the organizer_profiles payload
      const slugBase = addMode === "existing" ? (addSlug.trim() || slugify(addDisplayName) || slugify(userEmail ?? "user")) : addSlug.trim();
      const payload: any = {
        id: userId,
        display_name: addMode === "existing" ? (addDisplayName.trim() || userFullName || userEmail) : addDisplayName.trim(),
        slug: slugBase,
        bio: addBio.trim() || null,
        city: addCity.trim() || null,
        contact_email: (addMode === "existing" ? userEmail : addContactEmail.trim()) || null,
        contact_phone: addContactPhone.trim() || null,
        organizer_type: addOrganizerType,
        plan: addPlan === "none" ? null : addPlan,
        verification_status: addPublishImmediately ? "approved" : "pending",
        is_published: addPublishImmediately,
        verified: false,
        updated_at: new Date().toISOString(),
      };

      // 4. Insert into organizer_profiles
      const { error: insErr } = await supabase
        .from("organizer_profiles")
        .insert(payload);
      if (insErr) {
        push({ tone: "red", title: "Insert failed", message: insErr.message });
        return;
      }

      // 5. For existing-user mode, also flag the profile as organizer
      if (addMode === "existing" && userId) {
        await supabase
          .from("profiles")
          .update({ is_organizer: true })
          .eq("id", userId);
      }

      push({
        tone: "green",
        title: "Organizer added",
        message: `${payload.display_name} is now ${addPublishImmediately ? "live on Occaz" : "pending review"}.`,
      });
      setAddOpen(false);
      resetAdd();
      load();
    } finally {
      setAddVerifying(false);
    }
  }

  // Columns we want from organizer_profiles. Falls back to a minimal set
  // on older deployments where some columns are missing.
  const FULL_COLS = "id, display_name, slug, logo, cover_image, bio, website, instagram, facebook, tiktok, contact_email, contact_phone, phone, city, address, operating_cities, organizer_type, plan, verification_status, is_published, verified, created_at, updated_at";

  async function load() {
    setLoading(true);
    try {
      // 1. Pull organizer profiles
      let data: any = null;
      try {
        const r = await supabase
          .from("organizer_profiles")
          .select(FULL_COLS)
          .order("created_at", { ascending: false });
        data = r.data;
        if (r.error) data = null;
      } catch {}
      // Fallback: minimal set
      if (!data) {
        try {
          const r = await supabase
            .from("organizer_profiles")
            .select("id, display_name, slug, logo, bio, plan, verified, created_at")
            .order("created_at", { ascending: false });
          data = r.data;
        } catch {
          data = [];
        }
      }
      setList(data ?? []);

      // 2. Pull associated profiles (email, full_name, role) so we can show
      // them in the admin drawer.
      const ids = (data ?? []).map((o: any) => o.id);
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, is_organizer, status")
          .in("id", ids);
        const map: Record<string, any> = {};
        (profs ?? []).forEach((p: any) => {
          map[p.id] = p;
        });
        setProfilesById(map);
      } else {
        setProfilesById({});
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // realtime refresh
  useEffect(() => {
    const ch = supabase
      .channel("admin-organizers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organizer_profiles" },
        () => {
          load();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Action handlers ----
  async function setVerified(id: string, verified: boolean) {
    setBusyId(id);
    try {
      const patch: any = { verified, updated_at: new Date().toISOString() };
      const { error } = await supabase
        .from("organizer_profiles")
        .update(patch)
        .eq("id", id);
      if (error) {
        push({ tone: "red", title: "Update failed", message: error.message });
        return;
      }
      setList((prev) =>
        prev.map((o) => (o.id === id ? { ...o, verified } : o)),
      );
      if (view?.id === id) setView({ ...view, verified });
      push({
        tone: "green",
        title: verified ? "Verified" : "Unverified",
        message: `${view?.display_name ?? "Organizer"} has been ${verified ? "verified" : "unverified"}.`,
      });
    } finally {
      setBusyId(null);
    }
  }

  async function setPublished(id: string, is_published: boolean) {
    setBusyId(id);
    try {
      const { error } = await supabase
        .from("organizer_profiles")
        .update({ is_published, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) {
        push({ tone: "red", title: "Update failed", message: error.message });
        return;
      }
      setList((prev) =>
        prev.map((o) => (o.id === id ? { ...o, is_published } : o)),
      );
      if (view?.id === id) setView({ ...view, is_published });
      push({
        tone: is_published ? "green" : "amber",
        title: is_published ? "Published" : "Unpublished",
        message: `${view?.display_name ?? "Organizer"} is now ${is_published ? "visible" : "hidden"} on the public directory.`,
      });
    } finally {
      setBusyId(null);
    }
  }

  async function setVerificationStatus(id: string, status: string) {
    setBusyId(id);
    try {
      const { error } = await supabase
        .from("organizer_profiles")
        .update({ verification_status: status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) {
        push({ tone: "red", title: "Update failed", message: error.message });
        return;
      }
      // If approved, also publish
      if (status === "approved") {
        await supabase
          .from("organizer_profiles")
          .update({ is_published: true })
          .eq("id", id);
      }
      setList((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, verification_status: status, is_published: status === "approved" ? true : o.is_published }
            : o,
        ),
      );
      if (view?.id === id) {
        setView({ ...view, verification_status: status, is_published: status === "approved" ? true : view.is_published });
      }
      push({
        tone: status === "approved" ? "green" : status === "rejected" ? "red" : "amber",
        title: `Verification: ${status}`,
        message: `${view?.display_name ?? "Organizer"} has been ${status}.`,
      });
    } finally {
      setBusyId(null);
    }
  }

  async function setPlan(id: string, plan: string) {
    setBusyId(id);
    try {
      const { error } = await supabase
        .from("organizer_profiles")
        .update({ plan: plan === "none" ? null : plan, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) {
        push({ tone: "red", title: "Update failed", message: error.message });
        return;
      }
      setList((prev) =>
        prev.map((o) => (o.id === id ? { ...o, plan } : o)),
      );
      if (view?.id === id) setView({ ...view, plan });
      push({
        tone: "green",
        title: "Plan updated",
        message: `${view?.display_name ?? "Organizer"} is now on ${plan}.`,
      });
    } finally {
      setBusyId(null);
    }
  }

  async function deleteOrganizer(id: string) {
    if (!confirm("Delete this organizer profile? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const { error } = await supabase
        .from("organizer_profiles")
        .delete()
        .eq("id", id);
      if (error) {
        push({ tone: "red", title: "Delete failed", message: error.message });
        return;
      }
      setList((prev) => prev.filter((o) => o.id !== id));
      if (view?.id === id) setView(null);
      push({ tone: "green", title: "Deleted", message: "Organizer profile removed." });
    } finally {
      setBusyId(null);
    }
  }

  // ---- Derived data ----
  const eventsCountByOrg: Record<string, number> = {};
  events.forEach((e) => {
    if (!e.organizer) return;
    eventsCountByOrg[e.organizer] = (eventsCountByOrg[e.organizer] ?? 0) + 1;
  });

  // Filtered list
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return list.filter((o) => {
      if (planFilter !== "all") {
        const p = o.plan ?? "none";
        if (p !== planFilter) return false;
      }
      if (statusFilter !== "all") {
        if (statusFilter === "pending") {
          if (o.verification_status && o.verification_status !== "pending") return false;
        } else if (statusFilter === "approved") {
          if (o.verification_status !== "approved") return false;
        } else if (statusFilter === "rejected") {
          if (o.verification_status !== "rejected") return false;
        } else if (statusFilter === "published") {
          if (!o.is_published) return false;
        } else if (statusFilter === "unpublished") {
          if (o.is_published) return false;
        }
      }
      if (term) {
        const p = profilesById[o.id];
        const hay = [
          o.display_name,
          o.slug,
          o.bio,
          o.city,
          o.contact_email,
          o.email,
          p?.email,
          p?.full_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [list, planFilter, statusFilter, q, profilesById]);

  // Stats
  const stats = useMemo(() => {
    const total = list.length;
    const verified = list.filter((o) => o.verified).length;
    const pending = list.filter((o) => !o.verification_status || o.verification_status === "pending").length;
    const approved = list.filter((o) => o.verification_status === "approved").length;
    const published = list.filter((o) => o.is_published).length;
    const pro = list.filter((o) => o.plan === "pro").length;
    const business = list.filter((o) => o.plan === "business").length;
    const starter = list.filter((o) => o.plan === "starter" || !o.plan).length;
    return { total, verified, pending, approved, published, pro, business, starter };
  }, [list]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizers</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            {list.length} total · {stats.published} published · {stats.pending} pending review
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Export
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setAddOpen(true)}
          >
            Add organizer
          </Button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">Total</span>
            <Building2 className="h-4 w-4 text-[var(--text-tertiary)]" />
          </div>
          <div className="mt-1 text-2xl font-bold">{stats.total}</div>
          <div className="mt-1 text-[10px] text-[var(--text-tertiary)]">{stats.starter} Starter · {stats.pro} Pro · {stats.business} Business</div>
        </div>
        <div className="rounded-2xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">Pending review</span>
            <ShieldOff className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-400">{stats.pending}</div>
          <div className="mt-1 text-[10px] text-[var(--text-tertiary)]">awaiting verification</div>
        </div>
        <div className="rounded-2xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">Verified</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-400">{stats.verified}</div>
          <div className="mt-1 text-[10px] text-[var(--text-tertiary)]">{stats.approved} formally approved</div>
        </div>
        <div className="rounded-2xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">Published</span>
            <CheckCircle2 className="h-4 w-4 text-accent-400" />
          </div>
          <div className="mt-1 text-2xl font-bold text-accent-400">{stats.published}</div>
          <div className="mt-1 text-[10px] text-[var(--text-tertiary)]">visible on public directory</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, slug, email, city…"
            className="h-10 w-full rounded-lg bg-[var(--bg-card)] pl-10 pr-3 text-sm ring-1 ring-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-accent-500/40"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as any)}
          className="h-10 rounded-lg bg-[var(--bg-card)] px-3 text-sm ring-1 ring-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-accent-500/40"
        >
          <option value="all">All plans</option>
          <option value="none">No plan</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 rounded-lg bg-[var(--bg-card)] px-3 text-sm ring-1 ring-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-accent-500/40"
        >
          <option value="all">All status</option>
          <option value="pending">Pending review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <div className="text-xs text-[var(--text-tertiary)]">
          {filtered.length} / {list.length}
        </div>
      </div>

      {/* Organizer grid */}
      {loading ? (
        <div className="rounded-2xl bg-[var(--bg-card)] p-12 text-center text-sm text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
          Loading organizers…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center">
          <p className="text-sm text-[var(--text-tertiary)]">
            {list.length === 0
              ? "No organizers yet. Anyone can become an organizer from their profile page."
              : "No organizers match the current filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => {
            const count = eventsCountByOrg[o.display_name] ?? 0;
            const profile = profilesById[o.id];
            const plan = o.plan;
            const verification = o.verification_status ?? "pending";
            const isPublished = Boolean(o.is_published);
            return (
              <div
                key={o.id}
                className="overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)] transition hover:ring-[var(--border-default)]"
              >
                {/* Cover band */}
                {o.cover_image ? (
                  <div
                    className="h-16 w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${o.cover_image})` }}
                  />
                ) : (
                  <div className="h-16 w-full bg-gradient-to-r from-accent-500/30 via-pink-500/20 to-violet-500/30" />
                )}

                <div className="p-5">
                  <div className="-mt-12 flex items-end justify-between">
                    {o.logo ? (
                      <img
                        src={o.logo}
                        className="h-14 w-14 rounded-xl border-4 border-[var(--bg-card)] object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="grid h-14 w-14 place-items-center rounded-xl border-4 border-[var(--bg-card)] bg-gradient-to-br from-accent-500 to-pink-500 text-base font-bold text-white">
                        {(o.display_name || "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-1">
                      {o.verified && (
                        <Badge tone="emerald">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </Badge>
                      )}
                      {!isPublished && (
                        <Badge tone="amber">
                          <ShieldOff className="h-3 w-3" /> Hidden
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="truncate text-base font-semibold">{o.display_name}</div>
                    <div className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                      {profile?.email ?? o.contact_email ?? "no email"} ·{" "}
                      {count} event{count === 1 ? "" : "s"}
                    </div>
                  </div>

                  {o.bio && (
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--text-tertiary)]">
                      {o.bio}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <Badge tone={plan === "business" ? "violet" : plan === "pro" ? "amber" : "default"}>
                      {plan === "pro" ? (
                        <>
                          <Crown className="h-3 w-3" /> Pro
                        </>
                      ) : plan === "business" ? (
                        <>
                          <Sparkles className="h-3 w-3" /> Business
                        </>
                      ) : plan === "starter" ? (
                        "Starter"
                      ) : (
                        "No plan"
                      )}
                    </Badge>
                    <Badge
                      tone={
                        verification === "approved"
                          ? "emerald"
                          : verification === "rejected"
                            ? "red"
                            : "amber"
                      }
                    >
                      {verification === "approved" ? (
                        <>
                          <Check className="h-3 w-3" /> Approved
                        </>
                      ) : verification === "rejected" ? (
                        <>
                          <Ban className="h-3 w-3" /> Rejected
                        </>
                      ) : (
                        <>
                          <Shield className="h-3 w-3" /> Pending
                        </>
                      )}
                    </Badge>
                    {o.city && <Badge>📍 {o.city}</Badge>}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setView(o)}
                    >
                      Review
                    </Button>
                    {o.slug && (
                      <a
                        href={`/organizers/${o.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-transparent px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                      >
                        <ExternalLink className="h-3 w-3" /> Public
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed review drawer */}
      <AnimatePresence>
        {view && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setView(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: 600, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 600, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-hidden border-l border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-2xl"
            >
              {/* Cover + logo header */}
              {view.cover_image ? (
                <div
                  className="h-28 shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${view.cover_image})` }}
                />
              ) : (
                <div className="h-28 shrink-0 bg-gradient-to-r from-accent-500/30 via-pink-500/20 to-violet-500/30" />
              )}

              <div className="-mt-10 flex-1 overflow-y-auto px-6 pb-6">
                <div className="flex items-end justify-between">
                  {view.logo ? (
                    <img
                      src={view.logo}
                      className="h-20 w-20 rounded-2xl border-4 border-[var(--bg-base)] object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-[var(--bg-base)] bg-gradient-to-br from-accent-500 to-pink-500 text-2xl font-bold text-white">
                      {(view.display_name || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => setView(null)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3">
                  <h2 className="text-xl font-semibold">{view.display_name}</h2>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    {view.slug && (
                      <span className="font-mono">/organizers/{view.slug}</span>
                    )}
                    {view.verified && (
                      <Badge tone="emerald">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </Badge>
                    )}
                    {!view.is_published && (
                      <Badge tone="amber">Hidden</Badge>
                    )}
                  </div>
                </div>

                {view.bio && (
                  <p className="mt-4 rounded-lg bg-[var(--bg-card)] p-3 text-sm text-[var(--text-secondary)]">
                    {view.bio}
                  </p>
                )}

                {/* Verification action */}
                <div className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Verification
                  </div>
                  <div className="mt-1 text-sm">
                    Current status: <strong>{
                      view.verification_status === "approved" ? "Approved"
                        : view.verification_status === "rejected" ? "Rejected"
                          : "Pending review"
                    }</strong>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => setVerificationStatus(view.id, "approved")}
                      disabled={busyId === view.id}
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setVerificationStatus(view.id, "rejected")}
                      disabled={busyId === view.id}
                      leftIcon={<Ban className="h-3.5 w-3.5" />}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setVerificationStatus(view.id, "pending")}
                      disabled={busyId === view.id}
                    >
                      Reset to pending
                    </Button>
                  </div>
                </div>

                {/* Plan management */}
                <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Plan
                  </div>
                  <div className="mt-1 text-sm">
                    Current plan: <strong>
                      {view.plan === "pro" ? "Pro · Rs 5,000/mo"
                        : view.plan === "business" ? "Business · Rs 12,000/mo"
                          : view.plan === "starter" ? "Starter · Rs 3,000/mo"
                            : "No plan"}
                    </strong>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["starter", "pro", "business", "none"] as const).map((p) => (
                      <Button
                        key={p}
                        size="sm"
                        variant={(p === "none" ? !view.plan : view.plan === p) ? "secondary" : "outline"}
                        onClick={() => setPlan(view.id, p)}
                        disabled={busyId === view.id}
                      >
                        {p === "none" ? "No plan" : p[0].toUpperCase() + p.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Verified toggle */}
                <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Verified badge
                      </div>
                      <div className="mt-1 text-sm">
                        Public "Verified" tick on profile page
                      </div>
                    </div>
                    <button
                      onClick={() => setVerified(view.id, !view.verified)}
                      disabled={busyId === view.id}
                      className={clsx(
                        "relative h-6 w-11 rounded-full transition",
                        view.verified ? "bg-emerald-500" : "bg-[var(--bg-elevated)]",
                      )}
                    >
                      <span
                        className={clsx(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                          view.verified ? "left-5" : "left-0.5",
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Publish toggle */}
                <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Public directory
                      </div>
                      <div className="mt-1 text-sm">
                        {view.is_published ? "Visible at /organizers" : "Hidden from /organizers"}
                      </div>
                    </div>
                    <button
                      onClick={() => setPublished(view.id, !view.is_published)}
                      disabled={busyId === view.id}
                      className={clsx(
                        "relative h-6 w-11 rounded-full transition",
                        view.is_published ? "bg-emerald-500" : "bg-[var(--bg-elevated)]",
                      )}
                    >
                      <span
                        className={clsx(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                          view.is_published ? "left-5" : "left-0.5",
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Account & user info */}
                <Section title="Account">
                  <Row icon={<UserIcon className="h-3.5 w-3.5" />} label="Full name">
                    {profilesById[view.id]?.full_name || "—"}
                  </Row>
                  <Row icon={<Mail className="h-3.5 w-3.5" />} label="Login email">
                    {profilesById[view.id]?.email ? (
                      <a href={`mailto:${profilesById[view.id].email}`} className="hover:underline">
                        {profilesById[view.id].email}
                      </a>
                    ) : "—"}
                  </Row>
                  <Row icon={<Shield className="h-3.5 w-3.5" />} label="Account role">
                    {profilesById[view.id]?.role || "user"}
                  </Row>
                  <Row icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Organizer flag">
                    {profilesById[view.id]?.is_organizer ? "Yes" : "No"}
                  </Row>
                  <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Joined">
                    {new Date(view.created_at).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Row>
                  <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Last updated">
                    {view.updated_at
                      ? new Date(view.updated_at).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </Row>
                </Section>

                {/* Brand & profile info */}
                <Section title="Brand & profile">
                  <Row label="Brand / organizer name">
                    <span className="font-semibold">{view.display_name || "—"}</span>
                  </Row>
                  <Row label="Public slug">
                    <code className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-xs">
                      /organizers/{view.slug || "—"}
                    </code>
                  </Row>
                  {view.bio && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Bio
                      </div>
                      <div className="mt-1 rounded-lg bg-[var(--bg-elevated)] p-3 text-[var(--text-secondary)]">
                        {view.bio}
                      </div>
                    </div>
                  )}
                  <Row label="Organizer type">
                    {view.organizer_type ? (
                      <span className="capitalize">{view.organizer_type.replace(/_/g, " ")}</span>
                    ) : "—"}
                  </Row>
                  <Row label="Logo">
                    {view.logo ? (
                      <a href={view.logo} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-accent-400 hover:underline">
                        <img src={view.logo} alt="logo" className="h-8 w-8 rounded-md object-cover" />
                        View image ↗
                      </a>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">not uploaded</span>
                    )}
                  </Row>
                  <Row label="Cover image">
                    {view.cover_image ? (
                      <a href={view.cover_image} target="_blank" rel="noreferrer" className="text-accent-400 hover:underline">
                        View image ↗
                      </a>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">not uploaded</span>
                    )}
                  </Row>
                </Section>

                {/* Contact info */}
                <Section title="Contact">
                  <Row icon={<Mail className="h-3.5 w-3.5" />} label="Public contact email">
                    {view.contact_email ? (
                      <a href={`mailto:${view.contact_email}`} className="hover:underline">
                        {view.contact_email}
                      </a>
                    ) : "—"}
                  </Row>
                  <Row icon={<Phone className="h-3.5 w-3.5" />} label="Public contact phone">
                    {view.contact_phone ? (
                      <a href={`tel:${view.contact_phone}`} className="hover:underline">
                        {view.contact_phone}
                      </a>
                    ) : "—"}
                  </Row>
                  <Row icon={<Phone className="h-3.5 w-3.5" />} label="Account phone">
                    {view.phone || "—"}
                  </Row>
                  <Row icon={<MapPin className="h-3.5 w-3.5" />} label="Home city">
                    {view.city || "—"}
                  </Row>
                  <Row icon={<MapPin className="h-3.5 w-3.5" />} label="Address / venue">
                    {view.address || "—"}
                  </Row>
                  <Row icon={<Globe className="h-3.5 w-3.5" />} label="Website">
                    {view.website ? (
                      <a href={view.website} target="_blank" rel="noreferrer" className="hover:underline">
                        {view.website}
                      </a>
                    ) : "—"}
                  </Row>
                </Section>

                {/* Social */}
                {(view.instagram || view.facebook || view.tiktok) && (
                  <Section title="Social media">
                    {view.instagram && (
                      <Row label="Instagram">
                        <a href={view.instagram} target="_blank" rel="noreferrer" className="text-accent-400 hover:underline">
                          {view.instagram} ↗
                        </a>
                      </Row>
                    )}
                    {view.facebook && (
                      <Row label="Facebook">
                        <a href={view.facebook} target="_blank" rel="noreferrer" className="text-accent-400 hover:underline">
                          {view.facebook} ↗
                        </a>
                      </Row>
                    )}
                    {view.tiktok && (
                      <Row label="TikTok">
                        <a href={view.tiktok} target="_blank" rel="noreferrer" className="text-accent-400 hover:underline">
                          {view.tiktok} ↗
                        </a>
                      </Row>
                    )}
                  </Section>
                )}

                {/* Operating cities */}
                {Array.isArray(view.operating_cities) && view.operating_cities.length > 0 && (
                  <Section title="Operating cities">
                    <div className="flex flex-wrap gap-1.5">
                      {view.operating_cities.map((c: string) => (
                        <Badge key={c}>📍 {c}</Badge>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Activity */}
                <Section title="Activity">
                  <Row icon={<Users className="h-3.5 w-3.5" />} label="Events on Occaz">
                    {eventsCountByOrg[view.display_name] ?? 0}
                  </Row>
                </Section>

                {/* Social */}
                {(view.instagram || view.facebook || view.tiktok) && (
                  <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-xs">
                    {view.instagram && (
                      <a href={view.instagram} target="_blank" rel="noreferrer" className="text-accent-400 hover:underline">
                        Instagram
                      </a>
                    )}
                    {view.facebook && (
                      <a href={view.facebook} target="_blank" rel="noreferrer" className="text-accent-400 hover:underline">
                        Facebook
                      </a>
                    )}
                    {view.tiktok && (
                      <a href={view.tiktok} target="_blank" rel="noreferrer" className="text-accent-400 hover:underline">
                        TikTok
                      </a>
                    )}
                  </div>
                )}

                {/* Operating cities */}
                {Array.isArray(view.operating_cities) && view.operating_cities.length > 0 && (
                  <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      Operating cities
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {view.operating_cities.map((c: string) => (
                        <Badge key={c}>📍 {c}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions footer */}
                <div className="mt-6 flex gap-2">
                  {view.slug && (
                    <a
                      href={`/organizers/${view.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-accent-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Open public page →
                    </a>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => deleteOrganizer(view.id)}
                    disabled={busyId === view.id}
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Add organizer modal */}
      <AnimatePresence>
        {addOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !addVerifying && setAddOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Add organizer</h2>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      Create a new organizer record. For existing users, link it to their account so they can sign in and manage it.
                    </p>
                  </div>
                  <button
                    onClick={() => !addVerifying && setAddOpen(false)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Mode toggle */}
                <div className="mt-4 flex gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1">
                  <button
                    type="button"
                    onClick={() => setAddMode("existing")}
                    className={clsx(
                      "flex-1 rounded-lg py-1.5 text-xs font-medium transition",
                      addMode === "existing"
                        ? "bg-white text-black"
                        : "text-[var(--text-tertiary)] hover:text-white",
                    )}
                  >
                    Existing user
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode("standalone")}
                    className={clsx(
                      "flex-1 rounded-lg py-1.5 text-xs font-medium transition",
                      addMode === "standalone"
                        ? "bg-white text-black"
                        : "text-[var(--text-tertiary)] hover:text-white",
                    )}
                  >
                    Standalone brand
                  </button>
                </div>

                <p className="mt-3 text-[10px] text-[var(--text-tertiary)]">
                  {addMode === "existing"
                    ? "Link an Occaz user account to an organizer profile. They must already have signed up."
                    : "Create a brand-only organizer without a user login. Useful for partners, sponsors, or groups managed by an admin."}
                </p>

                <div className="mt-4 space-y-3">
                  {addMode === "existing" ? (
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)]">
                        User email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="mt-1 h-10 w-full rounded-lg bg-[var(--bg-card)] px-3 text-sm ring-1 ring-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                      />
                    </div>
                  ) : null}

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                      Brand / organizer name <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={addDisplayName}
                      onChange={(e) => setAddDisplayName(e.target.value)}
                      placeholder="e.g. Bloomfield Hall Schools"
                      className="mt-1 h-10 w-full rounded-lg bg-[var(--bg-card)] px-3 text-sm ring-1 ring-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                      Public slug {addMode === "standalone" ? <span className="text-red-400">*</span> : <span className="text-[10px] text-[var(--text-tertiary)]">(optional)</span>}
                    </label>
                    <div className="mt-1 flex items-stretch overflow-hidden rounded-lg ring-1 ring-[var(--border-subtle)] focus-within:ring-2 focus-within:ring-accent-500/40">
                      <span className="grid place-items-center bg-[var(--bg-elevated)] px-3 text-xs text-[var(--text-tertiary)]">
                        /organizers/
                      </span>
                      <input
                        value={addSlug}
                        onChange={(e) => setAddSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="bloomfield"
                        className="h-10 flex-1 bg-[var(--bg-card)] px-3 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)]">Plan</label>
                      <select
                        value={addPlan}
                        onChange={(e) => setAddPlan(e.target.value as any)}
                        className="mt-1 h-10 w-full rounded-lg bg-[var(--bg-card)] px-3 text-sm ring-1 ring-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                      >
                        <option value="none">No plan</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)]">Organizer type</label>
                      <select
                        value={addOrganizerType}
                        onChange={(e) => setAddOrganizerType(e.target.value as any)}
                        className="mt-1 h-10 w-full rounded-lg bg-[var(--bg-card)] px-3 text-sm ring-1 ring-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                      >
                        <option value="individual">Individual</option>
                        <option value="event_company">Event company</option>
                        <option value="university_society">University society</option>
                        <option value="business_venue">Business / venue</option>
                        <option value="ngo_organization">NGO / nonprofit</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)]">City</label>
                      <input
                        value={addCity}
                        onChange={(e) => setAddCity(e.target.value)}
                        placeholder="e.g. Lahore"
                        className="mt-1 h-10 w-full rounded-lg bg-[var(--bg-card)] px-3 text-sm ring-1 ring-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)]">Contact phone</label>
                      <input
                        value={addContactPhone}
                        onChange={(e) => setAddPhone(e.target.value)}
                        placeholder="+92 300 1234567"
                        className="mt-1 h-10 w-full rounded-lg bg-[var(--bg-card)] px-3 text-sm ring-1 ring-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                      />
                    </div>
                  </div>

                  {addMode === "standalone" && (
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)]">Public contact email</label>
                      <input
                        type="email"
                        value={addContactEmail}
                        onChange={(e) => setAddEmail2(e.target.value)}
                        placeholder="hello@bloomfield.pk"
                        className="mt-1 h-10 w-full rounded-lg bg-[var(--bg-card)] px-3 text-sm ring-1 ring-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Short bio</label>
                    <textarea
                      value={addBio}
                      onChange={(e) => setAddBio(e.target.value)}
                      placeholder="One paragraph describing this organizer"
                      rows={3}
                      className="mt-1 w-full rounded-lg bg-[var(--bg-card)] p-3 text-sm ring-1 ring-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                    />
                  </div>

                  <label className="flex items-start gap-2 rounded-lg bg-[var(--bg-elevated)] p-3 text-xs">
                    <input
                      type="checkbox"
                      checked={addPublishImmediately}
                      onChange={(e) => setAddPublishImmediately(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--border-default)]"
                    />
                    <span>
                      <span className="font-medium">Publish immediately</span>
                      <span className="block text-[10px] text-[var(--text-tertiary)]">
                        Mark as approved and visible on /organizers. If unchecked, the organizer is created in <strong>pending</strong> state.
                      </span>
                    </span>
                  </label>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAddOpen(false);
                      resetAdd();
                    }}
                    disabled={addVerifying}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitAdd}
                    disabled={addVerifying}
                    leftIcon={addVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  >
                    {addVerifying ? "Adding…" : "Add organizer"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminFeatured() {
  const { events, opportunities, updateEvent, updateOpportunity } = useDataStore();
  const [featuredEvents, setFeaturedEvents] = useState(
    events.filter((e) => e.featured).map((e) => e.id),
  );
  const [featuredOpps, setFeaturedOpps] = useState(
    opportunities.filter((o) => o.featured).map((o) => o.id),
  );

  const toggle = (
    id: string,
    list: string[],
    set: (l: string[]) => void,
    update: (id: string, patch: any) => void,
  ) => {
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    set(next);
    update(id, { featured: !list.includes(id) });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Featured listings</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">Curate what appears on the homepage</p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Featured events</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const on = featuredEvents.includes(e.id);
            return (
              <button
                key={e.id}
                onClick={() => toggle(e.id, featuredEvents, setFeaturedEvents, updateEvent)}
                className={`group relative overflow-hidden rounded-2xl p-1 ring-1 transition text-left ${
                  on ? "ring-amber-400" : "ring-[var(--border-subtle)] hover:ring-[var(--border-default)]"
                }`}
              >
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
                  <img src={e.image} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  {on && (
                    <div className="absolute right-3 top-3">
                      <Badge tone="amber">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </Badge>
                    </div>
                  )}
                  <div className="absolute inset-x-3 bottom-3 text-sm font-semibold text-white">
                    {e.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Featured opportunities</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((o) => {
            const on = featuredOpps.includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => toggle(o.id, featuredOpps, setFeaturedOpps, updateOpportunity)}
                className={`group relative overflow-hidden rounded-2xl p-1 ring-1 transition text-left ${
                  on ? "ring-amber-400" : "ring-[var(--border-subtle)] hover:ring-[var(--border-default)]"
                }`}
              >
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
                  <img src={o.image} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  {on && (
                    <div className="absolute right-3 top-3">
                      <Badge tone="amber">
                        <Star className="h-3 w-3 fill-current" />
                        Featured
                      </Badge>
                    </div>
                  )}
                  <div className="absolute inset-x-3 bottom-3 text-sm font-semibold text-white">
                    {o.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function AdminReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">Insights into platform performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Page views", value: "184,239" },
          { label: "Avg session", value: "4m 12s" },
          { label: "Conversion", value: "3.8%" },
          { label: "Active users", value: "12,408" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="mt-1 text-sm text-[var(--text-tertiary)]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
          <h2 className="text-base font-semibold">Top categories</h2>
          <div className="mt-4 space-y-3">
            {[
              { name: "Concerts", pct: 92 },
              { name: "Hackathons", pct: 78 },
              { name: "Conferences", pct: 71 },
              { name: "Workshops", pct: 64 },
              { name: "Scholarships", pct: 58 },
            ].map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="text-[var(--text-tertiary)]">{c.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--bg-card-hover)]">
                  <div className="h-full bg-gradient-to-r from-accent-500 to-pink-500" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
          <h2 className="text-base font-semibold">Top cities</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              ["New York, USA", "32k"],
              ["London, UK", "28k"],
              ["San Francisco, USA", "21k"],
              ["Berlin, Germany", "18k"],
              ["Lahore, Pakistan", "14k"],
            ].map(([city, count]) => (
              <li key={city} className="flex items-center justify-between">
                <span>{city}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Export reports</h2>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">Download CSV or PDF reports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>CSV</Button>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>PDF</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminSettings() {
  const [siteName, setSiteName] = useState("Occaz");
  const [tagline, setTagline] = useState("Events, tickets & opportunities — beautifully curated.");
  const [email, setEmail] = useState("hello@occaz.app");
  const [maintenance, setMaintenance] = useState(false);
  const [allowSignup, setAllowSignup] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">Platform configuration</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
          <h2 className="text-base font-semibold">General</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">Basic information about your platform</p>
          <div className="mt-5 space-y-4">
            <Field label="Site name">
              <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="input" />
            </Field>
            <Field label="Tagline">
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} className="input" />
            </Field>
            <Field label="Contact email">
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
            </Field>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
          <h2 className="text-base font-semibold">Access</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">Control who can use the platform</p>
          <div className="mt-5 space-y-4">
            <ToggleRow
              label="Maintenance mode"
              desc="Temporarily disable public access"
              on={maintenance}
              onChange={setMaintenance}
            />
            <ToggleRow
              label="Allow new signups"
              desc="New users can create accounts"
              on={allowSignup}
              onChange={setAllowSignup}
            />
            <ToggleRow
              label="Require organizer approval"
              desc="Manually approve new organizer accounts"
              on={requireApproval}
              onChange={setRequireApproval}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)] lg:col-span-2">
          <h2 className="text-base font-semibold">Image management</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">Configure image uploads and storage</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {["a1", "a2", "a3", "a4", "a5", "a6"].map((s) => (
              <div key={s} className="aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-[var(--border-default)]">
                <img src={`https://picsum.photos/seed/${s}/600/450`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          <Button className="mt-5" leftIcon={<Plus className="h-4 w-4" />}>Upload images</Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Discard changes</Button>
        <Button>Save settings</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  desc,
  on,
  onChange,
}: {
  label: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-[var(--text-tertiary)]">{desc}</div>
      </div>
      <button
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 rounded-full transition ${on ? "bg-accent-500" : "bg-[var(--bg-card-hover)]"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-5" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

// Helper: a labeled section card used inside the organizer review drawer
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
        {title}
      </div>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

// Helper: a single label/value row
function Row({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 text-[var(--text-tertiary)]">{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          {label}
        </div>
        <div className="mt-0.5 break-words">{children}</div>
      </div>
    </div>
  );
}

// Local helpers
function slugify(s: string) {
  return (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}
