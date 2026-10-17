import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Ticket,
  Receipt,
  CreditCard,
  RefreshCw,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Crown,
  Sparkles,
  Star,
  Image as ImageIcon,
  Globe,
  Instagram,
  Facebook,
  Music,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../lib/toast";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { writeAuditLog } from "../../lib/adminAudit";
import clsx from "clsx";

const PLAN_META: Record<string, { name: string; price: number; Icon: any; tone: string }> = {
  starter: { name: "Starter", price: 3000, Icon: Star, tone: "slate" },
  pro: { name: "Pro", price: 5000, Icon: Sparkles, tone: "accent" },
  business: { name: "Business", price: 12000, Icon: Crown, tone: "violet" },
  free: { name: "Free", price: 0, Icon: Star, tone: "slate" },
};

function fmtPKR(n: number) {
  return `Rs ${Number(n || 0).toLocaleString("en-PK")}`;
}

function fmtDate(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminOrganizerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const [org, setOrg] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [planPayments, setPlanPayments] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"events" | "orders" | "tickets" | "subscription" | "payouts" | "plan_payments">("events");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);

    // Organizer profile
    const { data: orgRow } = await supabase
      .from("organizer_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    setOrg(orgRow);

    // Linked auth profile
    const { data: profRow } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    setProfile(profRow);

    // Events
    const { data: evs } = await supabase
      .from("events")
      .select("*")
      .eq("organizer_id", id)
      .order("created_at", { ascending: false });
    setEvents(evs ?? []);

    // Registrations (orders + tickets)
    const { data: regs } = await supabase
      .from("registrations")
      .select("*")
      .eq("organizer_id", id)
      .order("created_at", { ascending: false });
    setRegistrations(regs ?? []);

    // Plan payments
    const { data: pps } = await supabase
      .from("organizer_plan_payments")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    setPlanPayments(pps ?? []);

    // Subscriptions
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("organizer_id", id)
      .order("current_period_end", { ascending: false });
    setSubscriptions(subs ?? []);

    // Payouts
    const { data: pos } = await supabase
      .from("payout_requests")
      .select("*")
      .eq("organizer_id", id)
      .order("created_at", { ascending: false });
    setPayouts(pos ?? []);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Aggregations
  const kpis = useMemo(() => {
    const gross = registrations
      .filter((r) => r.payment_status === "succeeded" || r.status === "confirmed")
      .reduce((s, r) => s + Number(r.amount_paid ?? r.total ?? 0), 0);
    const commission = registrations
      .filter((r) => r.payment_status === "succeeded" || r.status === "confirmed")
      .reduce((s, r) => s + Number(r.commission ?? 0), 0);
    const refunds = registrations
      .filter((r) => r.status === "refunded")
      .reduce((s, r) => s + Number(r.amount_paid ?? r.total ?? 0), 0);
    const checkedIn = registrations.filter((r) => r.check_in_at).length;
    return {
      events: events.length,
      orders: registrations.length,
      gross,
      commission,
      net: gross - commission - refunds,
      refunds,
      checkedIn,
    };
  }, [events, registrations]);

  async function setPublished(published: boolean) {
    if (!org) return;
    setBusy(true);
    const { error } = await supabase
      .from("organizer_profiles")
      .update({ is_published: published })
      .eq("id", org.id);
    setBusy(false);
    if (error) {
      push({ tone: "red", title: "Update failed", message: error.message });
    } else {
      push({ tone: "green", title: published ? "Published" : "Unpublished" });
      await writeAuditLog({
        action: published ? "organizer.published" : "organizer.unpublished",
        target_type: "organizer",
        target_id: org.id,
      });
      load();
    }
  }

  async function setVerified(verified: boolean) {
    if (!org) return;
    setBusy(true);
    const { error } = await supabase
      .from("organizer_profiles")
      .update({ verified, verified_at: verified ? new Date().toISOString() : null })
      .eq("id", org.id);
    setBusy(false);
    if (error) {
      push({ tone: "red", title: "Update failed", message: error.message });
    } else {
      push({ tone: "green", title: verified ? "Verified" : "Verification removed" });
      await writeAuditLog({
        action: verified ? "organizer.verified" : "organizer.unverified",
        target_type: "organizer",
        target_id: org.id,
      });
      load();
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="rounded-2xl bg-[var(--bg-card)] p-12 text-center ring-1 ring-[var(--border-subtle)]">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
          <p className="mt-3 text-sm">Organizer not found.</p>
        </div>
      </div>
    );
  }

  const meta = PLAN_META[org.plan] || PLAN_META.free;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/organizers")}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] hover:text-[var(--text-primary)]"
            aria-label="Back to organizers"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{org.display_name}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
              {org.slug && (
                <span className="font-mono">/organizers/{org.slug}</span>
              )}
              {org.verified && (
                <Badge tone="emerald">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </Badge>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5">
                <meta.Icon className="h-3 w-3" /> {meta.name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setVerified(!org.verified)}
            disabled={busy}
            leftIcon={<ShieldCheck className="h-3.5 w-3.5" />}
          >
            {org.verified ? "Remove verified" : "Mark verified"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPublished(!org.is_published)}
            disabled={busy}
            leftIcon={org.is_published ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          >
            {org.is_published ? "Unpublish" : "Publish"}
          </Button>
          <Link to={`/admin/organizer-billing/${org.id}`}>
            <Button size="sm" leftIcon={<CreditCard className="h-3.5 w-3.5" />}>
              Billing
            </Button>
          </Link>
          {org.slug && (
            <a
              href={`/organizers/${org.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--bg-card)] px-3 text-xs font-medium text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)] hover:text-[var(--text-primary)]"
            >
              Public page <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Cover + logo */}
      <div className="overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
        {org.cover_image ? (
          <div
            className="h-32 bg-cover bg-center"
            style={{ backgroundImage: `url(${org.cover_image})` }}
          />
        ) : (
          <div className="h-32 bg-gradient-to-r from-accent-500/30 via-pink-500/20 to-violet-500/30" />
        )}
        <div className="-mt-10 flex items-end gap-4 px-5 pb-5">
          {org.logo ? (
            <img
              src={org.logo}
              alt={org.display_name}
              className="h-20 w-20 rounded-2xl border-4 border-[var(--bg-card)] object-cover"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-[var(--bg-card)] bg-gradient-to-br from-accent-500 to-pink-500 text-2xl font-bold text-white">
              {(org.display_name || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex-1 pb-1">
            {org.bio && (
              <p className="max-w-2xl text-sm text-[var(--text-secondary)]">{org.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Account + contact + social */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Account
          </h3>
          <div className="mt-3 space-y-2 text-sm">
            <Field icon={<Mail className="h-3.5 w-3.5" />} label="Email">
              {profile?.email ? (
                <a href={`mailto:${profile.email}`} className="hover:underline">
                  {profile.email}
                </a>
              ) : "—"}
            </Field>
            <Field icon={<Phone className="h-3.5 w-3.5" />} label="Phone">
              {profile?.phone || org.phone || "—"}
            </Field>
            <Field icon={<MapPin className="h-3.5 w-3.5" />} label="City">
              {org.city || "—"}
            </Field>
            <Field label="Role">
              <Badge tone={profile?.role === "admin" ? "violet" : "slate"}>
                {profile?.role || "user"}
              </Badge>
            </Field>
            <Field label="Joined">
              {fmtDate(org.created_at)}
            </Field>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Public contact
          </h3>
          <div className="mt-3 space-y-2 text-sm">
            <Field icon={<Mail className="h-3.5 w-3.5" />} label="Contact email">
              {org.contact_email ? (
                <a href={`mailto:${org.contact_email}`} className="hover:underline">
                  {org.contact_email}
                </a>
              ) : "—"}
            </Field>
            <Field icon={<Phone className="h-3.5 w-3.5" />} label="Contact phone">
              {org.contact_phone ? (
                <a href={`tel:${org.contact_phone}`} className="hover:underline">
                  {org.contact_phone}
                </a>
              ) : "—"}
            </Field>
            <Field icon={<Globe className="h-3.5 w-3.5" />} label="Website">
              {org.website ? (
                <a href={org.website} target="_blank" rel="noreferrer" className="hover:underline">
                  {org.website}
                </a>
              ) : "—"}
            </Field>
            <Field label="Type">
              {org.organizer_type ? (
                <span className="capitalize">{org.organizer_type.replace(/_/g, " ")}</span>
              ) : "—"}
            </Field>
            <Field label="Verification">
              <Badge
                tone={
                  org.verification_status === "approved"
                    ? "emerald"
                    : org.verification_status === "rejected"
                    ? "red"
                    : "amber"
                }
              >
                {org.verification_status || "pending"}
              </Badge>
            </Field>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Financials snapshot
          </h3>
          <div className="mt-3 space-y-2.5 text-sm">
            <KPIRow label="Events" value={kpis.events} Icon={Calendar} tone="accent" />
            <KPIRow label="Orders" value={kpis.orders} Icon={Ticket} tone="cyan" />
            <KPIRow label="Checked in" value={kpis.checkedIn} Icon={CheckCircle2} tone="emerald" />
            <KPIRow label="Gross sales" value={fmtPKR(kpis.gross)} Icon={CreditCard} tone="emerald" />
            <KPIRow label="Commission" value={fmtPKR(kpis.commission)} Icon={Receipt} tone="amber" />
            <KPIRow label="Refunds" value={fmtPKR(kpis.refunds)} Icon={XCircle} tone="red" />
            <div className="mt-2 border-t border-[var(--border-subtle)] pt-2">
              <KPIRow label="Net to organizer" value={fmtPKR(kpis.net)} Icon={Sparkles} tone="violet" bold />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for related data */}
      <div className="flex flex-wrap gap-1 rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)] w-fit">
        {[
          { value: "events", label: "Events", count: events.length, Icon: Calendar },
          { value: "orders", label: "Orders", count: registrations.length, Icon: Ticket },
          { value: "tickets", label: "Check-ins", count: kpis.checkedIn, Icon: CheckCircle2 },
          { value: "subscription", label: "Subscriptions", count: subscriptions.length, Icon: Crown },
          { value: "plan_payments", label: "Plan payments", count: planPayments.length, Icon: CreditCard },
          { value: "payouts", label: "Payouts", count: payouts.length, Icon: Receipt },
        ].map((t: any) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition inline-flex items-center gap-1.5",
              tab === t.value
                ? "bg-white text-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            <t.Icon className="h-3.5 w-3.5" />
            {t.label}
            <span className="text-[10px] text-[var(--text-tertiary)]">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "events" && (
        <RelatedList
          rows={events}
          empty="No events yet."
          renderRow={(e) => (
            <Link
              key={e.id}
              to={`/event/${e.id}`}
              target="_blank"
              className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)] hover:ring-accent-500/30"
            >
              {e.image ? (
                <img src={e.image} alt="" className="h-12 w-12 rounded-md object-cover" />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-md bg-[var(--bg-elevated)]">
                  <ImageIcon className="h-5 w-5 text-[var(--text-tertiary)]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{e.title}</div>
                <div className="truncate text-[10px] text-[var(--text-tertiary)]">
                  {e.date ? fmtDate(e.date) : "—"} · {e.city || "—"} · {e.mode || "Physical"}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {e.published ? (
                  <Badge tone="emerald">Published</Badge>
                ) : (
                  <Badge tone="slate">Draft</Badge>
                )}
                {e.featured && <Badge tone="violet">Featured</Badge>}
              </div>
            </Link>
          )}
        />
      )}

      {tab === "orders" && (
        <RelatedList
          rows={registrations}
          empty="No orders yet."
          renderRow={(r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)]"
            >
              <div className="grid h-9 w-9 place-items-center rounded-md bg-[var(--bg-elevated)]">
                <Ticket className="h-4 w-4 text-[var(--text-secondary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {r.event_title || r.event_id?.slice(0, 8) || "Order"}
                </div>
                <div className="truncate text-[10px] text-[var(--text-tertiary)]">
                  {r.full_name || r.user_email || "—"} ·{" "}
                  {new Date(r.created_at).toLocaleDateString("en-PK")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {fmtPKR(r.amount_paid ?? r.total ?? 0)}
                </div>
                <div className="mt-0.5">
                  <Badge
                    tone={
                      r.status === "confirmed" || r.payment_status === "succeeded"
                        ? "emerald"
                        : r.status === "refunded"
                        ? "red"
                        : "amber"
                    }
                  >
                    {r.status || r.payment_status || "pending"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        />
      )}

      {tab === "tickets" && (
        <RelatedList
          rows={registrations.filter((r) => r.check_in_at)}
          empty="No check-ins yet."
          renderRow={(r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)]"
            >
              <div className="grid h-9 w-9 place-items-center rounded-md bg-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.full_name || r.user_email}</div>
                <div className="truncate font-mono text-[10px] text-[var(--text-tertiary)]">
                  {r.ticket_code || r.id?.slice(0, 8)}
                </div>
              </div>
              <div className="text-right text-[10px] text-[var(--text-tertiary)]">
                {r.check_in_at && new Date(r.check_in_at).toLocaleString("en-PK")}
              </div>
            </div>
          )}
        />
      )}

      {tab === "subscription" && (
        <RelatedList
          rows={subscriptions}
          empty="No subscription record."
          renderRow={(s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)]"
            >
              <div className="grid h-9 w-9 place-items-center rounded-md bg-violet-500/20">
                <Crown className="h-4 w-4 text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium capitalize">{s.plan}</div>
                <div className="text-[10px] text-[var(--text-tertiary)]">
                  {fmtDate(s.started_at)} → {fmtDate(s.current_period_end)}
                </div>
              </div>
              <Badge
                tone={
                  s.status === "active"
                    ? "emerald"
                    : s.status === "cancelled"
                    ? "slate"
                    : "amber"
                }
              >
                {s.status}
              </Badge>
            </div>
          )}
        />
      )}

      {tab === "plan_payments" && (
        <RelatedList
          rows={planPayments}
          empty="No plan payments yet."
          renderRow={(p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)]"
            >
              <div className="grid h-9 w-9 place-items-center rounded-md bg-accent-500/20">
                <CreditCard className="h-4 w-4 text-accent-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">
                  {p.plan} · {fmtPKR(p.amount)}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)]">
                  {p.method || p.gateway || "manual"} ·{" "}
                  {new Date(p.created_at).toLocaleDateString("en-PK")}
                </div>
              </div>
              <Badge
                tone={
                  p.status === "approved" || p.status === "succeeded"
                    ? "emerald"
                    : p.status === "rejected"
                    ? "red"
                    : "amber"
                }
              >
                {p.status}
              </Badge>
            </div>
          )}
        />
      )}

      {tab === "payouts" && (
        <RelatedList
          rows={payouts}
          empty="No payout requests yet."
          renderRow={(p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)]"
            >
              <div className="grid h-9 w-9 place-items-center rounded-md bg-amber-500/20">
                <Receipt className="h-4 w-4 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">
                  {fmtPKR(p.amount)} · {p.method}
                </div>
                <div className="truncate text-[10px] text-[var(--text-tertiary)]">
                  {p.account_title || p.account_number || "—"}
                </div>
              </div>
              <Badge
                tone={
                  p.status === "paid"
                    ? "emerald"
                    : p.status === "rejected"
                    ? "red"
                    : "amber"
                }
              >
                {p.status}
              </Badge>
            </div>
          )}
        />
      )}
    </div>
  );
}

function RelatedList({
  rows,
  empty,
  renderRow,
}: {
  rows: any[];
  empty: string;
  renderRow: (r: any) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--bg-card)] p-8 text-center text-sm text-[var(--text-tertiary)] ring-1 ring-[var(--border-subtle)]">
        {empty}
      </div>
    );
  }
  return <div className="grid gap-2">{rows.map(renderRow)}</div>;
}

function Field({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon && (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          {label}
        </div>
        <div className="truncate text-[var(--text-primary)]">{children}</div>
      </div>
    </div>
  );
}

function KPIRow({
  label,
  value,
  Icon,
  tone,
  bold,
}: {
  label: string;
  value: any;
  Icon: any;
  tone: string;
  bold?: boolean;
}) {
  const tones: Record<string, string> = {
    accent: "text-accent-400",
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
    violet: "text-violet-400",
  };
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
        <Icon className={clsx("h-3.5 w-3.5", tones[tone])} />
        <span>{label}</span>
      </div>
      <span className={clsx("tabular-nums", bold && "font-semibold")}>{value}</span>
    </div>
  );
}
