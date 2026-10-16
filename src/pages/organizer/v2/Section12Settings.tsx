import { useEffect, useState } from "react";
import { Settings, Lock, LogOut, Bell } from "lucide-react";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../lib/toast";
import { useNavigate } from "react-router-dom";

/**
 * Section 12 — Settings & Notifications
 * Change password, manage notifications, sign out.
 */
export function Section12Settings() {
  const { user, signOut } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    email_orders: true,
    email_payouts: true,
    email_marketing: false,
  });
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    // Load notification preferences from profile.preferences
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .maybeSingle();
      const p = (data as any)?.preferences;
      if (p?.notifications !== undefined) {
        setNotifPrefs((cur) => ({
          ...cur,
          email_marketing: !!p.newsletter,
        }));
      }
      // List sessions (we only have the current one, so show 1)
      const { data: s } = await supabase
        .from("login_sessions")
        .select("id, ip, user_agent, last_active_at, created_at")
        .eq("user_id", user.id)
        .order("last_active_at", { ascending: false });
      setSessions(s ?? []);
    })();
  }, [user]);

  async function changePassword() {
    if (pw.length < 6) {
      push({ tone: "red", title: "Too short", message: "At least 6 characters." });
      return;
    }
    if (pw !== pw2) {
      push({ tone: "red", title: "Mismatch", message: "Passwords don't match." });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) {
      push({ tone: "red", title: "Failed", message: error.message });
      return;
    }
    setPw("");
    setPw2("");
    push({ tone: "green", title: "Password updated", message: "Use it next time you sign in." });
  }

  async function saveNotif() {
    const { error } = await supabase
      .from("profiles")
      .update({
        preferences: {
          notifications: notifPrefs.email_orders,
          newsletter: notifPrefs.email_marketing,
        },
      })
      .eq("id", user!.id);
    if (error) {
      push({ tone: "red", title: "Failed", message: error.message });
      return;
    }
    push({ tone: "green", title: "Saved", message: "Notification preferences updated." });
  }

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Settings</h2>
        <p className="text-xs text-zinc-500">
          Account security, notifications, and sessions
        </p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-pink-300" />
          <h3 className="text-sm font-bold text-white">Change password</h3>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              New password
            </div>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="input"
              placeholder="6+ characters"
            />
          </label>
          <label className="block">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Confirm
            </div>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="input"
              placeholder="Type it again"
            />
          </label>
        </div>
        <button
          onClick={changePassword}
          disabled={saving}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-pink-300" />
          <h3 className="text-sm font-bold text-white">Notification preferences</h3>
        </div>
        <div className="mt-3 space-y-2">
          <Toggle
            label="Order alerts"
            desc="Email me when a new ticket is sold"
            value={notifPrefs.email_orders}
            onChange={(v) => setNotifPrefs({ ...notifPrefs, email_orders: v })}
          />
          <Toggle
            label="Payout updates"
            desc="Email me when a payout is processed"
            value={notifPrefs.email_payouts}
            onChange={(v) => setNotifPrefs({ ...notifPrefs, email_payouts: v })}
          />
          <Toggle
            label="Marketing emails"
            desc="Tips, product updates, and Occaz news"
            value={notifPrefs.email_marketing}
            onChange={(v) => setNotifPrefs({ ...notifPrefs, email_marketing: v })}
          />
        </div>
        <button
          onClick={saveNotif}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/10"
        >
          Save preferences
        </button>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <h3 className="text-sm font-bold text-white">Active sessions</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Devices that are currently signed in to your account
        </p>
        {sessions.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-sm text-zinc-500">
            Session tracking ready. We'll list active devices here once you sign in from another one.
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-zinc-400">
                  <Settings className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">
                    {s.user_agent?.slice(0, 60) ?? "Unknown device"}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Last active: {new Date(s.last_active_at).toLocaleString()}
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <h3 className="text-sm font-bold text-white">Sign out</h3>
        <p className="mt-0.5 text-xs text-zinc-400">
          Sign out of your account on this device
        </p>
        <button
          onClick={handleSignOut}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: any) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-white/[0.02] p-3">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-[10px] text-zinc-500">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={
          "relative h-5 w-9 rounded-full transition " +
          (value ? "bg-pink-500" : "bg-white/10")
        }
      >
        <span
          className={
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition " +
            (value ? "left-4" : "left-0.5")
          }
        />
      </button>
    </label>
  );
}
