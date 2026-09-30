import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/Button";
import { motion } from "framer-motion";

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp, signInWithOAuth } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error, needsVerification } = await signUp(
      email,
      password,
      fullName,
    );
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    if (needsVerification) {
      // Email confirmation is enabled — bounce to the verify screen.
      navigate("/verify-email", {
        replace: true,
        state: { email },
      });
      return;
    }
    // Confirmation disabled or auto-confirmed — go home.
    setInfo("Account created. Welcome!");
    setTimeout(() => navigate("/"), 800);
  }

  async function oauth(provider: "google" | "github" | "facebook") {
    setError(null);
    const { error } = await signInWithOAuth(provider);
    if (error) setError(error);
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
            Create your account
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Save events, get tickets, apply to opportunities.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {error && /rate limit|over_email/i.test(error) && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            Email delivery is currently rate-limited. The account may still
            have been created — you can verify it without email at{" "}
            <Link to="/dev-confirm" className="font-medium text-amber-100 hover:underline">
              /dev-confirm
            </Link>
            .
          </div>
        )}
        {info && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{info}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              autoComplete="name"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input pl-10"
            />
          </div>
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
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder="Password (6+ chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-1 w-full"
          >
            {loading ? "Creating account…" : "Create account"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          or sign up with
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            onClick={() => oauth("google")}
            type="button"
          >
            <span className="text-base">G</span> Continue with Google
          </Button>
          <Button
            variant="outline"
            onClick={() => oauth("github")}
            type="button"
          >
            <span className="text-base">⌘</span> Continue with GitHub
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--text-tertiary)]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-[var(--text-primary)] hover:underline"
          >
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
