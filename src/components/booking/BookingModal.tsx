import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Minus,
  User as UserIcon,
  Mail,
  Phone,
  MessageCircle,
  Ticket,
  CreditCard,
  Building2,
  Copy,
  Upload,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../lib/auth";
import { formatPrice } from "../../data/mock";
import type { EventListing, TicketType } from "../../data/mock";
import { supabase } from "../../lib/supabase";
import { uploadPublicImage } from "../../lib/storage";
import { useToast } from "../../lib/toast.tsx";

export interface BookingDraft {
  event: EventListing;
  ticketType: TicketType;
  qty: number;
  attendees: AttendeeInfo[];
  notifyEmail: boolean;
  notifyWhatsApp: boolean;
  total: number;
  paymentMethod: "card" | "manual";
}

export interface AttendeeInfo {
  name: string;
  email: string;
  phone: string;
}

interface PaymentSetting {
  id: string;
  scope: string;
  target_id: string | null;
  account_title: string;
  account_number: string;
  bank_name: string | null;
  instructions: string | null;
  active: boolean;
}

interface Props {
  event: EventListing;
  open: boolean;
  onClose: () => void;
  onContinue: (draft: BookingDraft) => void;
}

export function BookingModal({ event, open, onClose, onContinue }: Props) {
  const { user, profile } = useAuth();
  const { push } = useToast();
  const [ticketTypeId, setTicketTypeId] = useState(event.ticketTypes[0]?.id);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "manual">("card");
  const [manualPayment, setManualPayment] = useState<PaymentSetting | null>(null);
  const [manualTxRef, setManualTxRef] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isFree = (event.price ?? 0) === 0 && (!event.ticketTypes || event.ticketTypes.length === 0);

  // hydrate from auth user/profile
  useEffect(() => {
    if (!open) return;
    setName((p) => p || profile?.full_name || user?.email?.split("@")[0] || "");
    setEmail((p) => p || user?.email || "");
    setPhone((p) => p || ((user?.user_metadata as any)?.phone ?? ""));
    setErr(null);
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setManualTxRef("");
    setManualNotes("");
    setPaymentMethod(isFree ? "card" : "card");
  }, [open, profile, user, isFree]);

  // Load manual payment setting when method switches
  useEffect(() => {
    if (paymentMethod !== "manual" || !open) return;
    let alive = true;
    (async () => {
      // Try event-specific first, then fall back to global
      const tryFetch = async (scope: "event" | "global", id: string | null) => {
        let q = supabase.from("payment_settings").select("*").eq("active", true);
        if (scope === "event" && id) {
          q = q.eq("scope", "event").eq("target_id", id);
        } else {
          q = q.eq("scope", "global");
        }
        q = q.limit(1);
        return q.maybeSingle();
      };
      const ev = await tryFetch("event", event.id);
      const setting = ev.data ?? (await tryFetch("global", null)).data;
      if (alive) setManualPayment((setting as PaymentSetting) ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [paymentMethod, open, event.id]);

  // esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // lock body scroll
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const ticketType =
    event.ticketTypes.find((t) => t.id === ticketTypeId) ??
    event.ticketTypes[0] ?? {
      id: "_general",
      name: "General Admission",
      price: event.price,
      currency: event.currency,
    };
  if (!ticketType) return null;

  const subtotal = ticketType.price * qty;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  function onSubmit() {
    if (!name.trim()) return setErr("Please enter the primary attendee's name.");
    if (!email.trim() || !/^.+@.+\..+$/.test(email)) return setErr("Please enter a valid email.");
    onContinue({
      event,
      ticketType,
      qty,
      attendees: [{ name, email, phone }],
      notifyEmail,
      notifyWhatsApp,
      total,
      paymentMethod: isFree ? "card" : paymentMethod,
    });
  }

  async function onSubmitManual() {
    if (!name.trim()) return setErr("Please enter the primary attendee's name.");
    if (!email.trim() || !/^.+@.+\..+$/.test(email)) return setErr("Please enter a valid email.");
    if (!manualPayment) {
      setErr("No payment method configured. Please contact the organizer or try card payment.");
      return;
    }
    if (!screenshotFile) {
      setErr("Please upload a screenshot of your payment.");
      return;
    }
    if (!user) {
      setErr("Please sign in to complete manual payment.");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Upload screenshot
      setUploading(true);
      const up = await uploadPublicImage(screenshotFile, "payment-screenshots");
      if (!up || !up.url) {
        throw new Error("Screenshot upload failed");
      }
      setUploading(false);

      // 2. Create registration row (status = pending_verification)
      const regId = "reg-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
      const ticketCode = "OCC-" + regId.slice(-6).toUpperCase();
      // user.id from Supabase auth is a UUID string — but if it's somehow
      // a placeholder (e.g. for guest checkouts), we'll store null instead
      // so the foreign key / type check doesn't fail.
      const userId = user?.id && /^[0-9a-f-]{36}$/i.test(user.id) ? user.id : null;

      // Try the canonical column names first; if the table has different
      // column types (e.g. id is uuid not text), fall back gracefully.
      // We try up to 3 variants to handle schema mismatches:
      //   1. Full payload with our custom id
      //   2. Without our custom id (DB generates uuid)
      //   3. With event_id as text (events table has text ids)
      const basePayload: any = {
        attendee_name: name,
        attendee_email: email,
        attendee_phone: phone || null,
        qty: 1,
        total: subtotal,
        currency: event.currency || "PKR",
        status: "pending_verification",
        ticket_code: ticketCode,
        user_id: userId,
        event_id: event.id,
      };
      const attempts = [
        { ...basePayload, id: regId },
        { ...basePayload, id: undefined },
        { ...basePayload, id: undefined, event_id: String(event.id) },
      ];
      let regErr: any = null;
      for (let i = 0; i < attempts.length; i++) {
        const attempt = attempts[i];
        try {
          // strip undefined keys so they don't get sent
          const payload = Object.fromEntries(
            Object.entries(attempt).filter(([_, v]) => v !== undefined),
          );
          const res = await supabase.from("registrations").insert(payload);
          if (!res.error) {
            regErr = null;
            break;
          }
          regErr = res.error;
          // If it's not a uuid type error, no point trying again
          const msg = String(res.error.message || "");
          if (!msg.includes("invalid input syntax for type uuid")) {
            break;
          }
        } catch (e: any) {
          regErr = e;
        }
      }
      if (regErr) {
        throw new Error(`Registration failed: ${regErr.message || regErr}`);
      }
      if (regErr) {
        console.warn("Registration insert failed:", regErr);
        throw new Error(`Failed to create registration: ${regErr.message}`);
      }

      // 3. Create payment_submissions row.
      // registration_id might be a text or uuid column depending on schema.
      // Try with our regId first; if that fails because the column is uuid,
      // let it be null (the submission is still useful on its own).
      const subPayload: any = {
        user_id: userId,
        event_id: event.id,
        amount: total,
        currency: event.currency || "PKR",
        screenshot_url: up.url,
        transaction_ref: manualTxRef.trim() || null,
        notes: manualNotes.trim() || null,
        status: "pending",
      };
      const subAttempts = [
        { ...subPayload, registration_id: regId },
        { ...subPayload, registration_id: null },
      ];
      let subErr: any = null;
      for (const attempt of subAttempts) {
        const payload = Object.fromEntries(
          Object.entries(attempt).filter(([_, v]) => v !== undefined),
        );
        const res = await supabase.from("payment_submissions").insert(payload);
        if (!res.error) {
          subErr = null;
          break;
        }
        subErr = res.error;
        const msg = String(res.error.message || "");
        if (!msg.includes("invalid input syntax for type uuid")) break;
      }
      if (subErr) throw new Error(subErr.message);

      push("ok", "Payment proof submitted! We'll review and confirm within a few hours.");
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  function onPickFile(f: File | null) {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      setErr("Screenshot must be under 8MB");
      return;
    }
    if (!f.type.startsWith("image/")) {
      setErr("Please choose an image file");
      return;
    }
    setErr(null);
    setScreenshotFile(f);
    const url = URL.createObjectURL(f);
    setScreenshotPreview(url);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 m-auto max-h-[92vh] w-[min(560px,calc(100vw-24px))] overflow-y-auto rounded-3xl bg-[var(--bg-elevated)] p-6 shadow-2xl ring-1 ring-[var(--border-default)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {paymentMethod === "manual" ? "Pay manually" : "Book your spot"}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                  {event.title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--bg-card-hover)] hover:bg-[var(--bg-card)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Ticket type */}
            {event.ticketTypes && event.ticketTypes.length > 0 && (
              <div className="mt-5">
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Ticket type
                </div>
                <div className="mt-2 space-y-2">
                  {event.ticketTypes.map((t) => {
                    const active = t.id === ticketTypeId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTicketTypeId(t.id)}
                        className={
                          "flex w-full items-start gap-3 rounded-xl p-3 text-left ring-1 transition " +
                          (active
                            ? "bg-accent-500/15 ring-accent-500/40"
                            : "bg-[var(--bg-elevated)] ring-[var(--border-subtle)] hover:ring-[var(--border-default)]")
                        }
                      >
                        <div
                          className={
                            "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ring-1 " +
                            (active ? "bg-accent-500 ring-accent-500" : "ring-[var(--border-default)]")
                          }
                        >
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{t.name}</span>
                            <span className="text-sm font-semibold">
                              {formatPrice(t.price, event.currency)}
                            </span>
                          </div>
                          {t.description && (
                            <div className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                              {t.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-5">
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Number of tickets
              </div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--bg-elevated)] p-1 ring-1 ring-[var(--border-subtle)]">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[var(--bg-card-hover)] disabled:opacity-40"
                  disabled={qty <= 1}
                  aria-label="Decrease"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-base font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[var(--bg-card-hover)]"
                  aria-label="Increase"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Primary attendee */}
            <div className="mt-5">
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Primary attendee
              </div>
              <div className="mt-2 space-y-2">
                <Field icon={<UserIcon className="h-4 w-4" />} label="Full name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="input pl-10 w-full min-w-0"
                  />
                </Field>
                <Field icon={<Mail className="h-4 w-4" />} label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-10 w-full min-w-0"
                  />
                </Field>
                <Field icon={<Phone className="h-4 w-4" />} label="Phone (for WhatsApp)">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="input pl-10 w-full min-w-0"
                  />
                </Field>
              </div>
            </div>

            {/* Notification prefs */}
            <div className="mt-5 rounded-xl bg-[var(--bg-elevated)] p-4 ring-1 ring-[var(--border-subtle)]">
              <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Send me updates about this event via
              </div>
              <div className="mt-3 space-y-2">
                <Toggle
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  desc="Ticket confirmation, event reminders, organizer updates"
                  on={notifyEmail}
                  onChange={setNotifyEmail}
                />
                <Toggle
                  icon={<MessageCircle className="h-4 w-4" />}
                  label="WhatsApp"
                  desc="SMS-style updates, day-of reminders, last-minute changes"
                  on={notifyWhatsApp}
                  onChange={setNotifyWhatsApp}
                  disabled={!phone}
                />
                {!phone && (
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Add a phone number above to enable WhatsApp notifications.
                  </p>
                )}
              </div>
            </div>

            {/* Payment method chooser (only if paid) */}
            {!isFree && (
              <div className="mt-5">
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Payment method
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={
                      "flex items-center gap-3 rounded-xl p-3 text-left ring-1 transition " +
                      (paymentMethod === "card"
                        ? "bg-accent-500/15 ring-accent-500/40"
                        : "bg-[var(--bg-elevated)] ring-[var(--border-subtle)] hover:ring-[var(--border-default)]")
                    }
                  >
                    <CreditCard className="h-5 w-5 text-accent-400" />
                    <div>
                      <div className="text-sm font-medium">Pay with card</div>
                      <div className="text-xs text-[var(--text-tertiary)]">Stripe, jazzcash</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("manual")}
                    className={
                      "flex items-center gap-3 rounded-xl p-3 text-left ring-1 transition " +
                      (paymentMethod === "manual"
                        ? "bg-accent-500/15 ring-accent-500/40"
                        : "bg-[var(--bg-elevated)] ring-[var(--border-subtle)] hover:ring-[var(--border-default)]")
                    }
                  >
                    <Building2 className="h-5 w-5 text-pink-400" />
                    <div>
                      <div className="text-sm font-medium">Pay manually</div>
                      <div className="text-xs text-[var(--text-tertiary)]">Bank / JazzCash</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Manual payment panel */}
            {paymentMethod === "manual" && !isFree && (
              <ManualPaymentPanel
                setting={manualPayment}
                screenshotPreview={screenshotPreview}
                txRef={manualTxRef}
                setTxRef={setManualTxRef}
                notes={manualNotes}
                setNotes={setManualNotes}
                onPickFile={onPickFile}
                uploading={uploading}
              />
            )}

            {err && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {err}
              </div>
            )}

            {/* Totals */}
            <div className="mt-5 space-y-1.5 rounded-xl bg-[var(--bg-elevated)] p-4 ring-1 ring-[var(--border-subtle)] text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">
                  {formatPrice(ticketType.price, event.currency)} × {qty}
                </span>
                <span>{formatPrice(subtotal, event.currency)}</span>
              </div>
              {paymentMethod === "card" && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-tertiary)]">Service fee (5%)</span>
                  <span>{formatPrice(serviceFee, event.currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[var(--border-subtle)] pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(paymentMethod === "manual" ? subtotal : total, event.currency)}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {paymentMethod === "manual" && !isFree ? (
                <Button
                  onClick={onSubmitManual}
                  disabled={submitting || uploading}
                  leftIcon={
                    submitting || uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )
                  }
                >
                  {uploading ? "Uploading…" : submitting ? "Submitting…" : "Submit payment proof"}
                </Button>
              ) : (
                <Button onClick={onSubmit} leftIcon={<Ticket className="h-4 w-4" />}>
                  {isFree ? "Confirm registration" : "Continue to checkout"}
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ManualPaymentPanel({
  setting,
  screenshotPreview,
  txRef,
  setTxRef,
  notes,
  setNotes,
  onPickFile,
  uploading,
}: {
  setting: PaymentSetting | null;
  screenshotPreview: string | null;
  txRef: string;
  setTxRef: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  onPickFile: (f: File | null) => void;
  uploading: boolean;
}) {
  if (!setting) {
    return (
      <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
        No payment method is configured for this event yet. Please contact the organizer or try
        "Pay with card" instead.
      </div>
    );
  }
  return (
    <div className="mt-5 space-y-3 rounded-xl bg-[var(--bg-elevated)] p-4 ring-1 ring-[var(--border-subtle)]">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-500/15 text-accent-400">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{setting.account_title}</div>
          <div className="text-xs text-[var(--text-tertiary)]">
            {setting.bank_name ? `${setting.bank_name} · ` : ""}
            <span className="font-mono">{setting.account_number}</span>
            <CopyButton text={setting.account_number} />
          </div>
        </div>
      </div>

      {setting.instructions && (
        <p className="rounded-lg bg-[var(--bg-card)] p-3 text-xs leading-relaxed text-[var(--text-tertiary)]">
          {setting.instructions}
        </p>
      )}

      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
          Screenshot of payment
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[var(--border-default)] p-3 hover:border-accent-500/40">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          {screenshotPreview ? (
            <img
              src={screenshotPreview}
              alt="Screenshot preview"
              className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-[var(--border-default)]"
            />
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--bg-card)] text-[var(--text-tertiary)]">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">
              {screenshotPreview ? "Replace screenshot" : "Upload screenshot"}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              PNG, JPG, WebP up to 8MB
            </div>
          </div>
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
        </label>
      </div>

      <Field icon={<span className="text-xs font-mono">#</span>} label="Transaction reference (optional)">
        <input
          value={txRef}
          onChange={(e) => setTxRef(e.target.value)}
          placeholder="e.g. Txn ID from JazzCash"
          className="input pl-10 w-full min-w-0"
        />
      </Field>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
          Notes (optional)
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Anything the organizer should know"
          className="input min-h-[60px] w-full min-w-0"
        />
      </label>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const { push } = useToast();
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        push("ok", "Copied");
      }}
      className="ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-accent-400 hover:bg-accent-500/10"
      type="button"
    >
      <Copy className="h-3 w-3" /> Copy
    </button>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
          {icon}
        </span>
        {children}
      </div>
    </label>
  );
}

function Toggle({
  icon,
  label,
  desc,
  on,
  onChange,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className={
        "flex w-full items-center justify-between gap-3 rounded-lg p-2 text-left transition disabled:opacity-50 " +
        (on ? "bg-accent-500/10" : "hover:bg-[var(--bg-card-hover)]")
      }
    >
      <div className="flex items-center gap-3">
        <div
          className={
            "grid h-8 w-8 place-items-center rounded-lg " +
            (on
              ? "bg-accent-500/20 text-accent-400"
              : "bg-[var(--bg-card-hover)] text-[var(--text-tertiary)]")
          }
        >
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-[var(--text-tertiary)]">{desc}</div>
        </div>
      </div>
      <div
        className={
          "relative h-5 w-9 rounded-full transition " +
          (on ? "bg-accent-500" : "bg-[var(--bg-card-hover)]")
        }
      >
        <span
          className={
            "absolute top-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition " +
            (on ? "left-[18px]" : "left-0.5")
          }
        />
      </div>
    </button>
  );
}
