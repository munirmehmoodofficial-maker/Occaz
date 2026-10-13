import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  KeyRound,
  LogOut,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/Button";
import { useToast } from "../lib/toast";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";

/**
 * Reset-password flow.
 *
 * Important: when a user clicks the reset link in the email, Supabase
 * issues a "recovery" access token. The recovery token is also a fully
 * valid session — meaning the user is *already signed in* on the device
 * that opened the link. Without a strong gate, the app would just route
 * them to the dashboard and the password would never get changed.
 *
 * To prevent that, this page:
 *   1. Inspects the URL for the recovery token (we disabled
 *      detectSessionInUrl, so we have to exchange the code ourselves).
 *   2. While we're on /reset-password with a recovery session, the
 *      global auth listener sees the URL flag `occaz.resetting=1` and
 *      *forces* this page to be rendered, even after the user navigates.
 *   3. The user is locked on this page until they submit a new password
 *      (or sign out — which clears the recovery session).
 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updatePassword, signOut } = useAuth();
  const { push } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Step 1: process the URL — exchange the recovery code if present.
  // Step 2: check that we have a valid session.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const url = window.location.href;
        const hasTokenInUrl =
          url.includes("access_token=") ||
          url.includes("code=") ||
          url.includes("type=recovery");

        if (hasTokenInUrl) {
          // A recovery / magic-link token is in the URL. Mark the flow
          // BEFORE we exchange so the global auth listener can intercept
          // any state changes and keep us on this page.
          try {
            sessionStorage.setItem("occaz.resetting", "1");
          } catch {
            // ignore
          }

          // If the user already has a stored session, sign out first so
          // there's no confusion between the existing session and the
          // recovery session we're about to create.
          const { data: existing } = await supabase.auth.getSession();
          if (existing.session) {
            await supabase.auth.signOut();
          }

          // Exchange the recovery code / token.
          const { error: exErr } =
            await supabase.auth.exchangeCodeForSession(url);
          if (exErr) {
            // eslint-disable-next-line no-console
            console.warn("[reset-password] exchangeCodeForSession:", exErr.message);
          }

          // Clean up the URL fragment so the back button / refresh
          // doesn't replay the recovery flow.
          try {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
          } catch {
            // ignore
          }
        }

        // Now read the resulting session.
        const { data, error } = await supabase.auth.getSession();
        if (!alive) return;
        if (error) {
          setError(error.message);
          setHasSession(false);
          return;
        }
        setHasSession(!!data.session);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to verify reset link.");
        setHasSession(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [location.pathname]);

  // While the user is on the reset page, prevent accidental navigation
  // away. If they close the tab, that's their call — but in-app
  // navigation must keep them here until the password is set.
  useEffect(() => {
    if (done) return;
    if (!hasSession) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (!done) {
        e.preventDefault();
        e.returnValue =
          "You haven't set a new password yet. Leave anyway?";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [done, hasSession]);

  // If the user lands on /reset-password with NO session at all, the
  // recovery token was missing or already used — show the error state.
  // If they DO have a session, force them through the form.

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setDone(true);
    // Clear the resetting flag so the global auth listener stops
    // trying to keep us on this page.
    try {
      sessionStorage.removeItem("occaz.resetting");
    } catch {
      // ignore
    }
    push({
      tone: "green",
      title: "Password updated!",
      message: "Signing you in with the new password…",
    });
    // Reload the page so the auth state picks up the new password
    // session cleanly (otherwise the stale recovery token may persist
    // in some auth caches).
    setTimeout(() => {
      window.location.href = "/";
    }, 900);
  }

  async function onAbandon() {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // ignore
    }
    try {
      sessionStorage.removeItem("occaz.resetting");
    } catch {
      // ignore
    }
    window.location.href = "/login";
  }

  // ── Render ──────────────────────────────────────────────────────────
  if (hasSession === null) {
    return (
      <div className="page flex min-h-[80vh] items-center justify-center py-10">
        <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying reset link…
        </div>
      </div>
    );
  }

  if (hasSession === false) {
    return (
      <div className="page flex min-h-[80vh] items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center shadow-2xl"
        >
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15 text-red-300">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold">Link expired or invalid</h1>
          <p className="mt-2 text-sm text-[var(--text-tertiary)]">
            {error ||
              "This password reset link has expired or is no longer valid. Please request a new one."}
          </p>
          <Link to="/forgot-password" className="mt-5 inline-block">
            <Button>Request a new link</Button>
          </Link>
          <div className="mt-3">
            <Link
              to="/login"
              className="text-xs text-[var(--text-tertiary)] hover:text-white"
            >
              Back to log in
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // We have a recovery session — show the form.
  return (
    <div className="page flex min-h-[80vh] items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-2xl"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 text-white">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold">Set a new password</h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Choose something strong and memorable. At least 6 characters.
          </p>
        </div>

        {/* Lock banner — makes it clear the user must update the password */}
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            You must set a new password before you can use Occaz. You can
            sign out to abandon this reset and go back to the login page.
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {done && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Password updated! Taking you home…</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">New password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                autoFocus
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10 pr-10"
                disabled={done}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-white"
                tabIndex={-1}
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Type it again"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input pl-10"
                disabled={done}
              />
            </div>
          </div>

          {/* Password strength meter */}
          <PasswordStrength value={password} />

          <Button
            type="submit"
            disabled={loading || done || !password || !confirm}
            className="w-full"
            leftIcon={
              loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )
            }
          >
            {loading ? "Updating…" : done ? "Done" : "Update password"}
          </Button>
        </form>

        {!done && (
          <button
            type="button"
            onClick={onAbandon}
            disabled={signingOut}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-white disabled:opacity-50"
          >
            <LogOut className="h-3 w-3" />
            {signingOut ? "Signing out…" : "Cancel — sign out & go back to login"}
          </button>
        )}

        <p className="mt-4 text-center text-[10px] text-[var(--text-tertiary)]">
          For security, this page will lock until your password is updated.
        </p>
      </motion.div>
    </div>
  );
}

function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  let score = 0;
  if (value.length >= 6) score++;
  if (value.length >= 10) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  const levels = [
    { color: "bg-red-500", label: "Too short" },
    { color: "bg-red-500", label: "Weak" },
    { color: "bg-amber-500", label: "Fair" },
    { color: "bg-emerald-500", label: "Good" },
    { color: "bg-emerald-500", label: "Strong" },
    { color: "bg-emerald-500", label: "Very strong" },
  ];
  const lvl = levels[Math.min(score, 5)];

  return (
    <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
      <div className="flex-1">
        <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
          <div
            className={`h-full transition-all ${lvl.color}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
      </div>
      <span>{lvl.label}</span>
    </div>
  );
}
