import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Copy,
  Edit3,
  Trash2,
  TicketPercent,
  Check,
  X,
  Tag,
  Calendar,
  TrendingUp,
  Power,
  PowerOff,
  Loader2,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../lib/toast.tsx";
import { formatPrice } from "../../data/mock";
import { PLANS, type PlanId } from "../../lib/plans";
import clsx from "clsx";

interface Coupon {
  id: string;
  code: string;
  organizer_id: string | null;
  plan: "pro" | "business" | "any";
  kind: "percent" | "fixed";
  amount: number;
  max_redemptions: number;
  redemptions: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  created_at: string;
}

const emptyForm = {
  code: "",
  plan: "any" as "any" | "pro" | "business",
  kind: "percent" as "percent" | "fixed",
  amount: 20,
  max_redemptions: 100,
  valid_until: "",
  active: true,
};

export function AdminCoupons() {
  const { push } = useToast();
  const [rows, setRows] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      push("err", `Failed to load: ${error.message}`);
    } else {
      setRows((data ?? []) as Coupon[]);
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
        c.code.toLowerCase().includes(t) ||
        c.plan.toLowerCase().includes(t) ||
        c.kind.toLowerCase().includes(t),
    );
  }, [rows, q]);

  function openNew() {
    setForm(emptyForm);
    setEditing(null);
    setShowNew(true);
  }

  function openEdit(c: Coupon) {
    setForm({
      code: c.code,
      plan: c.plan,
      kind: c.kind,
      amount: c.amount,
      max_redemptions: c.max_redemptions,
      valid_until: c.valid_until ? c.valid_until.slice(0, 10) : "",
      active: c.active,
    });
    setEditing(c);
    setShowNew(true);
  }

  function closeForm() {
    setShowNew(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async function save() {
    const code = form.code.trim().toUpperCase();
    if (!code) {
      push("err", "Code is required");
      return;
    }
    if (form.amount <= 0) {
      push("err", "Amount must be greater than 0");
      return;
    }
    if (form.kind === "percent" && form.amount > 100) {
      push("err", "Percent discount can't exceed 100");
      return;
    }
    const payload: any = {
      code,
      plan: form.plan,
      kind: form.kind,
      amount: Number(form.amount),
      max_redemptions: Number(form.max_redemptions),
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      active: form.active,
    };
    let error;
    if (editing) {
      const res = await supabase
        .from("coupons")
        .update(payload)
        .eq("id", editing.id);
      error = res.error;
    } else {
      const res = await supabase.from("coupons").insert(payload);
      error = res.error;
    }
    if (error) {
      push("err", `Save failed: ${error.message}`);
      return;
    }
    push("ok", editing ? "Coupon updated" : `Created coupon ${code}`);
    closeForm();
    load();
  }

  async function remove(c: Coupon) {
    if (!confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("coupons").delete().eq("id", c.id);
    if (error) {
      push("err", `Delete failed: ${error.message}`);
    } else {
      push("ok", "Deleted");
      load();
    }
  }

  async function toggleActive(c: Coupon) {
    const { error } = await supabase
      .from("coupons")
      .update({ active: !c.active })
      .eq("id", c.id);
    if (error) push("err", error.message);
    else load();
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      push("ok", `Copied ${code}`);
    } catch {
      push("err", "Couldn't copy");
    }
  }

  function formatDiscount(c: Coupon): string {
    if (c.kind === "percent") return `${c.amount}% off`;
    return `${formatPrice(c.amount, "PKR")} off`;
  }

  function planName(p: string): string {
    if (p === "any") return "Any plan";
    return PLANS.find((pl) => pl.id === p)?.name ?? p;
  }

  function usagePercent(c: Coupon): number {
    if (c.max_redemptions === 0) return 0; // unlimited
    return Math.min(100, (c.redemptions / c.max_redemptions) * 100);
  }

  function isExpired(c: Coupon): boolean {
    if (!c.valid_until) return false;
    return new Date(c.valid_until) < new Date();
  }

  function statusBadge(c: Coupon) {
    if (!c.active)
      return <Badge tone="zinc">Inactive</Badge>;
    if (isExpired(c))
      return <Badge tone="rose">Expired</Badge>;
    if (c.max_redemptions > 0 && c.redemptions >= c.max_redemptions)
      return <Badge tone="rose">Fully used</Badge>;
    return <Badge tone="emerald">Active</Badge>;
  }

  function fmtDate(iso: string | null): string {
    if (!iso) return "Never";
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Discount codes for Pro and Business subscriptions
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openNew}
        >
          New coupon
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)]">
        <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by code, plan, or type..."
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
                {editing ? `Edit coupon ${editing.code}` : "New coupon"}
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
                  Code *
                </span>
                <div className="flex gap-2">
                  <input
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="WELCOME20"
                    className="input flex-1 font-mono uppercase"
                    maxLength={32}
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, code: generateCode() }))}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--bg-card-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    title="Generate random code"
                    aria-label="Generate code"
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                </div>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Applies to
                </span>
                <select
                  value={form.plan}
                  onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as any }))}
                  className="input"
                >
                  <option value="any">Any plan</option>
                  <option value="pro">Pro only</option>
                  <option value="business">Business only</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Discount type
                </span>
                <div className="inline-flex w-full rounded-lg bg-[var(--bg-card-hover)] p-1">
                  {(["percent", "fixed"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, kind: k }))}
                      className={clsx(
                        "flex-1 rounded-md px-3 py-1 text-xs font-medium transition",
                        form.kind === k
                          ? "bg-white text-black"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
                      )}
                    >
                      {k === "percent" ? "% percent" : "₨ fixed amount"}
                    </button>
                  ))}
                </div>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Amount {form.kind === "percent" ? "(%)" : "(PKR)"}
                </span>
                <input
                  type="number"
                  min={1}
                  max={form.kind === "percent" ? 100 : undefined}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                  className="input"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Max redemptions (0 = unlimited)
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.max_redemptions}
                  onChange={(e) => setForm((f) => ({ ...f, max_redemptions: Number(e.target.value) }))}
                  className="input"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Expires (leave empty for no expiry)
                </span>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                  className="input"
                />
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="h-4 w-4 accent-accent-500"
                />
                <span className="text-xs text-[var(--text-tertiary)]">Active (users can redeem this coupon)</span>
              </label>
            </div>

            {/* Live preview */}
            <div className="mt-4 rounded-xl border border-dashed border-[var(--border-default)] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Preview
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="font-mono text-xl font-bold tracking-wider text-accent-400">
                  {form.code || "CODE"}
                </div>
                <Badge tone="accent">
                  {form.kind === "percent" ? `${form.amount}% off` : `${formatPrice(form.amount, "PKR")} off`}
                </Badge>
                <Badge tone="sky">{planName(form.plan)}</Badge>
              </div>
              <div className="mt-2 text-xs text-[var(--text-tertiary)]">
                {form.max_redemptions > 0
                  ? `Up to ${form.max_redemptions} redemptions`
                  : "Unlimited redemptions"}
                {form.valid_until && ` · expires ${fmtDate(form.valid_until)}`}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button onClick={save} leftIcon={<Check className="h-4 w-4" />}>
                {editing ? "Save changes" : "Create coupon"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-sm text-[var(--text-tertiary)]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading coupons...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[var(--bg-card)] p-12 text-center ring-1 ring-[var(--border-subtle)]">
          <TicketPercent className="mx-auto h-10 w-10 text-[var(--text-tertiary)] opacity-50" />
          <p className="mt-3 text-sm text-[var(--text-tertiary)]">
            {rows.length === 0
              ? "No coupons yet. Click 'New coupon' to create your first one."
              : "No coupons match your search."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => {
            const expired = isExpired(c);
            const fullyUsed = c.max_redemptions > 0 && c.redemptions >= c.max_redemptions;
            const usagePct = usagePercent(c);
            const inactive = !c.active;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                className={clsx(
                  "overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 transition",
                  inactive || expired || fullyUsed
                    ? "ring-[var(--border-subtle)] opacity-70"
                    : "ring-[var(--border-subtle)] hover:ring-[var(--border-default)]",
                )}
              >
                <div
                  className={clsx(
                    "p-5",
                    inactive || expired || fullyUsed
                      ? "bg-gradient-to-br from-zinc-500/10 to-zinc-500/5"
                      : "bg-gradient-to-br from-accent-500/15 to-pink-500/10",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="accent">{formatDiscount(c)}</Badge>
                    {statusBadge(c)}
                  </div>
                  <div className="mt-3 font-mono text-lg font-bold tracking-wider text-[var(--text-primary)]">
                    {c.code}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone="sky">{planName(c.plan)}</Badge>
                    {c.organizer_id && (
                      <Badge tone="violet">
                        <Users className="mr-1 inline h-2.5 w-2.5" /> Organizer
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                    <span>Used</span>
                    <span>
                      {c.redemptions} / {c.max_redemptions === 0 ? "∞" : c.max_redemptions}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg-card-hover)]">
                    <div
                      className={clsx(
                        "h-full transition-all",
                        fullyUsed
                          ? "bg-rose-500"
                          : "bg-gradient-to-r from-accent-500 to-pink-500",
                      )}
                      style={{ width: c.max_redemptions === 0 ? `${Math.min(c.redemptions * 5, 30)}%` : `${usagePct}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                    <Calendar className="h-3 w-3" />
                    {expired ? (
                      <span>Expired {fmtDate(c.valid_until)}</span>
                    ) : c.valid_until ? (
                      <span>Expires {fmtDate(c.valid_until)}</span>
                    ) : (
                      <span>Never expires</span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      leftIcon={<Copy className="h-3.5 w-3.5" />}
                      onClick={() => copyCode(c.code)}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(c)}
                      leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                      aria-label="Edit"
                      title="Edit"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(c)}
                      leftIcon={c.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                      aria-label={c.active ? "Deactivate" : "Activate"}
                      title={c.active ? "Deactivate" : "Activate"}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => remove(c)}
                      leftIcon={<Trash2 className="h-3.5 w-3.5 text-rose-400" />}
                      aria-label="Delete"
                      title="Delete"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
