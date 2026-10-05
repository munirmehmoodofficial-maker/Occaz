import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  X,
  Loader2,
  Search,
  Mail,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Music,
  MapPin,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface OrgRow {
  id: string;
  owner_id: string | null;
  created_by: string | null;
  name: string;
  slug: string | null;
  logo_url: string | null;
  cover_image: string | null;
  cover_url: string | null;
  description: string | null;
  website: string | null;
  email: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  operating_cities: string[] | null;
  organizer_type: string | null;
  social_links: any;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  plan: string;
  verification_status: string;
  verified_at: string | null;
  rejection_reason: string | null;
  is_published: boolean | null;
  created_at: string;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  event_company: "Event Company",
  university_society: "University / Society",
  business_venue: "Business / Venue",
  ngo_organization: "NGO / Organization",
  other: "Other",
};

const VERIFICATION_BADGE: Record<string, { label: string; color: string; Icon: any }> = {
  pending: { label: "Pending review", color: "amber", Icon: Clock },
  approved: { label: "Verified", color: "emerald", Icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "red", Icon: X },
};

export function AdminOrganizerVerifications() {
  const { push } = useToast();
  const [list, setList] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [view, setView] = useState<OrgRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<OrgRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      push("err", error.message);
      setLoading(false);
      return;
    }
    setList((data as OrgRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-organizers-verifs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "organizations" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(o: OrgRow) {
    setBusy(o.id);
    try {
      // Update both tables
      const { error: orgErr } = await supabase
        .from("organizations")
        .update({
          verification_status: "approved",
          verified_at: new Date().toISOString(),
          is_published: true,
        })
        .eq("id", o.id);
      if (orgErr) throw orgErr;
      // mirror on organizer_profiles
      await supabase
        .from("organizer_profiles")
        .update({
          verified: true,
          verification_status: "approved",
        })
        .eq("id", o.owner_id ?? o.id);
      push("ok", `${o.name} approved & verified`);
      setView(null);
      load();
    } catch (e: any) {
      push("err", e?.message ?? "Failed to approve");
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!rejectFor) return;
    if (!rejectReason.trim()) {
      push("err", "Please provide a rejection reason");
      return;
    }
    setBusy(rejectFor.id);
    try {
      const { error: orgErr } = await supabase
        .from("organizations")
        .update({
          verification_status: "rejected",
          rejection_reason: rejectReason,
          verified_at: new Date().toISOString(),
          is_published: false,
        })
        .eq("id", rejectFor.id);
      if (orgErr) throw orgErr;
      await supabase
        .from("organizer_profiles")
        .update({
          verified: false,
          verification_status: "rejected",
        })
        .eq("id", rejectFor.owner_id ?? rejectFor.id);
      push("ok", `${rejectFor.name} rejected`);
      setRejectFor(null);
      setRejectReason("");
      setView(null);
      load();
    } catch (e: any) {
      push("err", e?.message ?? "Failed to reject");
    } finally {
      setBusy(null);
    }
  }

  const filtered = list.filter((o) => {
    if (tab !== "all" && o.verification_status !== tab) return false;
    if (q) {
      const t = q.toLowerCase();
      if (
        !o.name.toLowerCase().includes(t) &&
        !(o.slug?.toLowerCase().includes(t) ?? false) &&
        !(o.email?.toLowerCase().includes(t) ?? false) &&
        !(o.contact_email?.toLowerCase().includes(t) ?? false) &&
        !(o.city?.toLowerCase().includes(t) ?? false)
      )
        return false;
    }
    return true;
  });

  const counts = {
    pending: list.filter((o) => o.verification_status === "pending").length,
    approved: list.filter((o) => o.verification_status === "approved").length,
    rejected: list.filter((o) => o.verification_status === "rejected").length,
    all: list.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizer verifications</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Review and approve organizer registrations
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Badge color="amber">{counts.pending} pending</Badge>
          <Badge color="emerald">{counts.approved} approved</Badge>
          <Badge color="red">{counts.rejected} rejected</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)]">
        {(["pending", "approved", "rejected", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "border-b-2 px-4 py-2 text-sm font-medium transition",
              tab === t
                ? "border-accent-500 text-white"
                : "border-transparent text-[var(--text-tertiary)] hover:text-white",
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">
              ({counts[t]})
            </span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, city…"
              className="input min-w-[260px] py-2 pl-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center text-sm text-[var(--text-tertiary)]">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          <p className="mt-2">Loading organizers…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center">
          <Shield className="mx-auto h-10 w-10 text-[var(--text-tertiary)]" />
          <p className="mt-2 text-sm text-[var(--text-tertiary)]">
            {list.length === 0
              ? "No organizer registrations yet"
              : "No organizers match your filters"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((o) => {
            const badge = VERIFICATION_BADGE[o.verification_status] ?? VERIFICATION_BADGE.pending;
            const Icon = badge.Icon;
            return (
              <button
                key={o.id}
                onClick={() => setView(o)}
                className="flex items-center gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-left transition hover:border-accent-500/30 hover:bg-[var(--bg-card-hover)]"
              >
                {o.logo_url ? (
                  <img
                    src={o.logo_url}
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    alt=""
                  />
                ) : (
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-pink-500 text-lg font-semibold text-white">
                    {o.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{o.name}</span>
                    <Badge color={badge.color as any}>
                      <Icon className="mr-1 h-3 w-3" />
                      {badge.label}
                    </Badge>
                    {o.plan && o.plan !== "starter" && (
                      <Badge color="violet">
                        {o.plan.charAt(0).toUpperCase() + o.plan.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {o.contact_email ?? o.email ?? "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {o.contact_phone ?? o.phone ?? "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {o.city ?? "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(o.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setView(o);
                  }}
                >
                  Review
                </Button>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {view && (
          <DetailModal
            org={view}
            busy={busy}
            onClose={() => setView(null)}
            onApprove={() => approve(view)}
            onReject={() => setRejectFor(view)}
          />
        )}
      </AnimatePresence>

      {/* Reject reason modal */}
      <AnimatePresence>
        {rejectFor && (
          <RejectModal
            org={rejectFor}
            reason={rejectReason}
            setReason={setRejectReason}
            busy={busy === rejectFor.id}
            onClose={() => {
              setRejectFor(null);
              setRejectReason("");
            }}
            onConfirm={reject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailModal(props: {
  org: OrgRow;
  busy: string | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const o = props.org;
  const badge = VERIFICATION_BADGE[o.verification_status] ?? VERIFICATION_BADGE.pending;
  const Icon = badge.Icon;
  const operatingCities = (o.operating_cities as string[]) ?? [];
  const socials = (o.social_links as any) ?? {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur"
      onClick={props.onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover */}
        {o.cover_image || o.cover_url ? (
          <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-accent-500/20 to-pink-500/20">
            <img
              src={o.cover_image || o.cover_url || ""}
              className="h-full w-full object-cover"
              alt=""
            />
          </div>
        ) : (
          <div className="h-2 w-full bg-gradient-to-r from-accent-500 to-pink-500" />
        )}

        <button
          onClick={props.onClose}
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="max-h-[80vh] overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            {o.logo_url ? (
              <img
                src={o.logo_url}
                className="h-16 w-16 shrink-0 rounded-2xl border-2 border-[var(--border-subtle)] object-cover"
                alt=""
              />
            ) : (
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 text-2xl font-bold text-white">
                {o.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">{o.name}</h2>
                <Badge color={badge.color as any}>
                  <Icon className="mr-1 h-3 w-3" />
                  {badge.label}
                </Badge>
                {o.plan && o.plan !== "starter" && (
                  <Badge color="violet">
                    {o.plan.charAt(0).toUpperCase() + o.plan.slice(1)}
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">
                {ORG_TYPE_LABELS[o.organizer_type ?? ""] ?? "—"}
                {o.city && ` · ${o.city}`}
              </p>
            </div>
          </div>

          {/* Bio */}
          {o.description && (
            <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-secondary)]">
              {o.description}
            </div>
          )}

          {/* Contact info */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoRow icon={Mail} label="Email" value={o.contact_email ?? o.email} />
            <InfoRow icon={Phone} label="Phone" value={o.contact_phone ?? o.phone} />
            <InfoRow icon={Globe} label="Website" value={o.website} link />
            <InfoRow icon={MapPin} label="Address" value={o.address} />
            <InfoRow icon={Building2} label="Slug" value={o.slug ? `/${o.slug}` : null} mono />
            <InfoRow
              icon={Calendar}
              label="Joined"
              value={new Date(o.created_at).toLocaleDateString("en-PK", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          </div>

          {/* Social */}
          {(o.instagram || o.facebook || o.tiktok || socials.instagram || socials.facebook) && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Social
              </h3>
              <div className="flex flex-wrap gap-2">
                {(o.instagram ?? socials.instagram) && (
                  <Badge color="violet">
                    <Instagram className="mr-1 h-3 w-3" />
                    {o.instagram ?? socials.instagram}
                  </Badge>
                )}
                {(o.facebook ?? socials.facebook) && (
                  <Badge color="blue">
                    <Facebook className="mr-1 h-3 w-3" />
                    {o.facebook ?? socials.facebook}
                  </Badge>
                )}
                {o.tiktok && (
                  <Badge color="pink">
                    <Music className="mr-1 h-3 w-3" />
                    {o.tiktok}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Operating cities */}
          {operatingCities.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Operating cities
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {operatingCities.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason (if rejected) */}
          {o.verification_status === "rejected" && o.rejection_reason && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <strong>Rejection reason:</strong> {o.rejection_reason}
            </div>
          )}

          {/* Approved metadata */}
          {o.verification_status === "approved" && o.verified_at && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              <CheckCircle2 className="mr-1 inline h-4 w-4" />
              Verified on{" "}
              {new Date(o.verified_at).toLocaleDateString("en-PK", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          )}

          {/* Actions */}
          {o.verification_status === "pending" && (
            <div className="mt-6 flex gap-3 border-t border-[var(--border-subtle)] pt-5">
              <Button
                fullWidth
                onClick={props.onReject}
                variant="outline"
                leftIcon={<X className="h-4 w-4" />}
              >
                Reject
              </Button>
              <Button
                fullWidth
                onClick={props.onApprove}
                disabled={props.busy === o.id}
                leftIcon={
                  props.busy === o.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )
                }
              >
                Approve & verify
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function RejectModal(props: {
  org: OrgRow;
  reason: string;
  setReason: (s: string) => void;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur"
      onClick={props.onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-300">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">Reject {props.org.name}?</h3>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              They'll see this reason and can resubmit after fixing it.
            </p>
          </div>
        </div>
        <textarea
          value={props.reason}
          onChange={(e) => props.setReason(e.target.value)}
          placeholder="Reason for rejection (required)…"
          rows={4}
          className="input min-h-[100px] resize-y"
        />
        <div className="mt-4 flex gap-3">
          <Button fullWidth variant="outline" onClick={props.onClose}>
            Cancel
          </Button>
          <Button
            fullWidth
            variant="danger"
            onClick={props.onConfirm}
            disabled={props.busy || !props.reason.trim()}
            leftIcon={
              props.busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )
            }
          >
            Confirm reject
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoRow(props: {
  icon: any;
  label: string;
  value: string | null | undefined;
  link?: boolean;
  mono?: boolean;
}) {
  const Icon = props.icon;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
          {props.label}
        </div>
        {props.value ? (
          props.link ? (
            <a
              href={props.value}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-sm text-accent-400 hover:underline"
            >
              {props.value}
            </a>
          ) : (
            <div className={clsx("truncate text-sm", props.mono && "font-mono")}>
              {props.value}
            </div>
          )
        ) : (
          <div className="text-sm text-[var(--text-tertiary)]">—</div>
        )}
      </div>
    </div>
  );
}