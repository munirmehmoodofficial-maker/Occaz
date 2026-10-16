import { useEffect, useState } from "react";
import { HelpCircle, Send, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../lib/toast";

/**
 * Section 11 — Support & Help Centre
 * Real data: support_tickets table.
 */
export function Section11Support() {
  const { user } = useAuth();
  const { push } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("id, subject, body, category, status, priority, admin_reply, created_at, replied_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setTickets(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  async function submit() {
    if (!user) return;
    if (!subject.trim() || !body.trim()) {
      push({ tone: "red", title: "Missing fields", message: "Subject and body required." });
      return;
    }
    setSubmitting(true);
    const id = `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("support_tickets").insert({
      id,
      user_id: user.id,
      organizer_id: user.id,
      category,
      subject: subject.trim(),
      body: body.trim(),
      status: "open",
      priority: "normal",
    });
    setSubmitting(false);
    if (error) {
      push({ tone: "red", title: "Failed", message: error.message });
      return;
    }
    setTickets((t) => [
      { id, category, subject, body, status: "open", priority: "normal", created_at: new Date().toISOString() },
      ...t,
    ]);
    setSubject("");
    setBody("");
    push({ tone: "green", title: "Ticket submitted", message: "We'll get back to you soon." });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Support & help</h2>
        <p className="text-xs text-zinc-500">
          Submit a ticket, report an issue, or read FAQs
        </p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <h3 className="text-sm font-bold text-white">New ticket</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Category
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              <option value="general">General</option>
              <option value="payment">Payment problem</option>
              <option value="event_issue">Event issue</option>
              <option value="bug">Bug</option>
              <option value="fraud">Fraud</option>
            </select>
          </label>
          <label className="block">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Subject
            </div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
              placeholder="What's the issue?"
            />
          </label>
          <label className="block sm:col-span-2">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Description
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="input"
              placeholder="Tell us more…"
            />
          </label>
        </div>
        <button
          onClick={submit}
          disabled={submitting}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <h3 className="text-sm font-bold text-white">Your tickets</h3>
        {loading ? (
          <div className="mt-3 text-sm text-zinc-500">Loading…</div>
        ) : tickets.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-500">
            No tickets yet. Need help? Submit one above.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="rounded-lg bg-white/[0.02] p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                      (t.status === "open"
                        ? "bg-amber-500/15 text-amber-300"
                        : t.status === "resolved"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-zinc-500/15 text-zinc-300")
                    }
                  >
                    {t.status}
                  </span>
                  <div className="text-sm font-semibold text-white">
                    {t.subject}
                  </div>
                  <span className="ml-auto text-[10px] text-zinc-500">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{t.body}</p>
                {t.admin_reply && (
                  <div className="mt-2 rounded-lg border border-pink-500/20 bg-pink-500/5 p-2 text-xs text-pink-200">
                    <div className="flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3 w-3" /> Support replied
                    </div>
                    <p className="mt-0.5">{t.admin_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <h3 className="text-sm font-bold text-white">FAQs</h3>
        <div className="mt-3 space-y-2 text-sm text-zinc-400">
          <details className="rounded-lg bg-white/[0.02] p-3">
            <summary className="cursor-pointer font-semibold text-white">
              How do I get paid?
            </summary>
            <p className="mt-2 text-xs">
              We hold ticket revenue until your event is over, then transfer
              the net amount (after platform commission) to your registered
              bank / JazzCash / Easypaisa account within 3-5 business days.
            </p>
          </details>
          <details className="rounded-lg bg-white/[0.02] p-3">
            <summary className="cursor-pointer font-semibold text-white">
              How do refunds work?
            </summary>
            <p className="mt-2 text-xs">
              You can refund a registration from the Tickets & Orders
              section. Refunds are processed back to the original payment
              method within 5-7 business days.
            </p>
          </details>
          <details className="rounded-lg bg-white/[0.02] p-3">
            <summary className="cursor-pointer font-semibold text-white">
              When does my event go live?
            </summary>
            <p className="mt-2 text-xs">
              Once you mark an event as Published, it's instantly visible to
              attendees. Featured placement requires an active Pro or
              Business plan.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
