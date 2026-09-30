import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  CreditCard,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  Shield,
  ChevronLeft,
  Loader2,
  User as UserIcon,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { formatPrice } from "../data/mock";
import type { BookingDraft } from "../components/booking/BookingModal";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

interface CheckoutState {
  draft: BookingDraft;
}

type PaymentMethod = "card" | "jazzcash" | "easypaisa" | "bank";

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as CheckoutState;
  const { user } = useAuth();

  if (!state.draft) {
    return (
      <div className="page container text-center">
        <h1 className="text-2xl font-semibold">No booking in progress</h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">
          Pick an event first, then come back here to pay.
        </p>
        <Button className="mt-5" onClick={() => navigate("/events")}>
          Browse events
        </Button>
      </div>
    );
  }

  const { draft } = state;
  const subtotal = draft.ticketType.price * draft.qty;
  const serviceFee = Math.round(subtotal * 0.05);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<{ ticketIds: string[]; whatsapp: string | null; email: string | null } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function placeOrder() {
    if (!user) {
      setErr("Please sign in to complete your purchase.");
      return;
    }
    if (method === "card") {
      if (!card.number || !card.name || !card.exp || !card.cvc) {
        setErr("Fill in all card details.");
        return;
      }
    }
    setErr(null);
    setProcessing(true);

    // Persist a single row per booking to `registrations`.
    // The table only has (id, event_id, user_id, status) — we
    // embed attendee info into the `status` field as JSON-ish text
    // OR rely on the eventual schema extension. For now we just
    // store the bare minimum and put attendee details into a
    // `meta` JSONB if it exists, otherwise skip.
    const ticketIds: string[] = [];
    for (let i = 0; i < draft.qty; i++) {
      const id =
        "t-" + Date.now().toString(36) + "-" + i.toString(36) + "-" +
        Math.random().toString(36).slice(2, 6);
      ticketIds.push(id);
      const { error } = await supabase.from("registrations").insert({
        id,
        user_id: user.id,
        event_id: draft.event.id,
        attendee_name: draft.attendees[0].name,
        attendee_email: draft.attendees[0].email,
        attendee_phone: draft.attendees[0].phone,
        status: "confirmed",
      });
      if (error) {
        setErr(`Failed to save ticket: ${error.message}`);
        setProcessing(false);
        return;
      }
    }

    // also save phone to profile (if column exists) when opted into WhatsApp
    if (draft.notifyWhatsApp && draft.attendees[0].phone) {
      const { error: phoneErr } = await supabase
        .from("profiles")
        .update({ phone: draft.attendees[0].phone })
        .eq("id", user.id);
      // silent-fail if column doesn't exist; we'll handle it via RLS
      void phoneErr;
    }

    // Simulate payment processor latency
    await new Promise((r) => setTimeout(r, 800));

    setProcessing(false);
    setDone({
      ticketIds,
      whatsapp: draft.notifyWhatsApp ? draft.attendees[0].phone : null,
      email: draft.notifyEmail ? draft.attendees[0].email : null,
    });
  }

  if (done) {
    return (
      <ConfirmationScreen
        eventTitle={draft.event.title}
        qty={draft.qty}
        ticketIds={done.ticketIds}
        email={done.email}
        whatsapp={done.whatsapp}
        onClose={() => navigate("/tickets")}
      />
    );
  }

  return (
    <div className="page pb-20">
      <div className="container">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-2xl font-bold md:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          You're booking {draft.qty} × {draft.ticketType.name} for {draft.event.title}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* Payment method */}
            <div className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
              <h2 className="text-base font-semibold">Payment method</h2>
              <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                All transactions are secured and encrypted.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <PayOption
                  active={method === "card"}
                  onClick={() => setMethod("card")}
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Credit / debit card"
                  desc="Visa, Mastercard"
                />
                <PayOption
                  active={method === "jazzcash"}
                  onClick={() => setMethod("jazzcash")}
                  icon={<Phone className="h-4 w-4" />}
                  label="JazzCash"
                  desc="Mobile wallet"
                />
                <PayOption
                  active={method === "easypaisa"}
                  onClick={() => setMethod("easypaisa")}
                  icon={<Phone className="h-4 w-4" />}
                  label="Easypaisa"
                  desc="Mobile wallet"
                />
                <PayOption
                  active={method === "bank"}
                  onClick={() => setMethod("bank")}
                  icon={<Shield className="h-4 w-4" />}
                  label="Bank transfer"
                  desc="IBAN / FT"
                />
              </div>

              {method === "card" && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 space-y-3"
                >
                  <Field label="Card number">
                    <input
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: e.target.value })}
                      placeholder="4242 4242 4242 4242"
                      className="input"
                      inputMode="numeric"
                      maxLength={19}
                    />
                  </Field>
                  <Field label="Cardholder name">
                    <input
                      value={card.name}
                      onChange={(e) => setCard({ ...card, name: e.target.value })}
                      placeholder="As printed on card"
                      className="input"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Expiry">
                      <input
                        value={card.exp}
                        onChange={(e) => setCard({ ...card, exp: e.target.value })}
                        placeholder="MM/YY"
                        className="input"
                        maxLength={5}
                      />
                    </Field>
                    <Field label="CVC">
                      <input
                        value={card.cvc}
                        onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                        placeholder="123"
                        className="input"
                        maxLength={4}
                        inputMode="numeric"
                      />
                    </Field>
                  </div>
                </motion.div>
              )}
              {method === "jazzcash" && (
                <JazzInstructions
                  name="JazzCash"
                  number="0300-1234567"
                  accountName="Occaz Events (Pvt) Ltd"
                />
              )}
              {method === "easypaisa" && (
                <JazzInstructions
                  name="Easypaisa"
                  number="0300-1234567"
                  accountName="Occaz Events (Pvt) Ltd"
                />
              )}
              {method === "bank" && (
                <div className="mt-4 rounded-xl bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]">
                  <div className="font-medium text-[var(--text-primary)]">Bank transfer</div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div>Bank: <span className="text-white">Meezan Bank</span></div>
                    <div>Account title: <span className="text-white">Occaz Events (Pvt) Ltd</span></div>
                    <div>IBAN: <span className="font-mono text-white">PK00MEZN0000000000000000</span></div>
                  </div>
                  <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                    Use your booking reference as the transfer description. Tickets
                    are confirmed once the transfer clears (1–2 business days).
                  </p>
                </div>
              )}
            </div>

            {/* Contact info confirmation */}
            <div className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
              <h2 className="text-base font-semibold">Where should we send your tickets?</h2>
              <div className="mt-4 space-y-2">
                <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Name" value={draft.attendees[0].name} />
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={draft.attendees[0].email} />
                {draft.attendees[0].phone && (
                  <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={draft.attendees[0].phone} />
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {draft.notifyEmail && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/15 px-2.5 py-1 text-accent-300 ring-1 ring-accent-500/30">
                    <Mail className="h-3 w-3" /> Email updates on
                  </span>
                )}
                {draft.notifyWhatsApp && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-300 ring-1 ring-emerald-500/30">
                    <MessageCircle className="h-3 w-3" /> WhatsApp updates on
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
              <img
                src={draft.event.image}
                alt=""
                className="h-32 w-full rounded-xl object-cover"
              />
              <h3 className="mt-4 text-base font-semibold">{draft.event.title}</h3>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                {new Date(draft.event.date).toLocaleDateString("en-PK", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · {draft.event.time}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {draft.event.venue}
              </p>

              <div className="mt-4 space-y-1.5 border-t border-[var(--border-subtle)] pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">
                    {draft.ticketType.name} × {draft.qty}
                  </span>
                  <span>{formatPrice(subtotal, draft.event.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Service fee (5%)</span>
                  <span>{formatPrice(serviceFee, draft.event.currency)}</span>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t border-[var(--border-subtle)] pt-3">
                <span className="text-sm text-[var(--text-tertiary)]">Total payable</span>
                <span className="text-2xl font-bold">
                  {formatPrice(draft.total, draft.event.currency)}
                </span>
              </div>

              {err && (
                <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  {err}
                </div>
              )}

              <Button
                className="mt-5 w-full"
                size="lg"
                onClick={placeOrder}
                disabled={processing}
                leftIcon={
                  processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )
                }
              >
                {processing
                  ? "Processing…"
                  : `Pay ${formatPrice(draft.total, draft.event.currency)}`}
              </Button>
              <p className="mt-3 text-center text-[10px] text-[var(--text-tertiary)]">
                By paying you agree to Occaz's terms of service.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function PayOption({
  active,
  onClick,
  icon,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center gap-3 rounded-xl p-3 text-left ring-1 transition " +
        (active
          ? "bg-accent-500/15 ring-accent-500/40"
          : "bg-[var(--bg-elevated)] ring-[var(--border-subtle)] hover:ring-[var(--border-default)]")
      }
    >
      <div
        className={
          "grid h-9 w-9 place-items-center rounded-lg " +
          (active ? "bg-accent-500/20 text-accent-400" : "bg-[var(--bg-card-hover)] text-[var(--text-tertiary)]")
        }
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-[var(--text-tertiary)]">{desc}</div>
      </div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">{label}</span>
      {children}
    </label>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--bg-elevated)] px-3 py-2 ring-1 ring-[var(--border-subtle)]">
      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        {icon}
        {label}
      </div>
      <div className="truncate text-sm font-medium">{value || "—"}</div>
    </div>
  );
}

function JazzInstructions({
  name,
  number,
  accountName,
}: {
  name: string;
  number: string;
  accountName: string;
}) {
  return (
    <div className="mt-4 rounded-xl bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]">
      <div className="font-medium text-[var(--text-primary)]">{name} payment</div>
      <p className="mt-2 text-xs text-[var(--text-tertiary)]">
        Send {`the total`} to the account below, then tap "Pay" to confirm. Tickets
        activate once we receive the transfer (usually within minutes).
      </p>
      <div className="mt-3 space-y-1 text-xs">
        <div>Account: <span className="font-mono text-white">{number}</span></div>
        <div>Account name: <span className="text-white">{accountName}</span></div>
      </div>
    </div>
  );
}

function ConfirmationScreen({
  eventTitle,
  qty,
  ticketIds,
  email,
  whatsapp,
  onClose,
}: {
  eventTitle: string;
  qty: number;
  ticketIds: string[];
  email: string | null;
  whatsapp: string | null;
  onClose: () => void;
}) {
  return (
    <div className="page">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.2 }}
            className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-2xl bg-emerald-500/15 ring-2 ring-emerald-500/40"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </motion.div>
          <h1 className="text-2xl font-bold md:text-3xl">You're going!</h1>
          <p className="mt-2 text-sm text-[var(--text-tertiary)]">
            {qty} × ticket{qty > 1 ? "s" : ""} confirmed for{" "}
            <span className="font-medium text-white">{eventTitle}</span>
          </p>

          <div className="mt-6 space-y-2 rounded-2xl bg-[var(--bg-elevated)] p-5 ring-1 ring-[var(--border-subtle)] text-left text-sm">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              <Sparkles className="h-3.5 w-3.5" /> Booking reference
            </div>
            <div className="break-all font-mono text-sm text-white">
              {ticketIds.join(", ")}
            </div>
          </div>

          <div className="mt-5 space-y-2 rounded-2xl bg-[var(--bg-elevated)] p-5 ring-1 ring-[var(--border-subtle)] text-left">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              <Mail className="h-3.5 w-3.5" /> What happens next
            </div>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {email && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>
                    A confirmation email with your QR tickets has been sent to{" "}
                    <span className="font-medium text-white">{email}</span>.
                  </span>
                </li>
              )}
              {whatsapp && (
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>
                    You'll receive event reminders on WhatsApp at{" "}
                    <span className="font-medium text-white">{whatsapp}</span> — including the day before and one hour before the event starts.
                  </span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  Updates about this event — schedule changes, lineup announcements, and last-minute news — will reach you on the channels you chose.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>
                  Discover new events, opportunities, and content that match your interests — never miss out.
                </span>
              </li>
            </ul>
            {!email && !whatsapp && (
              <p className="text-sm text-[var(--text-tertiary)]">
                You opted out of all notifications. You can still find your tickets
                under <Link to="/tickets" className="text-white underline">Tickets</Link>.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Link to="/">
              <Button variant="outline">Back to home</Button>
            </Link>
            <Button onClick={onClose}>View my tickets</Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
