import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Sparkles,
  Building2,
  Check,
  X,
  RotateCcw,
  Shield,
  Megaphone,
  BarChart3,
  Users,
  Palette,
  Star,
  Layers,
  Headphones,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { supabase } from "../../lib/supabase";
import { PLANS, type PlanFeatures, type PlanId } from "../../lib/plans";
import clsx from "clsx";

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  feature_overrides: Partial<PlanFeatures> | null;
  verification_status: string | null;
  social_links: any;
}

type BooleanFeature = Exclude<keyof PlanFeatures, "maxEventsPerMonth">;

const ALL_FEATURES: Array<{
  key: BooleanFeature;
  label: string;
  desc: string;
  Icon: any;
  defaultFree: boolean;
}> = [
  { key: "canFeature", label: "Featured placement", desc: "Show on homepage and in curated lists", Icon: Sparkles, defaultFree: false },
  { key: "hasPromotionalTools", label: "Promotional tools", desc: "Coupons, boosts, in-app banners", Icon: Megaphone, defaultFree: false },
  { key: "hasAudienceInsights", label: "Audience insights", desc: "Demographics, interests, geo breakdown", Icon: Users, defaultFree: false },
  { key: "canCustomizeProfile", label: "Profile customization", desc: "Logo, bio, socials, custom URL slug", Icon: Palette, defaultFree: false },
  { key: "hasAdvancedAnalytics", label: "Advanced analytics", desc: "Funnels, retention, cohort exports", Icon: BarChart3, defaultFree: false },
  { key: "hasMultipleOrganizers", label: "Multiple organizers", desc: "Invite teammates with their own logins", Icon: Layers, defaultFree: false },
  { key: "hasCampaignTools", label: "Campaign tools", desc: "Email + push broadcast to attendees", Icon: Send, defaultFree: false },
  { key: "hasPriorityPromotion", label: "Priority promotion", desc: "First slot in explore & category feeds", Icon: Star, defaultFree: false },
  { key: "hasDedicatedSupport", label: "Dedicated support", desc: "24/7 chat + on-call account manager", Icon: Headphones, defaultFree: false },
];

// re-import to avoid bundler complaining about the inline one
import { Send } from "lucide-react";

export function AdminOrganizerFeaturesPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<OrgRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function load() {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, slug, logo_url, verification_status, social_links, plan")
      .order("created_at", { ascending: false });
    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }
    setOrgs((data as OrgRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel("admin-org-features")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organizations" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return orgs;
    const t = search.toLowerCase();
    return orgs.filter(
      (o) =>
        o.name.toLowerCase().includes(t) ||
        o.slug.toLowerCase().includes(t),
    );
  }, [orgs, search]);

  function effectiveFlags(org: OrgRow): PlanFeatures {
    const plan = PLANS[0];
    return { ...plan.flags, ...(org.feature_overrides ?? {}) };
  }

  async function saveOverrides(
    org: OrgRow,
    overrides: Partial<PlanFeatures>,
  ) {
    setSaving(true);
    const { data, error } = await supabase.rpc("admin_set_organizer_overrides", {
      p_organizer_id: org.id,
      p_overrides: overrides,
    });
    setSaving(false);
    if (error || !(data as any)?.ok) {
      setToast({
        kind: "err",
        text: (data as any)?.error ?? error?.message ?? "Save failed",
      });
      return;
    }
    setToast({ kind: "ok", text: `Feature overrides saved for ${org.name}` });
    setEditing(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Organizer feature controls
        </h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          Premium feature catalog and per-organizer overrides. Changes apply
          immediately.
        </p>
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

      {/* Plan catalog */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Crown className="h-4 w-4 text-accent-400" />
          <h2 className="text-base font-semibold">Premium feature catalog</h2>
          <span className="ml-auto text-xs text-[var(--text-tertiary)]">
            What each plan unlocks out of the box
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={clsx(
                "rounded-xl border p-4 ring-1",
                p.id === "starter"
                  ? "border-[var(--border-subtle)] ring-[var(--border-subtle)]"
                  : p.id === "pro"
                    ? "border-accent-500/30 ring-accent-500/30"
                    : "border-violet-500/30 ring-violet-500/30",
              )}
            >
              <div className="flex items-center gap-2">
                {p.id === "starter" ? (
                  <Sparkles className="h-4 w-4 text-[var(--text-tertiary)]" />
                ) : p.id === "pro" ? (
                  <Crown className="h-4 w-4 text-accent-400" />
                ) : (
                  <Building2 className="h-4 w-4 text-violet-400" />
                )}
                <div className="font-semibold">{p.name}</div>
              </div>
              <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                ₨ {p.monthlyPKR.toLocaleString()}/mo
              </div>
              <ul className="mt-3 space-y-1.5 text-xs">
                {ALL_FEATURES.map((f) => {
                  const on = Boolean(p.flags[f.key as BooleanFeature]);
                  return (
                    <li
                      key={f.key}
                      className="flex items-center gap-1.5"
                    >
                      {on ? (
                        <Check className="h-3 w-3 text-accent-400" />
                      ) : (
                        <X className="h-3 w-3 text-[var(--text-tertiary)]" />
                      )}
                      <span
                        className={
                          on
                            ? "text-[var(--text-secondary)]"
                            : "text-[var(--text-tertiary)] line-through"
                        }
                      >
                        {f.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Per-organizer overrides */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] p-5">
          <div>
            <h2 className="text-base font-semibold">Per-organizer overrides</h2>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
              Hand-pick features for individual organizers. Useful for partners
              and beta testers.
            </p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizers…"
            className="input w-64"
          />
        </div>
        {err && (
          <div className="border-b border-[var(--border-subtle)] p-4 text-sm text-red-300">
            {err}
          </div>
        )}
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-tertiary)]">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--text-tertiary)]">
            {orgs.length === 0
              ? "No organizers yet."
              : "No organizers match your search."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 text-left text-xs uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-5 py-3 font-medium">Organizer</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Unlocked features</th>
                <th className="px-5 py-3 font-medium">Overrides</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const flags = effectiveFlags(o);
                const count = ALL_FEATURES.filter((f) => Boolean(flags[f.key as BooleanFeature])).length;
                const overrideCount = o.feature_overrides
                  ? Object.keys(o.feature_overrides).length
                  : 0;
                return (
                  <tr
                    key={o.id}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {o.logo_url ? (
                          <img
                            src={o.logo_url}
                            className="h-9 w-9 rounded-xl object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-pink-500 text-sm font-semibold text-white">
                            {o.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">
                            {o.name}
                          </div>
                          <div className="text-xs text-[var(--text-tertiary)]">
                            /{o.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {(() => {
                        const orgPlan = ((o as any).plan as PlanId) || "starter";
                        return (
                          <Badge
                            tone={
                              orgPlan === "business"
                                ? "violet"
                                : orgPlan === "pro"
                                  ? "accent"
                                  : "default"
                            }
                          >
                            {PLANS.find((p) => p.id === orgPlan)?.name}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold">{count}</span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {" "}
                        / {ALL_FEATURES.length}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {overrideCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
                          <Crown className="h-3 w-3" /> {overrideCount} custom
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-tertiary)]">
                          Default
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(o)}
                        leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                      >
                        Edit features
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Edit drawer */}
      <AnimatePresence>
        {editing && (
          <EditFeaturesDrawer
            org={editing}
            onClose={() => setEditing(null)}
            onSave={saveOverrides}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EditFeaturesDrawer({
  org,
  onClose,
  onSave,
  saving,
}: {
  org: OrgRow;
  onClose: () => void;
  onSave: (org: OrgRow, overrides: Partial<PlanFeatures>) => void;
  saving: boolean;
}) {
  const plan = PLANS[0];
  const [overrides, setOverrides] = useState<Partial<PlanFeatures>>(
    org.feature_overrides ?? {},
  );

  function effective(key: BooleanFeature): boolean {
    if (key in overrides) return Boolean((overrides as any)[key]);
    return plan.flags[key];
  }

  function toggle(key: BooleanFeature) {
    setOverrides((o) => {
      const next: Partial<PlanFeatures> = { ...o };
      const current = key in o ? Boolean((o as any)[key]) : plan.flags[key];
      (next as any)[key] = !current;
      return next;
    });
  }

  function reset() {
    setOverrides({});
  }

  function isOverridden(key: keyof PlanFeatures): boolean {
    return key in overrides;
  }

  const diff = Object.keys(overrides).filter(
    (k) => overrides[k as keyof PlanFeatures] !== plan.flags[k as keyof PlanFeatures],
  ).length;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: 480, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 480, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-hidden border-l border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-[var(--border-subtle)] p-6">
          <div className="flex items-center gap-3">
            {org.logo_url ? (
              <img src={org.logo_url} className="h-12 w-12 rounded-xl object-cover" alt="" />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-pink-500 text-base font-bold text-white">
                {org.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold">{org.name}</h2>
              <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <Badge
                  tone={
                    plan.id === "business"
                      ? "violet"
                      : plan.id === "pro"
                        ? "accent"
                        : "default"
                  }
                >
                  {plan.name}
                </Badge>
                <span>·</span>
                <span>Override: {diff} feature{diff === 1 ? "" : "s"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-tertiary)] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Feature toggles</h3>
            <button
              onClick={reset}
              disabled={diff === 0}
              className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] transition hover:text-white disabled:opacity-40"
            >
              <RotateCcw className="h-3 w-3" /> Reset to plan defaults
            </button>
          </div>
          <div className="space-y-2">
            {ALL_FEATURES.map((f) => {
              const on = effective(f.key);
              const overridden = isOverridden(f.key);
              return (
                <div
                  key={f.key}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl p-3 ring-1 transition",
                    on
                      ? "bg-accent-500/10 ring-accent-500/30"
                      : "bg-[var(--bg-card)] ring-[var(--border-subtle)]",
                  )}
                >
                  <div
                    className={clsx(
                      "grid h-9 w-9 place-items-center rounded-lg",
                      on
                        ? "bg-accent-500/20 text-accent-400"
                        : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]",
                    )}
                  >
                    <f.Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {f.label}
                      {overridden && (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/30">
                          Override
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-[var(--text-tertiary)]">
                      {f.desc}
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(f.key)}
                    className={clsx(
                      "relative h-6 w-11 shrink-0 rounded-full transition",
                      on ? "bg-accent-500" : "bg-[var(--bg-elevated)]",
                    )}
                    aria-label={`Toggle ${f.label}`}
                  >
                    <span
                      className={clsx(
                        "absolute top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition",
                        on ? "left-[22px]" : "left-0.5",
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-xs text-[var(--text-tertiary)]">
            <Shield className="mb-1 inline h-3.5 w-3.5 text-accent-400" />
            <strong className="text-[var(--text-secondary)]"> How overrides work:</strong>{" "}
            when you toggle a feature here, the organizer's effective
            capabilities bypass their plan. The change is audited under
            <code className="mx-1 rounded bg-[var(--bg-elevated)] px-1 py-0.5 text-[10px]">
              feature_overrides
            </code>
            and can be reverted at any time.
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] p-5">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(org, overrides)}
            disabled={saving}
            leftIcon={
              saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )
            }
          >
            Save overrides
          </Button>
        </div>
      </motion.aside>
    </>
  );
}
