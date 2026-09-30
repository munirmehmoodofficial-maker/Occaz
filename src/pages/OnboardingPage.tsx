import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Mail,
  Lock,
  User as UserIcon,
  Music,
  Trophy,
  Code,
  GraduationCap,
  Heart,
  Building2,
  Compass,
  Briefcase,
  Calendar,
  Mic2,
  PartyPopper,
  Users,
  Bookmark,
  Eye,
  LogIn,
  Shield,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { setGuest } from "../lib/guest";
import clsx from "clsx";

type Step = "welcome" | "auth" | "interests" | "done";

interface InterestOption {
  id: string;
  label: string;
  Icon: any;
  color: string;
}

const INTERESTS: InterestOption[] = [
  { id: "Concerts", label: "Concerts", Icon: Mic2, color: "from-pink-500/30 to-fuchsia-500/30" },
  { id: "Qawwali", label: "Qawwali & Sufi", Icon: Music, color: "from-emerald-500/30 to-teal-500/30" },
  { id: "Comedy", label: "Comedy", Icon: PartyPopper, color: "from-amber-500/30 to-orange-500/30" },
  { id: "Workshops", label: "Workshops", Icon: Code, color: "from-cyan-500/30 to-blue-500/30" },
  { id: "Hackathons", label: "Hackathons", Icon: Trophy, color: "from-violet-500/30 to-purple-500/30" },
  { id: "Scholarships", label: "Scholarships", Icon: GraduationCap, color: "from-indigo-500/30 to-blue-500/30" },
  { id: "MUNs", label: "MUNs", Icon: Users, color: "from-rose-500/30 to-pink-500/30" },
  { id: "Meetups", label: "Meetups", Icon: Heart, color: "from-orange-500/30 to-rose-500/30" },
  { id: "Conferences", label: "Conferences", Icon: Building2, color: "from-sky-500/30 to-cyan-500/30" },
  { id: "Olympiads", label: "Olympiads", Icon: Trophy, color: "from-yellow-500/30 to-amber-500/30" },
  { id: "Fellowships", label: "Fellowships", Icon: Compass, color: "from-fuchsia-500/30 to-pink-500/30" },
  { id: "Exhibitions", label: "Exhibitions", Icon: Eye, color: "from-teal-500/30 to-cyan-500/30" },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, signIn, signUp } = useAuth();

  const initial: Step =
    (location.state as any)?.step === "interests" && user
      ? "interests"
      : (location.state as any)?.step === "auth"
        ? "auth"
        : "welcome";
  const [step, setStep] = useState<Step>(initial);

  // Routing logic
  useEffect(() => {
    if (loading) return;
    if (user && profile?.onboarded) {
      navigate("/", { replace: true });
    }
    // don't auto-redirect if guest, that's intentional
  }, [user, profile, loading, navigate]);

  // back / next helpers
  const next = () => {
    if (step === "welcome") setStep("auth");
    else if (step === "auth") {
      if (user) setStep("interests");
      else setStep("interests"); // guest also picks interests locally
    } else if (step === "interests") setStep("done");
  };
  const back = () => {
    if (step === "auth") setStep("welcome");
    else if (step === "interests") setStep("auth");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--bg-base)]">
      <BackgroundOrbs />
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 sm:px-6">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-pink-500">
              <span className="text-sm font-bold text-white">O</span>
            </div>
            <span className="text-base font-bold tracking-tight">Occaz</span>
          </div>
          <div className="flex items-center gap-1.5">
            {(["welcome", "auth", "interests", "done"] as const).map((s, i) => (
              <span
                key={s}
                className={clsx(
                  "h-1.5 w-6 rounded-full transition",
                  s === step
                    ? "bg-gradient-to-r from-accent-500 to-pink-500"
                    : ["welcome", "auth", "interests", "done"].indexOf(step) > i
                      ? "bg-accent-500/50"
                      : "bg-[var(--bg-card)]",
                )}
              />
            ))}
          </div>
        </header>

        <div className="flex flex-1 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {step === "welcome" && <WelcomeStep onNext={next} />}
              {step === "auth" && (
                <AuthStep
                  onBack={back}
                  onNext={next}
                  onGuest={() => {
                    setGuest(true);
                    setStep("interests");
                  }}
                  signIn={signIn}
                  signUp={signUp}
                  hasUser={!!user}
                />
              )}
              {step === "interests" && (
                <InterestsStep
                  onBack={user ? back : undefined}
                  onNext={next}
                  isGuest={!user}
                />
              )}
              {step === "done" && <DoneStep />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// STEP 1 — Welcome
// =========================================================================
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-accent-500 to-pink-500 shadow-[0_0_60px_-12px] shadow-accent-500/50"
      >
        <Sparkles className="h-10 w-10 text-white" />
      </motion.div>
      <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
        Welcome to Occaz
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-tertiary)] md:text-base">
        Discover events, buy tickets, and grab life-changing opportunities —
        all curated for you.
      </p>

      <div className="mx-auto mt-10 grid max-w-lg gap-3 text-left sm:grid-cols-3">
        {[
          { Icon: Calendar, label: "Find events", desc: "Near you & online" },
          { Icon: Briefcase, label: "Get opportunities", desc: "Scholarships, hackathons" },
          { Icon: Bookmark, label: "Save & follow", desc: "Never miss an event" },
        ].map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-500/15 text-accent-400">
              <b.Icon className="h-4 w-4" />
            </div>
            <div className="mt-2 text-sm font-semibold">{b.label}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{b.desc}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Button
          size="lg"
          onClick={onNext}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Get started
        </Button>
        <button
          onClick={() => {
            setGuest(true);
            // skip to done
            window.location.href = "/?onboarded=guest";
          }}
          className="text-xs text-[var(--text-tertiary)] hover:text-white"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// STEP 2 — Auth choice
// =========================================================================
function AuthStep({
  onBack,
  onNext,
  onGuest,
  signIn,
  signUp,
  hasUser,
}: {
  onBack: () => void;
  onNext: () => void;
  onGuest: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error: string | null; needsVerification: boolean }>;
  hasUser: boolean;
}) {
  const [mode, setMode] = useState<"signup" | "login">(hasUser ? "login" : "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (hasUser) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold md:text-3xl">You're signed in</h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">
          Continue to pick the categories that matter to you.
        </p>
        <Button size="lg" onClick={onNext} className="mt-6" rightIcon={<ArrowRight className="h-4 w-4" />}>
          Continue
        </Button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    const res = mode === "signup"
      ? await signUp(email, password, name)
      : await signIn(email, password);
    setBusy(false);
    if (res.error) {
      setErr(res.error);
      return;
    }
    // signed up → may need email verification
    if ("needsVerification" in res && res.needsVerification) {
      // route to /verify-email where the user gets a poll loop
      window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
      return;
    }
    onNext();
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">
          {mode === "signup"
            ? "Free, no card required."
            : "Log in to continue your journey."}
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-md">
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-[var(--bg-card)] p-1 ring-1 ring-[var(--border-subtle)]">
          {(["signup", "login"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setErr(null);
              }}
              className={clsx(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                mode === m
                  ? "bg-white text-black"
                  : "text-[var(--text-tertiary)] hover:text-white",
              )}
            >
              {m === "signup" ? "Sign up" : "Log in"}
            </button>
          ))}
        </div>

        {err && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name (optional)"
                className="input pl-10"
                autoComplete="name"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (6+ chars)"
              className="input pl-10"
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            size="lg"
            className="w-full"
            leftIcon={
              busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signup" ? (
                <Mail className="h-4 w-4" />
              ) : (
                <LogIn className="h-4 w-4" />
              )
            }
          >
            {busy
              ? mode === "signup"
                ? "Creating account…"
                : "Signing in…"
              : mode === "signup"
                ? "Create account"
                : "Log in"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          or
          <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        </div>

        <button
          type="button"
          onClick={onGuest}
          className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 text-left transition hover:border-accent-500/40"
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--bg-elevated)] text-[var(--text-tertiary)] group-hover:text-white">
            <Eye className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Continue as guest</div>
            <div className="text-xs text-[var(--text-tertiary)]">
              Browse without an account. You can sign up later.
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-white" />
        </button>

        <p className="mt-4 text-center text-[10px] text-[var(--text-tertiary)]">
          <Shield className="mr-1 inline h-3 w-3" />
          We never sell your data. Encrypted in transit.
        </p>
      </div>
    </div>
  );
}

// =========================================================================
// STEP 3 — Interests
// =========================================================================
function InterestsStep({
  onBack,
  onNext,
  isGuest,
}: {
  onBack?: () => void;
  onNext: () => void;
  isGuest: boolean;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [city, setCity] = useState("");

  function toggle(id: string) {
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  }

  async function commitAndContinue() {
    if (isGuest) {
      try {
        localStorage.setItem(
          "occaz.preferences",
          JSON.stringify({ categories: picked, city }),
        );
      } catch {}
      onNext();
      return;
    }
    // signed-in user: persist to profiles.preferences
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase
        .from("profiles")
        .update({
          preferences: { categories: picked, city },
          onboarded: true,
          city: city || null,
        })
        .eq("id", u.user.id);
    }
    onNext();
  }

  const enough = picked.length >= 1;

  return (
    <div>
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
      )}

      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          What are you into?
        </h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">
          Pick a few interests — we'll show you the most relevant events and
          opportunities first.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {INTERESTS.map((i, idx) => {
          const active = picked.includes(i.id);
          return (
            <motion.button
              key={i.id}
              type="button"
              onClick={() => toggle(i.id)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={clsx(
                "group relative overflow-hidden rounded-xl border p-3 text-left transition",
                active
                  ? "border-accent-500/50 bg-accent-500/10 ring-1 ring-accent-500/30"
                  : "border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-default)]",
              )}
            >
              <div
                className={clsx(
                  "absolute inset-0 bg-gradient-to-br opacity-0 transition",
                  i.color,
                  active && "opacity-30",
                )}
              />
              <div className="relative flex items-center gap-2.5">
                <div
                  className={clsx(
                    "grid h-9 w-9 place-items-center rounded-lg transition",
                    active
                      ? "bg-accent-500/30 text-white"
                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
                  )}
                >
                  <i.Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{i.label}</div>
                </div>
                {active && (
                  <Check className="h-4 w-4 shrink-0 text-accent-400" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        <label className="block text-xs font-medium text-[var(--text-tertiary)]">
          Where are you based?
        </label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Karachi, Pakistan"
          className="input mt-2"
        />
        <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)]">
          We'll prioritize events in and around your city.
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-[var(--text-tertiary)]">
          {picked.length} selected
        </span>
        <Button
          size="lg"
          disabled={!enough}
          onClick={commitAndContinue}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          {enough ? "Continue" : "Pick at least one"}
        </Button>
      </div>
    </div>
  );
}

// =========================================================================
// STEP 4 — Done
// =========================================================================
function DoneStep() {
  const navigate = useNavigate();
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_0_60px_-12px] shadow-emerald-500/50"
      >
        <Check className="h-10 w-10 text-white" />
      </motion.div>
      <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
        You're all set!
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-tertiary)] md:text-base">
        Your home feed is ready — curated based on your interests, with
        hand-picked events and opportunities from organizers you trust.
      </p>

      <div className="mx-auto mt-8 grid max-w-md gap-2.5 text-left">
        {[
          { Icon: Calendar, label: "Browse events near you" },
          { Icon: Briefcase, label: "Find your next opportunity" },
          { Icon: Building2, label: "Discover organizers you might love" },
        ].map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] p-3 ring-1 ring-[var(--border-subtle)]"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-500/15 text-accent-400">
              <row.Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 text-sm font-medium">{row.label}</div>
            <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
          </motion.div>
        ))}
      </div>

      <Button
        size="lg"
        onClick={() => navigate("/", { replace: true })}
        className="mt-8"
        rightIcon={<ArrowRight className="h-4 w-4" />}
      >
        Open Occaz
      </Button>
    </div>
  );
}

// =========================================================================
// Background decoration
// =========================================================================
function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl" />
      <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
    </div>
  );
}
