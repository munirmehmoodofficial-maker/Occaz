import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Building2,
  Check,
  X,
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../lib/toast";

interface PaymentSetting {
  id: string;
  scope: "global" | "event" | "opportunity";
  target_id: string | null;
  account_title: string;
  account_number: string;
  bank_name: string | null;
  instructions: string | null;
  active: boolean;
  created_at: string | null;
}

const emptyForm = {
  scope: "global" as "global" | "event" | "opportunity",
  target_id: "",
  account_title: "",
  account_number: "",
  bank_name: "",
  instructions: "",
  active: true,
};

export function AdminPaymentSettings() {
  const { push } = useToast();
  const [rows, setRows] = useState<PaymentSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<PaymentSetting | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [opps, setOpps] = useState<{ id: string; title: string }[]>([]);

  async function load() {
    setLoading(true);
    const [{ data, error }, evRes, opRes] = await Promise.all([
      supabase
        .from("payment_settings")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("events").select("id, title").order("title"),
      supabase.from("opportunities").select("id, title").order("title"),
    ]);
    if (error) {
      push("err", `Failed to load: ${error.message}`);
    } else {
      setRows((data ?? []) as PaymentSetting[]);
    }
    setEvents((evRes.data ?? []) as any);
    setOpps((opRes.data ?? []) as any);
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
      (r) =>
        r.account_title.toLowerCase().includes(t) ||
        (r.account_number ?? "").toLowerCase().includes(t) ||
        (r.bank_name ?? "").toLowerCase().includes(t),
    );
  }, [rows, q]);

  function openNew() {
    setForm(emptyForm);
    setEditing(null);
    setShowNew(true);
  }

  function openEdit(p: PaymentSetting) {
    setForm({
      scope: p.scope,
      target_id: p.target_id ?? "",
      account_title: p.account_title,
      account_number: p.account_number,
      bank_name: p.bank_name ?? "",
      instructions: p.instructions ?? "",
      active: p.active,
    });
    setEditing(p);
    setShowNew(true);
  }

  function closeForm() {
    setShowNew(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function save() {
    if (!form.account_title.trim() || !form.account_number.trim()) {
      push("err", "Account title and number are required");
      return;
    }
    const payload = {
      scope: form.scope,
      target_id: form.scope === "global" ? null : form.target_id || null,
      account_title: form.account_title.trim(),
      account_number: form.account_number.trim(),
      bank_name: form.bank_name.trim() || null,
      instructions: form.instructions.trim() || null,
      active: form.active,
    };
    let error;
    if (editing) {
      const res = await supabase
        .from("payment_settings")
        .update(payload)
        .eq("id", editing.id);
      error = res.error;
    } else {
      const res = await supabase.from("payment_settings").insert(payload);
      error = res.error;
    }
    if (error) {
      push("err", `Save failed: ${error.message}`);
      return;
    }
    push("ok", editing ? "Payment setting updated" : "Payment setting created");
    closeForm();
    load();
  }

  async function remove(p: PaymentSetting) {
    if (!confirm(`Delete payment setting for "${p.account_title}"?`)) return;
    const { error } = await supabase.from("payment_settings").delete().eq("id", p.id);
    if (error) {
      push("err", `Delete failed: ${error.message}`);
    } else {
      push("ok", "Deleted");
      load();
    }
  }

  async function toggleActive(p: PaymentSetting) {
    const { error } = await supabase
      .from("payment_settings")
      .update({ active: !p.active })
      .eq("id", p.id);
    if (error) push("err", error.message);
    else load();
  }

  function targetLabel(p: PaymentSetting) {
    if (p.scope === "global") return "Global default";
    if (p.scope === "event") {
      const e = events.find((x) => x.id === p.target_id);
      return e ? `Event: ${e.title}` : `Event: ${p.target_id ?? "—"}`;
    }
    const o = opps.find((x) => x.id === p.target_id);
    return o ? `Opportunity: ${o.title}` : `Opportunity: ${p.target_id ?? "—"}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Settings</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Bank and JazzCash accounts shown to users when they pay manually
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openNew}
        >
          Add payment method
        </Button>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)]">
        <Search className="h-4 w-4 text-[var(--text-tertiary)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by account title, number or bank..."
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
                {editing ? "Edit payment method" : "New payment method"}
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
                  Scope
                </span>
                <select
                  value={form.scope}
                  onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as any, target_id: "" }))}
                  className="input"
                >
                  <option value="global">Global default</option>
                  <option value="event">Specific event</option>
                  <option value="opportunity">Specific opportunity</option>
                </select>
              </label>
              {form.scope !== "global" && (
                <label className="space-y-1.5 text-sm">
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">
                    {form.scope === "event" ? "Event" : "Opportunity"}
                  </span>
                  <select
                    value={form.target_id}
                    onChange={(e) => setForm((f) => ({ ...f, target_id: e.target.value }))}
                    className="input"
                  >
                    <option value="">— Select —</option>
                    {(form.scope === "event" ? events : opps).map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Account title *
                </span>
                <input
                  value={form.account_title}
                  onChange={(e) => setForm((f) => ({ ...f, account_title: e.target.value }))}
                  placeholder="e.g. Munir M. Khan"
                  className="input"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Account number *
                </span>
                <input
                  value={form.account_number}
                  onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
                  placeholder="e.g. 0300-1234567 or PK36MEZN0001234567890"
                  className="input"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Bank / service
                </span>
                <input
                  value={form.bank_name}
                  onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                  placeholder="e.g. Meezan Bank, JazzCash, EasyPaisa"
                  className="input"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="h-4 w-4 accent-accent-500"
                />
                <span className="text-xs text-[var(--text-tertiary)]">Active</span>
              </label>
              <label className="space-y-1.5 text-sm sm:col-span-2">
                <span className="text-xs font-medium text-[var(--text-tertiary)]">
                  Instructions for user
                </span>
                <textarea
                  value={form.instructions}
                  onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                  placeholder="e.g. Send exact amount via JazzCash to the number above, then upload a screenshot and your transaction reference."
                  rows={3}
                  className="input min-h-[80px]"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-[var(--text-tertiary)]">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-sm text-[var(--text-tertiary)]">
            <CreditCard className="h-8 w-8 opacity-30" />
            {rows.length === 0
              ? "No payment methods yet. Click 'Add payment method' to add one."
              : "No matches for your search."}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-4 transition hover:bg-[var(--bg-card-hover)]"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-500/15 text-accent-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-sm font-semibold">{p.account_title}</div>
                    <Badge tone={p.scope === "global" ? "emerald" : "amber"}>
                      {targetLabel(p)}
                    </Badge>
                    <Badge tone={p.active ? "sky" : "zinc"}>
                      {p.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
                    {p.bank_name ? `${p.bank_name} · ` : ""}
                    {p.account_number}
                  </div>
                  {p.instructions && (
                    <div className="mt-1 line-clamp-1 text-xs text-[var(--text-tertiary)]">
                      {p.instructions}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(p)}
                    className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                    aria-label="Toggle active"
                    title={p.active ? "Deactivate" : "Activate"}
                  >
                    {p.active ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                    aria-label="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(p)}
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
