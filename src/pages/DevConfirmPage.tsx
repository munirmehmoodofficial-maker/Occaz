import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, CheckCircle2, Wrench } from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { motion } from "framer-motion";

/**
 * Escape hatch: when Supabase's outbound email is rate-limited and the
 * user can't receive the confirmation link, this page lets them mark
 * their account as verified through a server-side RPC and then sign in.
 *
 * Will be removed once SMTP is configured on the project.
 */
export function DevConfirmPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    // Step 1: ask Supabase to mark this email as confirmed (server-side).
    const { data, error: rpcErr } = await supabase.rpc("dev_confirm_user", {
      p_email: email,
    });
    if (rpcErr) {
      setLoading(false);
      setError(`Confirm step failed: ${rpcErr.message}`);
      return;
    }
    if (!data || (data as any).ok !== true) {
      setLoading(false);
      setError((data as any)?.error || "Could not find that account.");
      return;
    }

    // Step 2: sign the now-confirmed user in.
    const { error: signInErr } = await signIn(email, password);
    setLoading(false);
    if (signInErr) {
      setError(signInErr);
      return;
    }
    setInfo("You're in. Redirecting…");
    setTimeout(() => navigate("/"), 700);
  }

  return (
    <div className="page flex min-h-[80vh] items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 shadow-2xl"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/40">
            <Wrench className="h-6 w-6 text-amber-400" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Verify without email
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Use this only if Supabase's email service is rate-limiting you.
            Enter the email + password of the account you just created.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
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
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Working…" : "Verify and sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-[var(--text-tertiary)]">
          This page will be removed once email delivery is working.
        </p>
      </motion.div>
    </div>
  );
}
