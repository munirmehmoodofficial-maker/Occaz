import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Megaphone,
  Sparkles,
  Tag,
  Plus,
  Copy,
  Trash2,
  TrendingUp,
  Receipt,
  Users,
  Calendar,
  CheckCircle2,
  Crown,
  Building2,
  Percent,
  Banknote,
  X,
  Eye,
  EyeOff,
  Loader2,
  Search,
  BarChart3,
  Share2,
  Star,
  ArrowUp,
  Zap,
  Gift,
  Wand2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../lib/auth";
import { useDataStore } from "../../data/store";
import { useToast } from "../../lib/toast";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../lib/supabase";
import clsx from "clsx";

interface Coupon {
  id: string;
  code: string;
  organizer_id: string | null;
  plan: string;
  kind: "percent" | "fixed";
  amount: number;
  max_redemptions: number;
  redemptions: number;
  valid_until: string | null;
  active: boolean;
  created_at: string;
}

export function OrganizerPromotePage() {
  const { user, isAdmin } = useAuth();
  const { events, updateEvent } = useDataStore();
  const { push } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState<"plan" | "event" | null>(null);
  const [tab, setTab] = useState<"overview" | "coupons" | "featured">("overview");
  const [q, setQ] = useState("");

  const myOrgName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const myEvents = events.filter(
    (e) =>
      e.organizer === myOrgName ||
      (e as any).created_by === user?.id ||
      (e as any).organizer_id === user?.id,
  );

  async function loadCoupons() {
    setLoading(true);
    // Get coupons for the organizer (or all if admin)
    let query = supabase
      .from("coupons")
      .select("id, code, organizer_id, plan, kind, amount, max_redemptions, redemptions, valid_until, active, created_at")
      .order("created_at", { ascending: false });
    if (!isAdmin) {
      query = query.or(`organizer_id.eq.${user?.id},organizer_id.is.null`);
    }
    const { data, error } = await query;
    if (!error && data) setCoupons(data as Coupon[]);
    setLoading(false);
  }

  useEffect(() => {
    if (user) loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function toggleFeatured(id: string, current: boolean) {
    const res = await updateEvent(id, { featured: !current });
    if (res.error) push("err", res.error);
    else push("ok", current ? "Removed from featured" : "Event is now featured");
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Delete this coupon?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) push("err", error.message);
    else {
      push("ok", "Coupon deleted");
      loadCoupons();
    }
  }

  const filtered = coupons.filter((c) =>
    !q || c.code.toLowerCase().includes(q.toLowerCase()),
  );

  const stats = {
    totalCoupons: coupons.length,
    activeCoupons: coupons.filter((c) => c.active).length,
    totalRedemptions: coupons.reduce((s, c) => s + c.redemptions, 0),
    featuredEvents: myEvents.filter((e) => e.featured).length,
  };

  return (
    <div className="page pb-20">
      <div className="container">
        <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Organizer
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              Promote & coupons
            </h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              Boost events, issue promo codes, and grow your audience
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)]">
          {(
            [
              { id: "overview", label: "Overview", Icon: BarChart3 },
              { id: "coupons", label: "Coupons", Icon: Tag },
              { id: "featured", label: "Featured events", Icon: Sparkles },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition",
                tab === t.id
                  ? "border-accent-500 text-white"
                  : "border-transparent text-[var(--text-tertiary)] hover:text-white",
              )}
            >
              <t.Icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatBox
                label="Total coupons"
                value={stats.totalCoupons}
                icon={Tag}
                color="violet"
              />
              <StatBox
                label="Active"
                value={stats.activeCoupons}
                icon={CheckCircle2}
                color="emerald"
              />
              <StatBox
                label="Redemptions"
                value={stats.totalRedemptions}
                icon={Users}
                color="blue"
              />
              <StatBox
                label="Featured events"
                value={stats.featuredEvents}
                icon={Sparkles}
                color="amber"
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {/* Quick actions */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                <h3 className="text-sm font-medium">Quick actions</h3>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Common promotional moves
                </p>
                <div className="mt-4 grid gap-2">
                  <button
                    onClick={() => setShowCreate("plan")}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-left transition hover:border-accent-500/40"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-500/15">
                      <Tag className="h-4 w-4 text-accent-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Create plan coupon</div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        Discount for Pro / Business subscribers
                      </div>
                    </div>
                    <ArrowUp className="h-4 w-4 rotate-45 text-[var(--text-tertiary)]" />
                  </button>
                  <button
                    onClick={() => setShowCreate("event")}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-left transition hover:border-accent-500/40"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15">
                      <Receipt className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Create event promo</div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        Discount on event tickets
                      </div>
                    </div>
                    <ArrowUp className="h-4 w-4 rotate-45 text-[var(--text-tertiary)]" />
                  </button>
                  <Link
                    to="/organizer/events"
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-left transition hover:border-accent-500/40"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/15">
                      <Star className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Feature an event</div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        Boost it to the top of the homepage
                      </div>
                    </div>
                    <ArrowUp className="h-4 w-4 rotate-45 text-[var(--text-tertiary)]" />
                  </Link>
                </div>
              </div>

              {/* Pro tips */}
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-br from-accent-500/15 to-pink-500/5 p-5">
                <h3 className="text-sm font-medium">Pro tips for growth</h3>
                <ul className="mt-3 space-y-2.5 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <span>Coupons with shorter expiry dates (7-14 days) convert 2x better</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Share2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                    <span>Share coupon codes on Instagram stories for best reach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pink-400" />
                    <span>20% off works better than 25% — feels more exclusive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-400" />
                    <span>Featured events get 5x more impressions</span>
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* COUPONS */}
        {tab === "coupons" && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by code…"
                  className="input w-full py-2 pl-9 text-sm"
                />
              </div>
              <Button
                onClick={() => setShowCreate("plan")}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                New coupon
              </Button>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center text-sm text-[var(--text-tertiary)]">
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center">
                <Tag className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
                <h3 className="mt-3 text-lg font-semibold">No coupons yet</h3>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                  Create your first coupon to reward your audience
                </p>
                <Button
                  className="mt-4"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowCreate("plan")}
                >
                  Create coupon
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((c) => (
                  <CouponCard
                    key={c.id}
                    coupon={c}
                    onDelete={() => deleteCoupon(c.id)}
                    onCopy={() => {
                      navigator.clipboard?.writeText(c.code);
                      push("ok", `Copied ${c.code}`);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* FEATURED */}
        {tab === "featured" && (
          <>
            {myEvents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center">
                <Calendar className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
                <h3 className="mt-3 text-lg font-semibold">No events yet</h3>
                <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                  Create events first, then you can feature them
                </p>
                <Link to="/admin/events" className="mt-4 inline-block">
                  <Button leftIcon={<Plus className="h-4 w-4" />}>
                    Create event
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {myEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3"
                  >
                    {e.image ? (
                      <img src={e.image} className="h-14 w-14 shrink-0 rounded-xl object-cover" alt="" />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-xl bg-[var(--bg-elevated)]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{e.title}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        {new Date(e.date).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {e.city}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFeatured(e.id, e.featured)}
                      className={clsx(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                        e.featured
                          ? "bg-accent-500/15 text-accent-300 ring-1 ring-accent-500/30"
                          : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-accent-300",
                      )}
                    >
                      {e.featured ? "Featured" : "Feature"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create modal */}
        <AnimatePresence>
          {showCreate && (
            <CreateCouponModal
              mode={showCreate}
              onClose={() => setShowCreate(null)}
              onCreated={() => {
                setShowCreate(null);
                loadCoupons();
              }}
              userId={user?.id ?? ""}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: "violet" | "emerald" | "blue" | "amber";
}) {
  const colorClass = {
    violet: "text-violet-400 bg-violet-500/15",
    emerald: "text-emerald-400 bg-emerald-500/15",
    blue: "text-blue-400 bg-blue-500/15",
    amber: "text-amber-400 bg-amber-500/15",
  }[color];
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
        <div className={`grid h-7 w-7 place-items-center rounded-lg ${colorClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold">{value.toLocaleString()}</div>
    </div>
  );
}

function CouponCard({
  coupon,
  onDelete,
  onCopy,
}: {
  coupon: Coupon;
  onDelete: () => void;
  onCopy: () => void;
}) {
  const expired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
  const usedUp = coupon.max_redemptions > 0 && coupon.redemptions >= coupon.max_redemptions;
  const isActive = coupon.active && !expired && !usedUp;
  const usagePct =
    coupon.max_redemptions > 0
      ? Math.min(100, (coupon.redemptions / coupon.max_redemptions) * 100)
      : 0;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="rounded-lg bg-accent-500/15 px-2 py-1 font-mono text-sm font-bold text-accent-300">
              {coupon.code}
            </code>
            <button
              onClick={onCopy}
              className="rounded p-1 text-[var(--text-tertiary)] transition hover:bg-[var(--bg-elevated)] hover:text-white"
              title="Copy code"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="rounded-md bg-[var(--bg-elevated)] px-1.5 py-0.5">
              {coupon.plan === "any" ? "Any plan" : coupon.plan}
            </span>
            <span className="text-[var(--text-tertiary)]">·</span>
            <span className="font-semibold">
              {coupon.kind === "percent"
                ? `${coupon.amount}% off`
                : `₨ ${coupon.amount.toLocaleString()} off`}
            </span>
            {coupon.valid_until && (
              <>
                <span className="text-[var(--text-tertiary)]">·</span>
                <span className="text-[var(--text-tertiary)]">
                  {new Date(coupon.valid_until).toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={onDelete}
          className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition hover:bg-red-500/15 hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex-1">
          {coupon.max_redemptions > 0 ? (
            <>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                <div
                  className={clsx(
                    "h-full transition-all",
                    usagePct >= 100
                      ? "bg-red-500"
                      : usagePct >= 80
                        ? "bg-amber-500"
                        : "bg-accent-500",
                  )}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-[var(--text-tertiary)]">
                {coupon.redemptions} / {coupon.max_redemptions} used
              </div>
            </>
          ) : (
            <div className="text-[10px] text-[var(--text-tertiary)]">
              Unlimited uses · {coupon.redemptions} so far
            </div>
          )}
        </div>
        {isActive ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-500/30">
            Active
          </span>
        ) : expired ? (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-300 ring-1 ring-red-500/30">
            Expired
          </span>
        ) : usedUp ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300 ring-1 ring-amber-500/30">
            Fully used
          </span>
        ) : (
          <span className="rounded-full bg-zinc-500/15 px-2 py-0.5 text-[10px] font-medium text-zinc-300 ring-1 ring-zinc-500/30">
            Inactive
          </span>
        )}
      </div>
    </div>
  );
}

function CreateCouponModal({
  mode,
  onClose,
  onCreated,
  userId,
}: {
  mode: "plan" | "event";
  onClose: () => void;
  onCreated: () => void;
  userId: string;
}) {
  const { push } = useToast();
  const [code, setCode] = useState(generateCode());
  const [plan, setPlan] = useState<"any" | "pro" | "business">("any");
  const [kind, setKind] = useState<"percent" | "fixed">("percent");
  const [amount, setAmount] = useState(20);
  const [maxRedemptions, setMaxRedemptions] = useState(0);
  const [validUntil, setValidUntil] = useState("");
  const [busy, setBusy] = useState(false);

  function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  async function save() {
    if (!code.trim()) {
      push("err", "Code is required");
      return;
    }
    if (kind === "percent" && (amount <= 0 || amount > 100)) {
      push("err", "Percent must be 1-100");
      return;
    }
    if (kind === "fixed" && amount <= 0) {
      push("err", "Amount must be positive");
      return;
    }
    setBusy(true);
    const payload: any = {
      id: "cpn-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      code: code.toUpperCase().trim(),
      organizer_id: userId || null,
      plan: mode === "event" ? "any" : plan,
      kind,
      amount: Number(amount),
      max_redemptions: Number(maxRedemptions),
      valid_until: validUntil || null,
      active: true,
    };
    const { error } = await supabase.from("coupons").insert(payload);
    setBusy(false);
    if (error) {
      push("err", error.message);
      return;
    }
    push("ok", "Coupon created");
    onCreated();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-6">
          <h2 className="text-xl font-semibold">
            {mode === "plan" ? "Create plan coupon" : "Create event promo"}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Reward subscribers with a discount
          </p>

          {/* Code */}
          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-medium">Code</label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="input flex-1 font-mono uppercase"
                placeholder="OCCAZ20"
              />
              <button
                onClick={() => setCode(generateCode())}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white"
                title="Generate"
              >
                <Wand2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Plan */}
          {mode === "plan" && (
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium">Plan</label>
              <div className="grid grid-cols-3 gap-2">
                {(["any", "pro", "business"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlan(p)}
                    className={clsx(
                      "rounded-xl border px-3 py-2 text-sm font-medium capitalize transition",
                      plan === p
                        ? "border-accent-500/50 bg-accent-500/10 text-white"
                        : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)]",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Discount type */}
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium">Discount type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setKind("percent")}
                className={clsx(
                  "rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                  kind === "percent"
                    ? "border-accent-500/50 bg-accent-500/10 text-white"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)]",
                )}
              >
                <Percent className="mr-1 inline h-3.5 w-3.5" /> Percent
              </button>
              <button
                onClick={() => setKind("fixed")}
                className={clsx(
                  "rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                  kind === "fixed"
                    ? "border-accent-500/50 bg-accent-500/10 text-white"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)]",
                )}
              >
                <Banknote className="mr-1 inline h-3.5 w-3.5" /> Rs fixed
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium">
              Amount {kind === "percent" ? "(%)" : "(Rs)"}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={1}
              max={kind === "percent" ? 100 : 100000}
              className="input"
            />
          </div>

          {/* Max redemptions */}
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium">
              Max redemptions (0 = unlimited)
            </label>
            <input
              type="number"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(Number(e.target.value))}
              min={0}
              className="input"
            />
          </div>

          {/* Expiry */}
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium">
              Expires (optional)
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="input"
            />
          </div>

          {/* Preview */}
          <div className="mt-5 rounded-2xl border border-dashed border-accent-500/30 bg-accent-500/5 p-4">
            <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Preview
            </div>
            <div className="mt-2 flex items-center gap-3">
              <code className="rounded-lg bg-accent-500/15 px-2 py-1 font-mono text-sm font-bold text-accent-300">
                {code || "OCCAZ20"}
              </code>
              <span className="font-semibold">
                {kind === "percent" ? `${amount}%` : `₨ ${amount.toLocaleString()}`} off
              </span>
            </div>
            <div className="mt-1 text-xs text-[var(--text-tertiary)]">
              {plan === "any" ? "Any plan" : `On ${plan}`} · {maxRedemptions === 0 ? "Unlimited uses" : `${maxRedemptions} max`}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button fullWidth variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={save}
              disabled={busy}
              leftIcon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            >
              Create coupon
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
