import { useState, useEffect, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Wand2,
  KeyRound,
  User as UserIcon,
  Building2,
  ArrowLeftRight,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/Button";
import { motion } from "framer-motion";
import clsx from "clsx";

type Mode = "password" | "magic";
type AccountKind = "user" | "organizer";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: { from?: string; unverifiedEmail?: string; asOrganizer?: boolean };
  };
  const { signIn, signInWithOAuth, resendVerification, signInWithMagicLink } =
    useAuth();

  const [kind, setKind] = useState<AccountKind>(
    location.state?.asOrganizer ? "organizer" : "user",
  );
  // Also support ?as=organizer in URL for direct links
  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search);
      if (q.get("as") === "organizer") setKind("organizer");
    }
  }, []);
  const [mode, setMode] = useState<Mode>(
    location.state?.unverifiedEmail ? "magic" : "password",
  );
  const [email, setEmail] = useState(location.state?.unverifiedEmail ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState<string | null>(
    location.state?.unverifiedEmail ?? null,
  );
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">(
    "idle",
  );
  const [magicSent, setMagicSent] = useState(false);

  const dest = location.state?.from ?? "/";

  const heading =
    kind === "organizer" ? "Welcome back, organizer" : "Welcome back";
  const subline =
    kind === "organizer"
      ? "Sign in to manage your events, payouts, and organizer profile."
      : "Log in to save events, track tickets, and apply to opportunities.";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResendStatus("idle");
    setMagicSent(false);
    setLoading(true);

    if (mode === "magic") {
      const { error } = await signInWithMagicLink(email);
      setLoading(false);
      if (error) {
        setError(error);
        return;
      }
      setMagicSent(true);
      return;
    }

    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      if (/confirm/i.test(error) || /verified/i.test(error)) {
        setUnverified(email);
        setMode("magic");
      } else {
        setError(error);
      }
      return;
    }
    navigate(dest, { replace: true });
  }

  async function onResend() {
    if (!unverified) return;
    setResendStatus("sending");
    const { error } = await resendVerification(unverified);
    if (error) {
      setError(error);
      setResendStatus("idle");
    } else {
      setResendStatus("sent");
    }
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
        {/* Account kind toggle: regular user vs organizer */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-[var(--bg-elevated)] p-1">
          <button
            type="button"
            onClick={() => setKind("user")}
            className={clsx(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition",
              kind === "user"
                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow ring-1 ring-[var(--border-subtle)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
            )}
          >
            <UserIcon className="h-3.5 w-3.5" />
            I'm an attendee
          </button>
          <button
            type="button"
            onClick={() => setKind("organizer")}
            className={clsx(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition",
              kind === "organizer"
                ? "bg-gradient-to-r from-pink-500/20 to-accent-500/20 text-white shadow ring-1 ring-pink-500/40"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            I'm an organizer
          </button>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            {subline}
          </p>
        </div>

        {kind === "organizer" && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-pink-500/30 bg-pink-500/10 p-3 text-xs text-pink-100">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-pink-300" />
            <div>
              Signing in as an{" "}
              <span className="font-semibold">organizer</span>. After login you'll
              land in the organizer dashboard.
              {" "}
              <button
                type="button"
                onClick={() => setKind("user")}
                className="inline-flex items-center gap-1 font-medium text-pink-200 hover:underline"
              >
                <ArrowLeftRight className="h-3 w-3" />
                Switch to attendee
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {unverified && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-medium text-amber-100">
                  Your email isn't verified yet
                </div>
                <p className="mt-0.5 text-amber-200/80">
                  We sent a verification link to{" "}
                  <span className="font-medium">{unverified}</span>. Check your
                  inbox (and spam folder).
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onResend}
                disabled={resendStatus === "sending"}
                className="rounded-md bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-100 ring-1 ring-amber-500/40 transition hover:bg-amber-500/30 disabled:opacity-50"
              >
                {resendStatus === "sending"
                  ? "Sending…"
                  : resendStatus === "sent"
                    ? "Link sent ✓"
                    : "Resend verification email"}
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate("/verify-email", { state: { email: unverified } })
                }
                className="text-xs font-medium text-amber-100 hover:underline"
              >
                Use full-screen resend →
              </button>
            </div>
          </div>
        )}

        {/* Mode tabs */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-[var(--bg-elevated)] p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setMagicSent(false);
            }}
            className={clsx(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition",
              mode === "password"
                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
            )}
          >
            <KeyRound className="h-3.5 w-3.5" /> Password
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("magic");
              setError(null);
            }}
            className={clsx(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition",
              mode === "magic"
                ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
            )}
          >
            <Wand2 className="h-3.5 w-3.5" /> Magic link
          </button>
        </div>

        {magicSent ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <div className="font-medium text-emerald-100">
              Magic link sent ✓
            </div>
            <p className="mt-1 text-emerald-200/80">
              Check <span className="font-medium">{email}</span> for a sign-in
              link. It will redirect you back to Occaz automatically.
            </p>
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading}
              className="mt-3 text-xs font-medium text-emerald-100 hover:underline"
            >
              Didn't get it? Send again
            </button>
          </div>
        ) : (
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
            {mode === "password" && (
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
            )}

            {mode === "password" ? (
              <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center gap-1.5 font-semibold text-pink-400 hover:text-pink-300 hover:underline"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Forgot password?
                </Link>
                <button
                  type="button"
                  onClick={() => setMode("magic")}
                  className="text-xs text-[var(--text-tertiary)] hover:text-white"
                >
                  Use magic link instead
                </button>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-tertiary)]">
                We'll email you a one-time sign-in link. No password needed.
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-1 w-full"
            >
              {loading
                ? mode === "magic"
                  ? "Sending…"
                  : "Signing in…"
                : mode === "magic"
                  ? "Send magic link"
                  : kind === "organizer"
                    ? "Sign in as organizer"
                    : "Log in"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}

        <div className="my-5 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          or continue with
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
          {kind === "organizer" ? (
            <>
              New to Occaz as an organizer?{" "}
              <Link
                to="/signup?as=organizer"
                className="font-semibold text-pink-300 hover:underline"
              >
                Apply to become an organizer →
              </Link>
            </>
          ) : (
            <>
              New to Occaz?{" "}
              <Link
                to="/signup"
                className="font-medium text-[var(--text-primary)] hover:underline"
              >
                Create an account
              </Link>
              {" · "}
              <Link
                to="/signup?as=organizer"
                className="font-medium text-pink-300 hover:underline"
              >
                I'm an organizer
              </Link>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
