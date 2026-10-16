import { ScanLine, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

/**
 * Section 4 — Check-in & Entry Management
 * Live count + check-in history.
 */
export function Section4Checkin() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    live: 0,
  });
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [events, setEvents] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: regs } = await supabase
        .from("registrations")
        .select("id, attendee_name, ticket_code, event_id, check_in_at, check_in_by")
        .eq("organizer_id", user.id);
      const list = regs ?? [];
      const today = new Date().toISOString().slice(0, 10);
      setStats({
        total: list.length,
        checkedIn: list.filter((r: any) => r.check_in_at).length,
        live: list.filter((r: any) => r.check_in_at && r.check_in_at.slice(0, 10) === today).length,
      });
      setRecentCheckins(
        list
          .filter((r: any) => r.check_in_at)
          .sort((a: any, b: any) => (b.check_in_at > a.check_in_at ? 1 : -1))
          .slice(0, 20),
      );
      const { data: evs } = await supabase
        .from("events")
        .select("id, title")
        .eq("organizer_id", user.id);
      const map: Record<string, any> = {};
      (evs ?? []).forEach((e) => (map[e.id] = e));
      setEvents(map);
    })();
  }, [user]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Check-in & entry</h2>
        <p className="text-xs text-zinc-500">
          Scan QR codes and track live attendance at your events
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          Icon={ScanLine}
          label="Issued tickets"
          value={stats.total}
          tone="violet"
        />
        <Stat
          Icon={CheckCircle2}
          label="Total checked in"
          value={stats.checkedIn}
          tone="emerald"
        />
        <Stat
          Icon={CheckCircle2}
          label="Checked in today"
          value={stats.live}
          tone="pink"
        />
      </div>

      <div className="rounded-2xl border border-dashed border-white/10 bg-[var(--bg-card)] p-8 text-center">
        <ScanLine className="mx-auto h-12 w-12 text-zinc-600" />
        <h3 className="mt-3 text-base font-semibold text-white">
          QR scanner coming up
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
          Use your phone or laptop camera to scan attendee QR codes.
          Real-time validation, duplicate detection, and live count.
        </p>
      </div>

      {recentCheckins.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
          <h3 className="text-sm font-bold text-white">Recent check-ins</h3>
          <div className="mt-3 space-y-1.5">
            {recentCheckins.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-2.5"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {r.attendee_name ?? "—"}
                  </div>
                  <div className="truncate text-[10px] text-zinc-500">
                    {events[r.event_id]?.title ?? r.event_id} · {r.ticket_code}
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500">
                  {r.check_in_at
                    ? new Date(r.check_in_at).toLocaleTimeString()
                    : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ Icon, label, value, tone }: any) {
  const tones: Record<string, string> = {
    violet: "from-violet-500/20 text-violet-300",
    emerald: "from-emerald-500/20 text-emerald-300",
    pink: "from-pink-500/20 text-pink-300",
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
        </div>
        <div className={"grid h-9 w-9 place-items-center rounded-xl bg-white/5 " + tones[tone].split(" ").pop()}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
