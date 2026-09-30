import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  MapPin,
  Shield,
  Download,
  X,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";

type Role = "User" | "Organizer" | "Admin";
type Status = "Active" | "Suspended" | "Pending";

interface AppUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  email: string;
  role: Role;
  status: Status;
  city: string;
  joined: string;
  tickets: number;
  events: number;
  is_self: boolean;
}

function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [u, d] = email.split("@");
  if (!d) return email;
  const uMasked = u.length <= 2 ? u[0] + "•" : u.slice(0, 2) + "•".repeat(Math.max(1, u.length - 2));
  return `${uMasked}@${d}`;
}

function nameInitials(name: string | null | undefined): string {
  if (!name) return "·";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export function AdminUsers() {
  const { user: me } = useAuth();
  const [list, setList] = useState<AppUser[]>([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "All">("All");
  const [status, setStatus] = useState<Status | "All">("All");
  const [view, setView] = useState<AppUser | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // close action menu on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function load() {
    setLoading(true);
    setErr(null);
    // pull every auth user via the admin API (auth.admin is only callable
    // from a service role context, so instead we read profiles and join what
    // we can from auth.users via the profiles view).
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, is_organizer, status, city, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as any[];
    // ticket / event counts per user
    const ids = rows.map((r) => r.id);
    const [tix, evs] = await Promise.all([
      ids.length
        ? supabase.from("registrations").select("user_id").in("user_id", ids)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("organizations").select("id, name"),
    ]);
    const tixCount: Record<string, number> = {};
    (tix.data ?? []).forEach((t: any) => {
      if (!t.user_id) return;
      tixCount[t.user_id] = (tixCount[t.user_id] ?? 0) + 1;
    });
    const orgNames = new Set((evs.data ?? []).map((o: any) => o.name));
    const mapped: AppUser[] = rows.map((r) => ({
      id: r.id,
      name: r.full_name ?? r.email ?? "—",
      handle: r.email ? "@" + r.email.split("@")[0] : "@user",
      avatar: r.avatar_url ?? "",
      email: r.email ?? "",
      role: r.role === "admin" ? "Admin" : r.is_organizer ? "Organizer" : "User",
      status: (r.status === "suspended"
        ? "Suspended"
        : r.status === "pending"
          ? "Pending"
          : "Active") as Status,
      city: r.city ?? "—",
      joined: new Date(r.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      tickets: tixCount[r.id] ?? 0,
      events: orgNames.has(r.full_name) ? 0 : 0,
      is_self: me?.id === r.id,
    }));
    setList(mapped);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [me?.id]);

  // realtime: refresh list when profile changes
  useEffect(() => {
    const ch = supabase
      .channel("admin-users")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [me?.id]);

  const filtered = useMemo(
    () =>
      list.filter((u) => {
        if (q) {
          const t = q.toLowerCase();
          if (
            !`${u.name} ${u.email} ${u.handle}`.toLowerCase().includes(t)
          )
            return false;
        }
        if (role !== "All" && u.role !== role) return false;
        if (status !== "All" && u.status !== status) return false;
        return true;
      }),
    [list, q, role, status],
  );

  const counts = useMemo(
    () => ({
      total: list.length,
      active: list.filter((u) => u.status === "Active").length,
      pending: list.filter((u) => u.status === "Pending").length,
      suspended: list.filter((u) => u.status === "Suspended").length,
      organizers: list.filter((u) => u.role === "Organizer").length,
      admins: list.filter((u) => u.role === "Admin").length,
    }),
    [list],
  );

  async function changeStatus(id: string, s: Status) {
    setOpenMenu(null);
    const dbStatus = s === "Active" ? "active" : s === "Suspended" ? "suspended" : "pending";
    const { data, error } = await supabase.rpc("admin_set_user_status", {
      p_user_id: id,
      p_status: dbStatus,
    });
    if (error || !(data as any)?.ok) {
      setToast({ kind: "err", text: (data as any)?.error ?? error?.message ?? "Update failed" });
      return;
    }
    setList((p) => p.map((u) => (u.id === id ? { ...u, status: s } : u)));
    if (view?.id === id) setView((v) => (v ? { ...v, status: s } : v));
    setToast({ kind: "ok", text: `User ${s.toLowerCase()}` });
  }

  async function changeRole(id: string, r: Role) {
    setOpenMenu(null);
    const dbRole = r === "Admin" ? "admin" : r === "Organizer" ? "user" : "user";
    const isOrg = r === "Organizer";
    const { error: roleErr } = await supabase.rpc("admin_set_user_role", {
      p_user_id: id,
      p_role: dbRole,
    });
    if (roleErr) {
      setToast({ kind: "err", text: roleErr.message });
      return;
    }
    // keep is_organizer in sync
    await supabase.from("profiles").update({ is_organizer: isOrg }).eq("id", id);
    setList((p) => p.map((u) => (u.id === id ? { ...u, role: r } : u)));
    if (view?.id === id) setView((v) => (v ? { ...v, role: r } : v));
    setToast({ kind: "ok", text: `Role updated to ${r}` });
  }

  async function remove(id: string, isSelf: boolean) {
    setOpenMenu(null);
    if (isSelf) {
      setToast({ kind: "err", text: "You cannot delete your own account from here." });
      return;
    }
    if (!confirm("Delete this user? This cannot be undone.")) return;
    const { data, error } = await supabase.rpc("admin_delete_user", { p_user_id: id });
    if (error || !(data as any)?.ok) {
      setToast({ kind: "err", text: (data as any)?.error ?? error?.message ?? "Delete failed" });
      return;
    }
    setList((p) => p.filter((u) => u.id !== id));
    if (view?.id === id) setView(null);
    setToast({ kind: "ok", text: "User deleted" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Users
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            {counts.total} {counts.total === 1 ? "account" : "accounts"} ·{" "}
            {counts.pending} pending approval
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={load}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => {
              const csv = [
                ["id", "email", "name", "role", "status", "city", "joined"].join(","),
                ...list.map((u) =>
                  [u.id, JSON.stringify(u.email), JSON.stringify(u.name), u.role, u.status, JSON.stringify(u.city), u.joined].join(","),
                ),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "occaz-users.csv";
              a.click();
            }}
          >
            Export
          </Button>
          <Button leftIcon={<Plus className="h-4 w-4" />}>Invite user</Button>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={
              "flex items-center gap-2 rounded-lg border p-3 text-sm " +
              (toast.kind === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-300")
            }
          >
            {toast.kind === "ok" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {err && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {err}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total", value: counts.total, tone: "default" as const },
          { label: "Active", value: counts.active, tone: "emerald" as const },
          { label: "Pending", value: counts.pending, tone: "amber" as const },
          { label: "Suspended", value: counts.suspended, tone: "red" as const },
          { label: "Organizers", value: counts.organizers, tone: "accent" as const },
          { label: "Admins", value: counts.admins, tone: "pink" as const },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]"
          >
            <div className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
              {s.tone !== "default" && <Badge tone={s.tone}>{s.label}</Badge>}
              {s.tone === "default" && s.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-[var(--bg-card)] px-4 py-2.5 ring-1 ring-[var(--border-subtle)]">
          <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search users by name, email or handle..."
            className="flex-1 bg-transparent text-sm placeholder:text-[var(--text-tertiary)] outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="rounded-xl bg-[var(--bg-card)] px-3 py-2.5 text-sm ring-1 ring-[var(--border-subtle)] outline-none"
          >
            <option className="bg-[var(--bg-card)]">All roles</option>
            <option className="bg-[var(--bg-card)]">User</option>
            <option className="bg-[var(--bg-card)]">Organizer</option>
            <option className="bg-[var(--bg-card)]">Admin</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-xl bg-[var(--bg-card)] px-3 py-2.5 text-sm ring-1 ring-[var(--border-subtle)] outline-none"
          >
            <option className="bg-[var(--bg-card)]">All status</option>
            <option className="bg-[var(--bg-card)]">Active</option>
            <option className="bg-[var(--bg-card)]">Pending</option>
            <option className="bg-[var(--bg-card)]">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-[var(--text-tertiary)]">
                    Loading users…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-[var(--text-tertiary)]">
                    {list.length === 0
                      ? "No users have signed up yet."
                      : "No users match your filters."}
                  </td>
                </tr>
              )}
              {filtered.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]"
                >
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setView(u)}
                      className="flex items-center gap-3 text-left"
                    >
                      {u.avatar ? (
                        <img src={u.avatar} className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-accent-500 to-pink-500 text-xs font-semibold text-white">
                          {nameInitials(u.name)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                          {u.name}
                          {u.is_self && (
                            <span className="rounded-full bg-accent-500/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-accent-300 ring-1 ring-accent-500/30">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {u.is_self ? u.email : maskEmail(u.email)}
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      tone={
                        u.role === "Admin"
                          ? "pink"
                          : u.role === "Organizer"
                            ? "accent"
                            : "default"
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{u.city || "—"}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{u.joined}</td>
                  <td className="px-5 py-3">
                    <Badge
                      tone={
                        u.status === "Active"
                          ? "emerald"
                          : u.status === "Pending"
                            ? "amber"
                            : "red"
                      }
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="relative flex justify-end" ref={menuRef}>
                      <button
                        onClick={() =>
                          setOpenMenu((p) => (p === u.id ? null : u.id))
                        }
                        className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                        aria-label="More actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <AnimatePresence>
                        {openMenu === u.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-10 z-20 w-56 overflow-hidden rounded-xl bg-[var(--bg-elevated)] p-1.5 shadow-xl ring-1 ring-[var(--border-default)]"
                          >
                            <MenuBtn
                              Icon={Eye}
                              label="View profile"
                              onClick={() => {
                                setView(u);
                                setOpenMenu(null);
                              }}
                            />
                            <div className="my-1 border-t border-[var(--border-subtle)]" />
                            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                              Change role
                            </div>
                            {(["User", "Organizer", "Admin"] as Role[]).map((r) => (
                              <MenuBtn
                                key={r}
                                Icon={Shield}
                                label={`Make ${r}`}
                                onClick={() => changeRole(u.id, r)}
                                active={u.role === r}
                                disabled={u.is_self && r !== "Admin"}
                              />
                            ))}
                            <div className="my-1 border-t border-[var(--border-subtle)]" />
                            {u.status !== "Active" && (
                              <MenuBtn
                                Icon={UserCheck}
                                label="Activate"
                                onClick={() => changeStatus(u.id, "Active")}
                              />
                            )}
                            {u.status !== "Suspended" && (
                              <MenuBtn
                                Icon={UserX}
                                label="Suspend"
                                tone="warn"
                                onClick={() => changeStatus(u.id, "Suspended")}
                                disabled={u.is_self}
                              />
                            )}
                            <div className="my-1 border-t border-[var(--border-subtle)]" />
                            <MenuBtn
                              Icon={Trash2}
                              label="Delete user"
                              tone="danger"
                              onClick={() => remove(u.id, u.is_self)}
                              disabled={u.is_self}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View profile drawer */}
      <AnimatePresence>
        {view && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setView(null)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-[var(--bg-elevated)] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  User profile
                </h2>
                <button
                  onClick={() => setView(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--bg-card-hover)]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-[var(--text-secondary)]" />
                </button>
              </div>

              <div className="mt-6 flex items-center gap-4">
                {view.avatar ? (
                  <img
                    src={view.avatar}
                    className="h-20 w-20 rounded-2xl object-cover"
                    alt=""
                  />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 text-2xl font-bold text-white">
                    {nameInitials(view.name)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                      {view.name}
                    </h3>
                    <Badge
                      tone={
                        view.role === "Admin"
                          ? "pink"
                          : view.role === "Organizer"
                            ? "accent"
                            : "default"
                      }
                    >
                      {view.role}
                    </Badge>
                    {view.is_self && (
                      <Badge tone="emerald">You</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-tertiary)]">{view.handle}</p>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <Row Icon={Mail} label="Email" value={view.is_self ? view.email : maskEmail(view.email)} />
                <Row Icon={MapPin} label="Location" value={view.city} />
                <Row Icon={Calendar} label="Joined" value={view.joined} />
                <Row
                  Icon={Shield}
                  label="Status"
                  value={
                    <Badge
                      tone={
                        view.status === "Active"
                          ? "emerald"
                          : view.status === "Pending"
                            ? "amber"
                            : "red"
                      }
                    >
                      {view.status}
                    </Badge>
                  }
                />
                <Row Icon={Calendar} label="Tickets purchased" value={view.tickets} />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {view.status === "Pending" && (
                  <Button
                    fullWidth
                    onClick={() => {
                      changeStatus(view.id, "Active");
                      setView(null);
                    }}
                  >
                    Approve registration
                  </Button>
                )}
                {view.status !== "Pending" && (
                  <>
                    {view.status === "Active" ? (
                      <Button
                        variant="outline"
                        fullWidth
                        disabled={view.is_self}
                        onClick={() => {
                          changeStatus(view.id, "Suspended");
                          setView(null);
                        }}
                      >
                        Suspend user
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        onClick={() => {
                          changeStatus(view.id, "Active");
                          setView(null);
                        }}
                      >
                        Reactivate user
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      fullWidth
                      disabled={view.is_self}
                      onClick={() => {
                        remove(view.id, view.is_self);
                      }}
                    >
                      Delete user
                    </Button>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({
  Icon,
  label,
  value,
}: {
  Icon: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)]">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--bg-card-hover)] ring-1 ring-[var(--border-subtle)]">
        <Icon className="h-4 w-4 text-accent-400" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-[var(--text-tertiary)]">{label}</div>
        <div className="text-sm font-medium text-[var(--text-primary)]">{value}</div>
      </div>
    </div>
  );
}

function MenuBtn({
  Icon,
  label,
  onClick,
  tone = "default",
  active = false,
  disabled = false,
}: {
  Icon: any;
  label: string;
  onClick: () => void;
  tone?: "default" | "warn" | "danger";
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-accent-500/15 text-accent-400",
        !active && tone === "default" && "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]",
        !active && tone === "warn" && "text-amber-400 hover:bg-amber-500/15",
        !active && tone === "danger" && "text-red-400 hover:bg-red-500/15",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
