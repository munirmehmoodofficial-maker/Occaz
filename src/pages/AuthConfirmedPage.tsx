import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { motion } from "framer-motion";

/**
 * Supabase redirects users here after they click the email verification link.
 * We:
 *   1. Force-refresh the session so the access token is now valid.
 *   2. Show a friendly success screen.
 *   3. Forward them to the home page after a short delay (or to "from" if provided).
 */
export function AuthConfirmedPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refreshSession, session, loading } = useAuth();
  const [phase, setPhase] = useState<"verifying" | "ok" | "error">(
    "verifying",
  );
  const [msg, setMsg] = useState<string>("Verifying your email…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // The Supabase client's `detectSessionInUrl: true` setting already
        // processes any token/code in the URL on first load. We just need
        // to wait for the resulting session to appear.
        const { data } = await (
          await import("../lib/supabase")
        ).supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          setPhase("ok");
          setMsg("You're signed in. Redirecting…");
          return;
        }
        // No session yet — try exchanging the URL ourselves (older code flow).
        const { data: ex, error: exErr } = await (
          await import("../lib/supabase")
        ).supabase.auth.exchangeCodeForSession(window.location.href);
        if (cancelled) return;
        if (exErr) {
          setPhase("error");
          setMsg(exErr.message);
        } else if (ex.session) {
          setPhase("ok");
          setMsg("Email confirmed. Signing you in…");
        } else {
          await refreshSession();
          setPhase("error");
          setMsg(
            "This link is invalid or has expired. Try requesting a new one.",
          );
        }
      } catch (e: any) {
        if (cancelled) return;
        setPhase("error");
        setMsg(e?.message ?? "Verification failed.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  useEffect(() => {
    if (phase !== "ok") return;
    const t = window.setTimeout(() => {
      const dest = params.get("next") || "/";
      navigate(dest, { replace: true });
    }, 1100);
    return () => window.clearTimeout(t);
  }, [phase, navigate, params]);

  return (
    <div className="page flex min-h-[80vh] items-center justify-center py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center shadow-2xl"
      >
        {phase === "verifying" && (
          <>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--bg-elevated)]">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
            </div>
            <h1 className="text-lg font-semibold">{msg}</h1>
          </>
        )}
        {phase === "ok" && (
          <>
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/40"
            >
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </motion.div>
            <h1 className="text-lg font-semibold">You're all set!</h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">{msg}</p>
          </>
        )}
        {phase === "error" && (
          <>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15 ring-1 ring-red-500/40">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <h1 className="text-lg font-semibold">Verification failed</h1>
            <p className="mt-1 text-sm text-red-300">{msg}</p>
            <a
              href="/login"
              className="mt-5 inline-block text-sm font-medium text-[var(--text-primary)] hover:underline"
            >
              Back to log in
            </a>
          </>
        )}
        {/* suppress unused warning while we wait for session */}
        {loading && null}
        {session && null}
      </motion.div>
    </div>
  );
}
