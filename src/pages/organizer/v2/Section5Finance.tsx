import { useEffect, useState } from "react";
import { Wallet, TrendingUp, Receipt, Download } from "lucide-react";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

const PLATFORM_FEE_PCT = 5; // 5% platform commission

/**
 * Section 5 — Finance & Payouts
 * Real data from registrations: gross sales, commission, net, refunds.
 */
export function Section5Finance() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    grossSales: 0,
    commission: 0,
    refunds: 0,
    net: 0,
    pendingPayout: 0,
  });
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
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

      setStats({
        grossSales: gross,
        commission,
        refunds,
        net,
        pendingPayout: net, // simplified — actual flow would have paid/pending
      });

      const { data: pays } = await supabase
        .from("payout_requests")
        .select("id, amount, method, status, created_at, transaction_ref")
        .eq("organizer_id", user.id)
        .order("created_at", { ascending: false });
      setPayouts(pays ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Finance & payouts</h2>
          <p className="text-xs text-zinc-500">
            Sales, commission, refunds, and payout history
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10">
          <Download className="h-3.5 w-3.5" /> Statement
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          Icon={TrendingUp}
          label="Gross sales"
          value={`₨ ${stats.grossSales.toLocaleString()}`}
          sub={`${PLATFORM_FEE_PCT}% platform fee`}
          tone="violet"
        />
        <Stat
          Icon={Receipt}
          label="OCCAZ commission"
          value={`₨ ${stats.commission.toLocaleString()}`}
          sub={`${PLATFORM_FEE_PCT}% of paid sales`}
          tone="amber"
        />
        <Stat
          Icon={Wallet}
          label="Refunds"
          value={`₨ ${stats.refunds.toLocaleString()}`}
          sub="Adjustments"
          tone="red"
        />
        <Stat
          Icon={Wallet}
          label="Net payable"
          value={`₨ ${stats.net.toLocaleString()}`}
          sub="Available for payout"
          tone="emerald"
        />
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Payout history</h3>
        </div>
        {loading ? (
          <div className="mt-3 text-sm text-zinc-500">Loading…</div>
        ) : payouts.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-500">
            No payouts yet. Once you have paid orders, you'll be able to request a payout here.
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
                  <div className="text-[10px] text-zinc-500">
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
