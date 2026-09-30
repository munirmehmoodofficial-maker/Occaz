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
} from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../lib/auth";
import { formatPrice } from "../../data/mock";
import type { EventListing, TicketType } from "../../data/mock";

export interface BookingDraft {
  event: EventListing;
  ticketType: TicketType;
  qty: number;
  attendees: AttendeeInfo[];
  notifyEmail: boolean;
  notifyWhatsApp: boolean;
  total: number;
}

export interface AttendeeInfo {
  name: string;
  email: string;
  phone: string;
}

interface Props {
  event: EventListing;
  open: boolean;
  onClose: () => void;
  onContinue: (draft: BookingDraft) => void;
}

export function BookingModal({ event, open, onClose, onContinue }: Props) {
  const { user, profile } = useAuth();
  const [ticketTypeId, setTicketTypeId] = useState(event.ticketTypes[0]?.id);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // hydrate from auth user/profile
  useEffect(() => {
    if (!open) return;
    setName((p) => p || profile?.full_name || user?.email?.split("@")[0] || "");
    setEmail((p) => p || user?.email || "");
    setPhone((p) => p || ((user?.user_metadata as any)?.phone ?? ""));
    setErr(null);
  }, [open, profile, user]);

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

  const ticketType = event.ticketTypes.find((t) => t.id === ticketTypeId) ?? event.ticketTypes[0];
  if (!ticketType) return null;

  const subtotal = ticketType.price * qty;
  const serviceFee = Math.round(subtotal * 0.05); // 5%
  const total = subtotal + serviceFee;

  function onSubmit() {
    if (!name.trim()) return setErr("Please enter the primary attendee's name.");
    if (!email.trim() || !/^.+@.+\..+$/.test(email)) return setErr("Please enter a valid email.");
    if (qty > 1) {
      // for multi-ticket we ask the primary attendee only; companions get
      // placeholder names which they can edit later.
    }
    onContinue({
      event,
      ticketType,
      qty,
      attendees: [{ name, email, phone }],
      notifyEmail,
      notifyWhatsApp,
      total,
    });
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
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 top-[5vh] z-[61] max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-2xl md:inset-x-auto md:left-1/2 md:max-w-xl md:-translate-x-1/2"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Book tickets</h2>
                <p className="mt-0.5 text-sm text-[var(--text-tertiary)]">
                  {event.title}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-elevated)] text-[var(--text-tertiary)] transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Ticket type */}
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
                          <span className="font-medium">{t.name}</span>
                          <span className="font-semibold">
                            {formatPrice(t.price, event.currency)}
                          </span>
                        </div>
                        {t.perks.length > 0 && (
                          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--text-tertiary)]">
                            {t.perks.map((p) => (
                              <li key={p}>· {p}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

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
                  className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[var(--bg-card-hover)] disabled:opacity-40"
                  disabled={qty >= 10}
                  aria-label="Increase"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                Maximum 10 tickets per order
              </p>
            </div>

            {/* Attendee info */}
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
                    className="input pl-10"
                  />
                </Field>
                <Field icon={<Mail className="h-4 w-4" />} label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-10"
                  />
                </Field>
                <Field icon={<Phone className="h-4 w-4" />} label="Phone (for WhatsApp)">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="input pl-10"
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
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Service fee (5%)</span>
                <span>{formatPrice(serviceFee, event.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-subtle)] pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(total, event.currency)}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onSubmit} leftIcon={<Ticket className="h-4 w-4" />}>
                Continue to checkout
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
    <label className="block">
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
