import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
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

  return (
    <div className="page flex min-h-[80vh] items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-2xl"
      >
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            We'll email you a link to choose a new one.
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
            <span>Check your inbox for the reset link.</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending…" : "Send reset link"}
            <ArrowRight className="h-4 w-4" />
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
