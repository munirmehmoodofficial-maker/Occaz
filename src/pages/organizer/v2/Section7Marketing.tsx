import { Megaphone, Star, Tag, Copy, X, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../lib/toast";

/**
 * Section 7 — Marketing & Promotion
 * Featured events + promo codes (CRUD wired).
 */
export function Section7Marketing() {
  const { user } = useAuth();
  const { push } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponOpen, setCouponOpen] = useState(false);

  async function refresh() {
    if (!user) return;
    setLoading(true);
    const { data: evs } = await supabase
      .from("events")
      .select("id, title, image, date, featured, published")
      .eq("organizer_id", user.id)
      .order("date", { ascending: false });
    setEvents(evs ?? []);
    const { data: cps } = await supabase
      .from("coupons")
      .select("id, code, kind, amount, plan, redemptions, max_redemptions, active, valid_until")
      .order("created_at", { ascending: false });
    setCoupons(cps ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [user]);

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await supabase
      .from("events")
      .update({ featured: !current })
      .eq("id", id);
    if (error) {
      push({ tone: "red", title: "Update failed", message: error.message });
      return;
    }
    setEvents((evs) => evs.map((e) => (e.id === id ? { ...e, featured: !current } : e)));
    push({ tone: "green", title: "Saved", message: current ? "Removed from featured" : "Marked as featured" });
  }

  async function toggleCouponActive(c: any) {
    const { error } = await supabase
      .from("coupons")
      .update({ active: !c.active })
      .eq("id", c.id);
    if (error) {
      push({ tone: "red", title: "Failed", message: error.message });
      return;
    }
    setCoupons((cs) => cs.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)));
  }

  async function deleteCoupon(c: any) {
    if (!confirm(`Delete promo code "${c.code}"?`)) return;
    const { error } = await supabase.from("coupons").delete().eq("id", c.id);
    if (error) {
      push({ tone: "red", title: "Failed", message: error.message });
      return;
    }
    setCoupons((cs) => cs.filter((x) => x.id !== c.id));
    push({ tone: "green", title: "Deleted", message: `${c.code} removed.` });
  }

  function shareLink(e: any) {
    const url = `${window.location.origin}/events/${e.id}`;
    navigator.clipboard?.writeText(url);
    push({ tone: "green", title: "Link copied", message: url });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Marketing & promotion</h2>
        <p className="text-xs text-zinc-500">
          Feature events, share links, manage promo codes
        </p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Featured events</h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Featured events show up first in the homepage feed
            </p>
          </div>
        </div>
        {loading ? (
          <div className="mt-3 text-sm text-zinc-500">Loading…</div>
        ) : events.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-500">
            No events to feature yet.
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3">
                <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-lg bg-zinc-900">
                  {e.image ? (
                    <img src={e.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Megaphone className="h-4 w-4 text-zinc-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{e.title}</div>
                  <div className="text-[10px] text-zinc-500">
                    {e.published ? "Live" : "Draft"} · {e.date ? new Date(e.date).toLocaleDateString() : "—"}
                  </div>
                </div>
                <button
                  onClick={() => shareLink(e)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
                  title="Copy link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleFeatured(e.id, e.featured)}
                  className={
                    "rounded-lg px-2.5 py-1 text-[11px] font-semibold " +
                    (e.featured
                      ? "bg-pink-500/20 text-pink-300"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10")
                  }
                >
                  <Star
                    className={
                      "mr-1 inline h-3 w-3 " + (e.featured ? "fill-current" : "")
                    }
                  />
                  {e.featured ? "Featured" : "Feature"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Promo codes</h3>
          <button
            onClick={() => setCouponOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
          >
            <Plus className="h-3 w-3" /> New code
          </button>
        </div>
        {coupons.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-500">
            No promo codes yet. Create your first one to give attendees a discount.
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {coupons.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3">
                <Tag className="h-4 w-4 text-pink-300" />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm font-semibold text-white">{c.code}</div>
                  <div className="text-[10px] text-zinc-500">
                    {c.kind === "percent" ? `${c.amount}% off` : `₨ ${c.amount} off`} ·{" "}
                    {c.redemptions ?? 0}/{c.max_redemptions ?? "∞"} used
                  </div>
                </div>
                <button
                  onClick={() => toggleCouponActive(c)}
                  className={
                    "rounded-lg px-2 py-1 text-[10px] font-semibold " +
                    (c.active
                      ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                      : "bg-zinc-500/15 text-zinc-300 hover:bg-zinc-500/25")
                  }
                >
                  {c.active ? "Active" : "Disabled"}
                </button>
                <button
                  onClick={() => deleteCoupon(c)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-red-500/15 hover:text-red-400"
                  title="Delete"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {couponOpen && (
        <CreateCouponModal
          onClose={() => setCouponOpen(false)}
          onCreated={() => {
            setCouponOpen(false);
            refresh();
            push({ tone: "green", title: "Coupon created", message: "Attendees can now use it." });
          }}
        />
      )}
    </div>
  );
}

function CreateCouponModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { push } = useToast();
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [amount, setAmount] = useState(10);
  const [maxRedemptions, setMaxRedemptions] = useState(100);
  const [validUntil, setValidUntil] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const upper = code.trim().toUpperCase();
    if (!upper) {
      push({ tone: "red", title: "Code required", message: "Enter a code." });
      return;
    }
    if (amount <= 0) {
      push({ tone: "red", title: "Amount", message: "Must be > 0." });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("coupons").insert({
      code: upper,
      kind,
      amount,
      max_redemptions: maxRedemptions,
      plan: "any",
      active: true,
      valid_until: validUntil || null,
    });
    setBusy(false);
    if (error) {
      push({ tone: "red", title: "Failed", message: error.message });
      return;
    }
    onCreated();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl border border-white/5 bg-[#0b0b14] p-5 text-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-base font-bold">New promo code</h3>
            <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <Field label="Code">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input font-mono uppercase"
                placeholder="SUMMER25"
                style={{ textTransform: "uppercase" }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select value={kind} onChange={(e) => setKind(e.target.value as any)} className="input">
                  <option value="percent">Percent off</option>
                  <option value="amount">Amount off</option>
                </select>
              </Field>
              <Field label={kind === "percent" ? "Percent (%)" : "Amount (₨)"}>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="input"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Max redemptions">
                <input
                  type="number"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(Number(e.target.value))}
                  className="input"
                />
              </Field>
              <Field label="Valid until">
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="input"
                />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Creating…" : "Create code"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      {children}
    </label>
  );
}
