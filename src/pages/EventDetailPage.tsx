import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../lib/toast";
import {
  Calendar,
  Clock,
  MapPin,
  Share2,
  Bookmark,
  Users,
  Ticket,
  Building2,
  Star,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { formatDateLong, formatPrice } from "../data/mock";
import { useEvents, useEvent } from "../hooks/useListings";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { CardGrid } from "../components/ui/CardGrid";
import { ImageGallery } from "../components/ui/ImageGallery";
import { EventCard } from "../components/cards/EventCard";
import { SafeImage } from "../components/ui/SafeImage";
import { useSaved } from "../hooks/useSaved";
import { FadeIn, Stagger } from "../components/motion/Motion";
import type { EventListing } from "../data/mock";
import { BookingModal, type BookingDraft } from "../components/booking/BookingModal";

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = useEvent(id || "");
  const events = useEvents();
  const { isEventSaved, toggleEvent } = useSaved();
  const [selectedTicket, setSelectedTicket] = useState(event?.ticketTypes[0]?.id);
  const [bookingOpen, setBookingOpen] = useState(false);

  if (!event) {
    return (
      <div className="page container text-center">
        <h1 className="text-2xl font-semibold">Event not found</h1>
        <Button onClick={() => navigate("/events")} className="mt-4">
          Back to events
        </Button>
      </div>
    );
  }

  const saved = isEventSaved(event.id);
  const related = events
    .filter((e) => e.id !== event.id && e.category === event.category)
    .slice(0, 4);
  const filled = event.capacity > 0
    ? Math.min(100, (event.attendees / event.capacity) * 100)
    : 0;

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative h-[420px] overflow-hidden md:h-[520px]">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <SafeImage
            src={event.image}
            alt={event.title}
            fallbackTitle={event.title}
            className="h-full w-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="container pb-8">
            <Stagger className="mb-4 flex flex-wrap gap-2" stagger={0.08}>
              <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                <Badge tone="accent">{event.category}</Badge>
              </motion.div>
              {event.featured && (
                <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                  <Badge tone="amber">★ Featured</Badge>
                </motion.div>
              )}
              <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                <Badge tone="outline">{event.mode}</Badge>
              </motion.div>
            </Stagger>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="max-w-3xl text-3xl font-bold tracking-tight md:text-5xl"
            >
              {event.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-3 text-base text-[var(--text-secondary)] md:text-lg"
            >
              {formatDateLong(event.date)} · {event.time} · {event.venue}
            </motion.p>
          </div>
        </div>
      </section>

      <div className="container mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {/* Quick facts row */}
          <Stagger className="grid gap-3 rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)] sm:grid-cols-2 md:grid-cols-4">
            {[
              { Icon: Calendar, label: "Date", value: formatDateLong(event.date) },
              { Icon: Clock, label: "Time", value: event.time },
              { Icon: MapPin, label: "Venue", value: event.venue },
              {
                Icon: Users,
                label: "Going",
                value: `${event.attendees.toLocaleString()} / ${event.capacity.toLocaleString()}`,
              },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--bg-card-hover)] ring-1 ring-[var(--border-subtle)]">
                  <Icon className="h-4 w-4 text-accent-400" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">{label}</div>
                  <div className="mt-0.5 text-sm font-medium">{value}</div>
                </div>
              </div>
            ))}
          </Stagger>

          {/* Capacity */}
          <FadeIn delay={0.1} className="mt-6 rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Capacity filling up</span>
              <span className="font-medium">{Math.round(filled)}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-card-hover)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${filled}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className="h-full bg-gradient-to-r from-accent-500 to-pink-500"
              />
            </div>
          </FadeIn>

          {/* Ticket panel — shown ABOVE About/Gallery on mobile, sticky on desktop */}
          <FadeIn delay={0.13} className="mt-6 lg:hidden">
            <TicketPanel
              event={event}
              selectedTicket={selectedTicket}
              setSelectedTicket={setSelectedTicket}
              saved={saved}
              onSave={() => toggleEvent(event.id)}
              onBook={() => setBookingOpen(true)}
            />
          </FadeIn>

          {/* About */}
          <FadeIn delay={0.15} className="mt-10">
            <h2 className="text-xl font-semibold">About this event</h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
              {event.description}
            </p>
          </FadeIn>

          {/* Organizer */}
          <FadeIn delay={0.2} className="mt-10 rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-pink-500 ring-1 ring-[var(--border-default)]">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-[var(--text-tertiary)]">Organized by</div>
                <div className="mt-0.5 text-base font-semibold">{event.organizer}</div>
              </div>
              <button className="rounded-full bg-[var(--bg-card-hover)] px-4 py-2 text-sm ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--bg-card)]">
                Follow
              </button>
            </div>
          </FadeIn>

          {/* Gallery */}
          <FadeIn delay={0.25} className="mt-10">
            <h2 className="text-xl font-semibold">Gallery</h2>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              {event.gallery?.length
                ? "Swipe through images from the event"
                : "More photos coming soon"}
            </p>
            <div className="mt-4">
              <ImageGallery
                images={
                  event.gallery && event.gallery.length
                    ? [event.image, ...event.gallery]
                    : [event.image]
                }
                title={event.title}
              />
            </div>
          </FadeIn>

          {/* Venue */}
          <FadeIn delay={0.28} className="mt-10">
            <h2 className="text-xl font-semibold">Venue & Location</h2>
            <div className="mt-3 overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/${event.id}-map/1200/600`}
                  alt="Map"
                  className="h-full w-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-[var(--bg-card)]/90 p-4 ring-1 ring-[var(--border-default)] backdrop-blur">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent-500/20 ring-1 ring-accent-500/30">
                    <MapPin className="h-5 w-5 text-accent-400" />
                  </div>
                  <div>
                    <div className="font-medium">{event.venue}</div>
                    <div className="text-sm text-[var(--text-secondary)]">{event.city}</div>
                  </div>
                  <button className="ml-auto rounded-full bg-[var(--bg-card-hover)] px-3 py-1.5 text-xs ring-1 ring-[var(--border-subtle)] hover:bg-[var(--bg-card)]">
                    Open in maps
                  </button>
                </div>
              </div>
            </div>
          </FadeIn>

          {related.length > 0 && (
            <div className="mt-14">
              <h2 className="text-xl font-semibold">Related events</h2>
              <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                More {event.category.toLowerCase()} you might love
              </p>
              <div className="mt-6">
                <CardGrid>
                  {related.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </CardGrid>
              </div>
            </div>
          )}
        </div>

        {/* Desktop sticky ticket panel */}
        <FadeIn delay={0.3} className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <TicketPanel
            event={event}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            saved={saved}
            onSave={() => toggleEvent(event.id)}
            onBook={() => setBookingOpen(true)}
          />
        </FadeIn>
      </div>

      <BookingModal
        event={event}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onContinue={(draft: BookingDraft) => {
          setBookingOpen(false);
          navigate("/checkout", { state: { draft } });
        }}
      />
    </div>
  );
}

function TicketPanel({
  event,
  selectedTicket,
  setSelectedTicket,
  saved,
  onSave,
  onBook,
}: {
  event: EventListing;
  selectedTicket: string | undefined;
  setSelectedTicket: (id: string) => void;
  saved: boolean;
  onSave: () => void;
  onBook: () => void;
}) {
  const { push } = useToast();

  async function shareEvent() {
    const url = window.location.href;
    const title = event.title;
    const text = `Check out ${title} on Occaz`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      push("ok", "Link copied to clipboard");
    } catch {
      push("err", "Couldn't copy link — please copy from the address bar");
    }
  }

  function handleBook() {
    if (!event.ticketTypes || event.ticketTypes.length === 0) {
      push(
        "info",
        "Registration is opening soon — we'll notify you when tickets are available.",
      );
      return;
    }
    onBook();
  }
  const ticket = event.ticketTypes.find((t) => t.id === selectedTicket);
  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-[var(--text-tertiary)]">From</span>
        <span className="text-2xl font-bold">
          {formatPrice(event.price, event.currency)}
        </span>
      </div>

      <div className="mt-6">
        <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
          Choose a ticket
        </div>
        <div className="mt-3 space-y-2">
          {event.ticketTypes.map((t) => (
            <motion.label
              key={t.id}
              whileHover={{ x: 2 }}
              className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 transition ${
                selectedTicket === t.id
                  ? "bg-accent-500/15 ring-accent-500/40"
                  : "bg-[var(--bg-elevated)] ring-[var(--border-subtle)] hover:ring-[var(--border-default)]"
              }`}
            >
              <input
                type="radio"
                name="ticket"
                value={t.id}
                checked={selectedTicket === t.id}
                onChange={() => setSelectedTicket(t.id)}
                className="mt-1 accent-accent-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.name}</span>
                  <span className="font-semibold">
                    {formatPrice(t.price, event.currency)}
                  </span>
                </div>
                <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--text-tertiary)]">
                  {t.perks.map((p) => (
                    <li key={p}>· {p}</li>
                  ))}
                </ul>
              </div>
            </motion.label>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<Ticket className="h-4 w-4" />}
          onClick={handleBook}
        >
          Register · {formatPrice(ticket?.price ?? event.price, event.currency)}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="md"
            fullWidth
            leftIcon={<Bookmark className="h-4 w-4" />}
            onClick={onSave}
          >
            {saved ? "Saved" : "Save"}
          </Button>
          <Button
            variant="outline"
            size="md"
            leftIcon={<Share2 className="h-4 w-4" />}
            onClick={shareEvent}
          >
            Share
          </Button>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Star className="h-3.5 w-3.5 text-amber-400" />
          4.8 · 240 reviews
        </div>
      </div>
    </motion.aside>
  );
}
