import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, ArrowLeft, AlertCircle, Phone } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { confirmCheckout } from "../../lib/billing";
import { useSubscription } from "../../hooks/useSubscription";

/**
 * Simulated gateway checkout page. In a real integration this page would
 * never render — the user would be redirected to JazzCash / Easypaisa and
 * the gateway would call a webhook endpoint that flips the payment to
 * "succeeded". For development & demo we render this page instead and
 * trigger the same status update the webhook would.
 */
export function OrganizerCheckoutPage() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { refresh, plan } = useSubscription();
  const [stage, setStage] = useState<"redirect" | "verifying" | "done" | "error">("redirect");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) {
      navigate("/organizer/billing", { replace: true });
    }
  }, [paymentId, navigate]);

  // Stage 1: simulate "redirecting to JazzCash" for 1.5s
  // Stage 2: simulate "verifying payment" for 1.5s, then call confirmCheckout
  // Stage 3: success — show "all set", offer to go to billing
  useEffect(() => {
    if (stage === "redirect") {
      const t = window.setTimeout(() => setStage("verifying"), 1500);
      return () => window.clearTimeout(t);
    }
    if (stage === "verifying") {
      let cancelled = false;
      (async () => {
        if (!paymentId) return;
        const res = await confirmCheckout(paymentId);
        if (cancelled) return;
        if (!res.ok) {
          setStage("error");
          setError(res.error ?? "Payment failed");
          return;
        }
        await refresh();
        setStage("done");
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [stage, paymentId, refresh]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center shadow-2xl"
      >
        {stage === "redirect" && (
          <>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-500/40">
              <Phone className="h-7 w-7 text-amber-400" />
            </div>
            <h1 className="text-lg font-semibold">Redirecting to JazzCash…</h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              You'll be sent to the secure payment gateway to complete this
              transaction. Please don't close this window.
            </p>
            <Loader2 className="mx-auto mt-5 h-5 w-5 animate-spin text-[var(--text-tertiary)]" />
          </>
        )}

        {stage === "verifying" && (
          <>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-500/40">
              <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
            </div>
            <h1 className="text-lg font-semibold">Verifying payment…</h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              We're confirming the transaction with the gateway. This usually
              takes a few seconds.
            </p>
          </>
        )}

        {stage === "done" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
              className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 ring-2 ring-emerald-500/40"
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </motion.div>
            <h1 className="text-lg font-semibold">Payment successful</h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              You're now on <span className="font-medium text-white">{plan.name}</span>.
              All plan features are unlocked.
            </p>
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              Reference: <span className="font-mono">{paymentId}</span>
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
              >
                Home
              </Button>
              <Button onClick={() => navigate("/organizer/billing")}>
                Open billing
              </Button>
            </div>
          </>
        )}

        {stage === "error" && (
          <>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15 ring-2 ring-red-500/40">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-lg font-semibold">Payment failed</h1>
            <p className="mt-1 text-sm text-red-300">
              {error ?? "The transaction was rejected by the gateway."}
            </p>
            <Button
              className="mt-5"
              variant="outline"
              onClick={() => navigate("/organizer/billing")}
            >
              Back to billing
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
