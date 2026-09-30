import { Badge } from "../components/ui/Badge";
import { Calendar, MapPin, Ticket as TicketIcon } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { useEvents } from "../hooks/useListings";
import type { EventListing } from "../data/mock";
import { formatDateLong } from "../data/mock";

interface UserTicket {
  id: string;
  event_id: string;
  status: string;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  created_at: string;
}

export function TicketsPage() {
  const { user } = useAuth();
  const events = useEvents();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [rows, setRows] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("registrations")
        .select("id, event_id, status, attendee_name, attendee_email, attendee_phone, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!alive) return;
      if (!error && data) setRows(data as UserTicket[]);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);
  const list = rows
    .map((r) => {
      const ev = events.find((e) => e.id === r.event_id);
      return ev ? { ticket: r, event: ev } : null;
    })
    .filter((x): x is { ticket: UserTicket; event: EventListing } => !!x)
    .filter(({ event }) =>
      tab === "upcoming" ? event.date >= today : event.date < today,
    );

  return (
    <div className="page">
      <div className="container">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Your Tickets
          </h1>
          <p className="mt-2 text-sm text-[var(--text-primary)]/60 md:text-base">
            Access QR codes for upcoming events and revisit past experiences.
          </p>
        </header>

        <div className="mb-6 flex gap-2 rounded-full bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)] w-fit">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "rounded-full px-5 py-2 text-sm font-medium capitalize transition",
                tab === t
                  ? "bg-white text-black"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl bg-[var(--bg-card)] p-12 text-center ring-1 ring-[var(--border-subtle)]">
            <p className="text-[var(--text-tertiary)]">Loading your tickets…</p>
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl bg-[var(--bg-card)] p-12 text-center ring-1 ring-[var(--border-subtle)]">
            <TicketIcon className="mx-auto h-10 w-10 text-[var(--text-disabled)]" />
            <p className="mt-4 text-[var(--text-tertiary)]">
              {tab === "upcoming"
                ? "No upcoming tickets yet. Book one from an event page."
                : "No past tickets."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {list.map(({ ticket, event }) => {
              const type = event.ticketTypes.find(
                (tt) => tt.id === "standard",
              );
              return (
                <div
                  key={ticket.id}
                  className="group overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)] transition hover:ring-[var(--border-default)]"
                >
                  <div className="grid sm:grid-cols-[1fr_auto]">
                    <Link
                      to={`/events/${event.id}`}
                      className="relative aspect-[16/9] sm:aspect-auto"
                    >
                      <img
                        src={event.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg-card/80 hidden sm:block" />
                    </Link>

                    <div className="relative -mt-12 flex flex-col gap-3 p-5 sm:mt-0 sm:ml-[-60px] sm:bg-[var(--bg-card)] sm:p-6">
                      <Badge tone={tab === "upcoming" ? "emerald" : "default"}>
                        {tab === "upcoming" ? "Upcoming" : "Past"}
                      </Badge>
                      <Link to={`/events/${event.id}`}>
                        <h3 className="line-clamp-2 text-base font-semibold transition hover:text-accent-400">
                          {event.title}
                        </h3>
                      </Link>
                      <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                          {formatDateLong(event.date)} · {event.time}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                          <span className="line-clamp-1">
                            {event.location || event.city}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {type?.name ?? "Standard"} ·{" "}
                          {(type?.price ?? 0) === 0
                            ? "Free"
                            : `$${type?.price}`}
                        </span>
                        <span className="font-mono text-xs text-[var(--text-tertiary)]">
                          {ticket.id.slice(0, 12).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-white/10 bg-[var(--bg-elevated)]/50 p-5">
                    <div className="flex items-center gap-4">
                      <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-white p-2">
                        <QrPlaceholder seed={ticket.id} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                          Scan at entry
                        </div>
                        <div className="mt-1 font-mono text-sm text-[var(--text-secondary)]">
                          {ticket.id}
                        </div>
                        {tab === "upcoming" && (
                          <div className="mt-2 text-xs text-[var(--text-tertiary)]">
                            Show this code at the venue entrance
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function QrPlaceholder({ seed }: { seed: string }) {
  const cells = 9;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const rng = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return (h & 0xff) / 0xff;
  };
  return (
    <div className="grid h-full w-full grid-cols-9 gap-px">
      {Array.from({ length: cells * cells }).map((_, i) => {
        const r = Math.floor(i / cells);
        const c = i % cells;
        const corner =
          (r < 3 && c < 3) ||
          (r < 3 && c > cells - 4) ||
          (r > cells - 4 && c < 3);
        const filled = corner
          ? r === 1 || c === 1 || r === cells - 2 || c === cells - 2 ||
            (r === 0 && c === 0) ||
            (r === 0 && c === cells - 1) ||
            (r === cells - 1 && c === 0)
          : rng() > 0.55;
        return (
          <div
            key={i}
            className={filled ? "bg-black" : "bg-white"}
            style={{ borderRadius: 1 }}
          />
        );
      })}
    </div>
  );
}
