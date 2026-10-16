import { useEffect, useState } from "react";
import { Wallet, TrendingUp, Receipt, Download, Plus, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../lib/toast";

const PLATFORM_FEE_PCT = 5;

export function Section5Finance() {
  const { user } = useAuth();
  const { push } = useToast();
  const [stats, setStats] = useState({ grossSales: 0, commission: 0, refunds: 0, net: 0 });
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);

  async function refresh() {
    if (!user) return;
    setLoading(true);
    const { data: regs } = await supabase
      .from("registrations")
      .select("id, total, payment_status, commission_amount, refunded_amount, created_at")
      .eq("organizer_id", user.id);
    const list = regs ?? [];
    const gross = list
      .filter((r: any) => r.payment_status === "paid")
      .reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);
    const commission = list.reduce(
      (s: number, r: any) => s + Number(r.commission_amount ?? 0),
      0,
    );
    const refunds = list.reduce(
      (s: number, r: any) => s + Number(r.refunded_amount ?? 0),
      0,
    );
    const net = gross - commission - refunds;
    setStats({ grossSales: gross, commission, refunds, net });
    const { data: pays } = await supabase
      .from("payout_requests")
      .select("id, amount, method, status, created_at, transaction_ref, account_title, account_number, notes")
      .eq("organizer_id", user.id)
      .order("created_at", { ascending: false });
    setPayouts(pays ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [user]);

  function exportStatement() {
    const rows = [
      ["Period", new Date().toISOString().slice(0, 7)],
      ["Gross sales (PKR)", stats.grossSales],
      ["OCCAZ commission (PKR)", stats.commission],
      ["Refunds (PKR)", stats.refunds],
      ["Net payable (PKR)", stats.net],
      [],
      ["Payout ID", "Amount", "Method", "Status", "Requested", "Ref"],
      ...payouts.map((p) => [
        p.id,
        p.amount,
        p.method,
        p.status,
        new Date(p.created_at).toLocaleString(),
        p.transaction_ref ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `occaz-finance-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    push({ tone: "green", title: "Statement downloaded", message: "Finance CSV ready." });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Finance & payouts</h2>
          <p className="text-xs text-zinc-500">
            Sales, commission, refunds, and payout requests
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportStatement}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10"
          >
            <Download className="h-3.5 w-3.5" /> Statement
          </button>
          <button
            onClick={() => setRequestOpen(true)}
            disabled={stats.net <= 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-accent-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-pink-500/20 hover:opacity-90 disabled:opacity-50"
            title={stats.net <= 0 ? "No net balance yet" : "Request a payout"}
          >
            <Plus className="h-3.5 w-3.5" /> Request payout
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat Icon={TrendingUp} label="Gross sales" value={`₨ ${stats.grossSales.toLocaleString()}`} sub={`${PLATFORM_FEE_PCT}% platform fee`} tone="violet" />
        <Stat Icon={Receipt} label="OCCAZ commission" value={`₨ ${stats.commission.toLocaleString()}`} sub={`${PLATFORM_FEE_PCT}% of paid sales`} tone="amber" />
        <Stat Icon={Wallet} label="Refunds" value={`₨ ${stats.refunds.toLocaleString()}`} sub="Adjustments" tone="red" />
        <Stat Icon={Wallet} label="Net payable" value={`₨ ${stats.net.toLocaleString()}`} sub="Available for payout" tone="emerald" />
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Payout requests</h3>
        </div>
        {loading ? (
          <div className="mt-3 text-sm text-zinc-500">Loading…</div>
        ) : payouts.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-500">
            No payouts yet. Click "Request payout" to ask for the net amount to be transferred to you.
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3"
              >
                <Wallet className="h-4 w-4 text-pink-300" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">
                    ₨ {Number(p.amount).toLocaleString()} · {p.method}
                  </div>
                  <div className="truncate text-[10px] text-zinc-500">
                    {new Date(p.created_at).toLocaleString()}
                    {p.transaction_ref ? ` · ${p.transaction_ref}` : ""}
                  </div>
                </div>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                    (p.status === "paid"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : p.status === "approved"
                        ? "bg-pink-500/15 text-pink-300"
                        : p.status === "rejected"
                          ? "bg-red-500/15 text-red-300"
                          : "bg-amber-500/15 text-amber-300")
                  }
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {requestOpen && (
        <PayoutRequestModal
          maxAmount={stats.net}
          onClose={() => setRequestOpen(false)}
          onSubmitted={() => {
            setRequestOpen(false);
            refresh();
            push({ tone: "green", title: "Payout requested", message: "We'll process it within 3-5 business days." });
          }}
        />
      )}
    </div>
  );
}

function PayoutRequestModal({
  maxAmount,
  onClose,
  onSubmitted,
}: {
  maxAmount: number;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { user } = useAuth();
  const { push } = useToast();
  const [amount, setAmount] = useState(maxAmount);
  const [method, setMethod] = useState<"bank" | "jazzcash" | "easypaisa">("bank");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!user) return;
    if (amount <= 0) {
      push({ tone: "red", title: "Invalid amount", message: "Amount must be > 0." });
      return;
    }
    if (amount > maxAmount) {
      push({ tone: "red", title: "Too much", message: `You can request up to ₨ ${maxAmount.toLocaleString()}.` });
      return;
    }
    if (!accountTitle.trim() || !accountNumber.trim()) {
      push({ tone: "red", title: "Missing fields", message: "Account title and number required." });
      return;
    }
    setBusy(true);
    const id = `po-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("payout_requests").insert({
      id,
      organizer_id: user.id,
      amount,
      method,
      account_title: accountTitle.trim(),
      account_number: accountNumber.trim(),
      notes: notes.trim() || null,
      status: "pending",
    });
    setBusy(false);
    if (error) {
      push({ tone: "red", title: "Failed", message: error.message });
      return;
    }
    onSubmitted();
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
            <h3 className="text-base font-bold">Request payout</h3>
            <button
              onClick={onClose}
              className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <Field label="Amount (PKR)">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  max={maxAmount}
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => setAmount(maxAmount)}
                  className="rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10"
                >
                  Max
                </button>
              </div>
              <div className="mt-1 text-[10px] text-zinc-500">
                Max available: ₨ {maxAmount.toLocaleString()}
              </div>
            </Field>
            <Field label="Method">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="input"
              >
                <option value="bank">Bank transfer</option>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">Easypaisa</option>
              </select>
            </Field>
            <Field label="Account title">
              <input
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                className="input"
                placeholder="Name on account"
              />
            </Field>
            <Field label={method === "bank" ? "IBAN / account number" : "Mobile number"}>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="input"
                placeholder={method === "bank" ? "PK00ABCD0000000000" : "0300-1234567"}
              />
            </Field>
            <Field label="Notes (optional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="input"
                placeholder="Anything we should know…"
              />
            </Field>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Submitting…" : "Submit request"}
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

function Stat({ Icon, label, value, sub, tone }: any) {
  const tones: Record<string, string> = {
    violet: "from-violet-500/20 text-violet-300",
    amber: "from-amber-500/20 text-amber-300",
    red: "from-red-500/20 text-red-300",
    emerald: "from-emerald-500/20 text-emerald-300",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[var(--bg-card)] p-4">
      <div className={"pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50 " + tones[tone]} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </div>
          <div className="mt-1 text-2xl font-bold text-white">{value}</div>
          {sub && <div className="mt-0.5 text-[10px] text-zinc-500">{sub}</div>}
        </div>
        <div className={"grid h-9 w-9 place-items-center rounded-xl bg-white/5 " + tones[tone].split(" ").pop()}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
