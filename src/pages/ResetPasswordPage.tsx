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
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/Button";
import { useToast } from "../lib/toast";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updatePassword } = useAuth();
  const { push } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Check that we have a valid recovery session
  useEffect(() => {
    let alive = true;
    (async () => {
      // The hash from the email link contains the access token; Supabase parses it
      // and creates a session automatically.
      const { data, error } = await supabase.auth.getSession();
      if (!alive) return;
      if (error) {
        setError(error.message);
        setHasSession(false);
        return;
      }
      setHasSession(!!data.session);
    })();
    return () => {
      alive = false;
    };
  }, []);

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
    push("ok", "Password updated! Logging you in…");
    setTimeout(() => navigate("/", { replace: true }), 1500);
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

        <p className="mt-6 text-center text-sm text-[var(--text-tertiary)]">
          Remembered it?{" "}
          <Link
            to="/login"
            className="font-medium text-[var(--text-primary)] hover:underline"
          >
            Back to log in
          </Link>
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
  const pct = Math.min(100, (score / 5) * 100);

  return (
    <div>
      <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
        <div
          className={`h-full transition-all ${lvl.color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-right text-[10px] text-[var(--text-tertiary)]">
        {lvl.label}
      </div>
    </div>
  );
}
