import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, AlertCircle, Shield } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { Button } from "../../components/ui/Button";
import { motion } from "framer-motion";

export function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const { signIn, profile, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dest = location.state?.from ?? "/admin";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      setSubmitting(false);
      setError(error);
      return;
    }
    // give the auth context a moment to fetch the profile
    setTimeout(() => {
      setSubmitting(false);
      // re-read profile from context is async; navigate either way and let the
      // gate component redirect non-admins.
      navigate(dest, { replace: true });
    }, 400);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] p-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-2xl"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1 ring-violet-500/40">
            <Shield className="h-6 w-6 text-violet-400" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Admin sign in
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Restricted area — admin role required.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {profile && profile.role !== "admin" && !loading && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              You're signed in but this account is not an admin. Sign in with
              an admin account.
            </span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="admin@occaz.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full"
          >
            {submitting ? "Signing in…" : "Sign in to admin"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
          Not an admin?{" "}
          <Link
            to="/"
            className="font-medium text-[var(--text-primary)] hover:underline"
          >
            Back to the user app
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
