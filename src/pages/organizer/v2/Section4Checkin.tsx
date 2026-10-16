import { ScanLine, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../lib/toast";

/**
 * Section 4 — Check-in & Entry Management
 * Manual check-in by ticket code + QR scanner (uses camera, falls back
 * to manual entry on devices without camera).
 */
export function Section4Checkin() {
  const { user } = useAuth();
  const { push } = useToast();
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, live: 0 });
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [events, setEvents] = useState<Record<string, any>>({});
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<null | { ok: boolean; msg: string; code?: string }>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    if (!user) return;
    const { data: regs } = await supabase
      .from("registrations")
      .select("id, attendee_name, ticket_code, event_id, check_in_at, check_in_by, payment_status")
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
  }

  useEffect(() => {
    refresh();
  }, [user]);

  async function checkInByCode(code: string) {
    if (!code.trim()) return;
    setBusy(true);
    setLastResult(null);
    const trimmed = code.trim();
    const { data: reg, error } = await supabase
      .from("registrations")
      .select("id, attendee_name, ticket_code, event_id, check_in_at, payment_status, status")
      .eq("ticket_code", trimmed)
      .maybeSingle();
    if (error || !reg) {
      setBusy(false);
      setLastResult({ ok: false, msg: "No ticket found for that code." });
      push({ tone: "red", title: "Not found", message: "No ticket matches that code." });
      return;
    }
    // Verify this ticket belongs to one of the organizer's events
    if (!events[reg.event_id]) {
      setBusy(false);
      setLastResult({ ok: false, msg: "Ticket does not belong to your events." });
      push({ tone: "red", title: "Wrong organizer", message: "Ticket is for another organizer's event." });
      return;
    }
    if (reg.check_in_at) {
      setBusy(false);
      setLastResult({ ok: false, msg: `Already checked in ${new Date(reg.check_in_at).toLocaleString()}`, code: trimmed });
      push({ tone: "amber", title: "Already used", message: `${reg.attendee_name ?? "Attendee"} already checked in.` });
      return;
    }
    if (reg.payment_status === "refunded" || reg.status === "cancelled") {
      setBusy(false);
      setLastResult({ ok: false, msg: "Ticket refunded or cancelled." });
      push({ tone: "red", title: "Invalid ticket", message: "Refunded or cancelled." });
      return;
    }
    const { error: upErr } = await supabase
      .from("registrations")
      .update({ check_in_at: new Date().toISOString(), check_in_by: user!.id })
      .eq("id", reg.id);
    setBusy(false);
    if (upErr) {
      setLastResult({ ok: false, msg: upErr.message });
      push({ tone: "red", title: "Failed", message: upErr.message });
      return;
    }
    setLastResult({ ok: true, msg: `${reg.attendee_name ?? "Attendee"} — welcome!`, code: trimmed });
    push({
      tone: "green",
      title: "Checked in",
      message: `${reg.attendee_name ?? "Attendee"} · ${events[reg.event_id]?.title ?? ""}`,
    });
    setManualCode("");
    inputRef.current?.focus();
    refresh();
  }

  function onSubmitManual(e: React.FormEvent) {
    e.preventDefault();
    checkInByCode(manualCode);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Check-in & entry</h2>
        <p className="text-xs text-zinc-500">
          Scan QR codes or enter ticket codes to check attendees in
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat Icon={ScanLine} label="Issued tickets" value={stats.total} tone="violet" />
        <Stat Icon={CheckCircle2} label="Total checked in" value={stats.checkedIn} tone="emerald" />
        <Stat Icon={CheckCircle2} label="Checked in today" value={stats.live} tone="pink" />
      </div>

      {/* Manual entry — works for all devices, no camera needed */}
      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <h3 className="text-sm font-bold text-white">Manual check-in</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Type or paste the ticket code shown on the attendee's QR / confirmation
        </p>
        <form onSubmit={onSubmitManual} className="mt-3 flex gap-2">
          <input
            ref={inputRef}
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="OCC-XXXXXX"
            className="input flex-1 font-mono"
            autoFocus
            autoComplete="off"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !manualCode.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Check in
          </button>
        </form>
        {lastResult && (
          <div
            className={
              "mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm " +
              (lastResult.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-200")
            }
          >
            {lastResult.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div>
              <div className="font-semibold">
                {lastResult.ok ? "Welcome!" : "Cannot check in"}
              </div>
              <div className="text-xs opacity-90">{lastResult.msg}</div>
            </div>
          </div>
        )}
      </div>

      {/* QR scanner placeholder — full camera scanner in next build */}
      <div className="rounded-2xl border border-dashed border-white/10 bg-[var(--bg-card)] p-6 text-center">
        <ScanLine className="mx-auto h-10 w-10 text-zinc-600" />
        <h3 className="mt-3 text-base font-semibold text-white">
          Camera QR scanner
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
          Manual entry above works for any device. The camera-based scanner
          (using your device camera to read QR codes) is on the way.
        </p>
        <p className="mt-2 text-[10px] text-zinc-600">
          For now, ask attendees to show their ticket code from the email
          confirmation, then type it in the field above.
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
