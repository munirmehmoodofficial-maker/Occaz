import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/Button";
import { motion } from "framer-motion";

interface LocationState {
  email?: string;
  from?: string;
}

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const { resendVerification, session, user, refreshSession } = useAuth();

  const [email, setEmail] = useState(state.email ?? "");
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  // If the user is already verified+logged-in, leave this page.
  useEffect(() => {
    if (session && user?.email_confirmed_at) {
      navigate(state.from ?? "/", { replace: true });
    }
  }, [session, user, navigate, state.from]);

  // Poll every 3s to detect when the user clicks the email link in the
  // same browser — Supabase auth state will update automatically.
  useEffect(() => {
    pollRef.current = window.setInterval(() => {
      void refreshSession();
    }, 3000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [refreshSession]);

  // cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function onResend() {
    if (!email) {
      setError("Enter your email to resend the verification link.");
      return;
    }
    setError(null);
    setSending(true);
    const { error } = await resendVerification(email);
    setSending(false);
    if (error) {
      setError(error);
    } else {
      setSent(true);
      setCooldown(30);
    }
  }

  async function onChangeEmail() {
    navigate("/signup", { state: { email } });
  }

  return (
    <div className="page flex min-h-[80vh] items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center shadow-2xl"
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 18 }}
          className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent-500/20 to-pink-500/20 ring-1 ring-accent-500/40"
        >
          <Mail className="h-7 w-7 text-accent-400" />
        </motion.div>

        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Check your email
        </h1>
        <p className="mt-1 text-sm text-[var(--text-tertiary)]">
          We sent a verification link to
        </p>
        <div className="mt-1 break-all text-sm font-medium text-[var(--text-primary)]">
          {email || "your inbox"}
        </div>

        <p className="mt-4 text-xs text-[var(--text-tertiary)]">
          Click the link in that email to verify your account. The page will
          automatically sign you in once you do.
        </p>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-left text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {sent && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-left text-sm text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>New link sent. Check your inbox (and spam folder).</span>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input text-center"
          />
          <Button
            onClick={onResend}
            disabled={sending || cooldown > 0}
            className="w-full"
          >
            {sending
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend verification email"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-2 text-xs text-[var(--text-tertiary)]">
          <button
            onClick={onChangeEmail}
            className="hover:text-[var(--text-primary)]"
          >
            Wrong email? Sign up again with a different one.
          </button>
          <Link to="/login" className="hover:text-[var(--text-primary)]">
            Back to log in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
