/**
 * Lightweight billing that just updates profiles.plan — the real
 * subscription/payment tables don't exist in this Supabase project.
 *
 * The full Stripe integration would slot in here later.
 */
import { supabase } from "./supabase";

export interface CheckoutInput {
  userId: string;
  plan: "free" | "pro" | "business";
  interval: "monthly" | "yearly";
  coupon?: string | null;
}

export interface CheckoutResult {
  paymentId: string;
  redirectUrl?: string;
  error?: string;
}

/**
 * Simulate "starting" a checkout. We just write plan=free to the profile.
 * No payment row is persisted (the payments table doesn't exist).
 */
export async function startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  return {
    paymentId: `sim-${input.plan}-${Date.now()}`,
    redirectUrl: `/organizer/billing/checkout/sim-${input.plan}-${Date.now()}`,
  };
}

/**
 * "Confirm" a checkout — actually flip the profile to the new plan.
 */
export async function confirmCheckout(paymentId: string): Promise<{ ok: boolean; error?: string }> {
  // Parse out plan from "sim-<plan>-<ts>" — or look up plan via API.
  // For simplicity we accept paymentId like "sim-pro-..."
  const parts = paymentId.split("-");
  const plan = (parts[1] === "pro" || parts[1] === "business") ? parts[1] : "free";
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * "Cancel" — set profile.plan back to "free".
 */
export async function cancelSubscription(_subscriptionId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase
    .from("profiles")
    .update({ plan: "free" })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
