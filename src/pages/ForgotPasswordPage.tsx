import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, AlertCircle, CheckCircle2, Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/Button";
import { motion } from "framer-motion";

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) setError(error);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="page flex min-h-[80vh] items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center shadow-2xl"
        >
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="mt-2 text-sm text-[var(--text-tertiary)]">
            We've sent a password reset link to <strong className="text-white">{email}</strong>.
            Click the link in the email to choose a new password.
          </p>
          <div className="mt-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-left text-xs text-[var(--text-secondary)]">
            <strong>Didn't get it?</strong> Check your spam folder, or wait 60 seconds
            and{" "}
            <button
              onClick={() => setDone(false)}
              className="font-medium text-accent-400 hover:underline"
            >
              try again
            </button>
            .
          </div>
          <Link to="/login" className="mt-5 inline-block">
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to log in
            </Button>
          </Link>
        </motion.div>
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
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Forgot your password?
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            No worries. Enter your email and we'll send you a reset link.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full"
            leftIcon={
              loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />
            }
          >
            {loading ? "Sending…" : "Send reset link"}
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
