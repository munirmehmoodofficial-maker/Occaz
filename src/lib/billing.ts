/**
 * Billing for organizer plans. Supports two payment methods:
 *   1. Card (simulated, since no real Stripe integration yet)
 *   2. Manual (JazzCash / bank) with screenshot upload + admin approval
 *
 * Plan purchases create a row in `organizer_plan_payments`. For card,
 * the row is created with `status: succeeded` and the plan is activated
 * immediately. For manual, the row is `pending` and the plan is only
 * activated after admin approval.
 */
import { supabase } from "./supabase";

export type PlanId = "starter" | "pro" | "business";
export type PlanInterval = "monthly" | "yearly";
export type PaymentMethod = "card" | "manual";

export interface CheckoutInput {
  userId: string;
  plan: PlanId;
  interval: PlanInterval;
  method: PaymentMethod;
  amount: number;
  coupon?: string | null;
  // For manual payments:
  screenshotFile?: File | null;
  transactionRef?: string;
  notes?: string;
}

export interface CheckoutResult {
  paymentId: string;
  redirectUrl?: string;
  status: "succeeded" | "pending" | "failed";
  error?: string;
}

/**
 * Start a checkout. For card, this simulates an instant activation.
 * For manual, it requires the screenshot to be uploaded to Supabase Storage
 * and the payment_submissions-like row to be created with status=pending.
 */
export async function startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const paymentId =
    "pay-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

  if (input.method === "card") {
    // Card flow: write a succeeded payment + flip the profile plan immediately.
    const { error: payErr } = await supabase.from("organizer_plan_payments").insert({
      id: paymentId,
      user_id: input.userId,
      plan: input.plan,
      interval: input.interval,
      amount: input.amount,
      currency: "PKR",
      gateway: "card",
      method: "card",
      status: "succeeded",
    });
    if (payErr) return { paymentId, status: "failed", error: payErr.message };

    const { error: profErr } = await supabase
      .from("profiles")
      .update({ plan: input.plan })
      .eq("id", input.userId);
    if (profErr) return { paymentId, status: "failed", error: profErr.message };

    return { paymentId, status: "succeeded" };
  }

  // Manual flow: upload screenshot first, then create a pending payment row.
  if (!input.screenshotFile) {
    return { paymentId, status: "failed", error: "Screenshot is required for manual payment" };
  }
  const { uploadPublicImage } = await import("./storage");
  const up = await uploadPublicImage(input.screenshotFile, "plan-payments");
  if (!up || !up.url) {
    return { paymentId, status: "failed", error: "Screenshot upload failed" };
  }
  const { error: payErr } = await supabase.from("organizer_plan_payments").insert({
    id: paymentId,
    user_id: input.userId,
    plan: input.plan,
    interval: input.interval,
    amount: input.amount,
    currency: "PKR",
    gateway: "manual",
    method: "manual",
    screenshot_url: up.url,
    transaction_ref: input.transactionRef ?? null,
    notes: input.notes ?? null,
    status: "pending",
  });
  if (payErr) return { paymentId, status: "failed", error: payErr.message };
  return { paymentId, status: "pending" };
}

/**
 * (Legacy) confirmCheckout — for backwards compat with the checkout page.
 * Card payments now activate the plan in startCheckout() itself, so
 * this is a no-op for our new flow. Kept as a stub so old imports work.
 */
export async function confirmCheckout(_paymentId: string): Promise<{ ok: boolean; error?: string }> {
  // No-op: the plan is already activated in startCheckout() for card payments.
  // For manual payments, the admin must approve via the Plan Payments page.
  return { ok: true };
}

/**
 * Cancel the subscription — set profile.plan back to "starter".
 */
export async function cancelSubscription(_subscriptionId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase
    .from("profiles")
    .update({ plan: "starter" })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Admin: approve a pending plan payment. Activates the user's plan.
 */
export async function approvePlanPayment(paymentId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: payment, error: payErr } = await supabase
    .from("organizer_plan_payments")
    .select("user_id, plan")
    .eq("id", paymentId)
    .maybeSingle();
  if (payErr) return { ok: false, error: payErr.message };
  if (!payment) return { ok: false, error: "Payment not found" };

  const { error: upErr } = await supabase
    .from("organizer_plan_payments")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", paymentId);
  if (upErr) return { ok: false, error: upErr.message };

  const { error: profErr } = await supabase
    .from("profiles")
    .update({ plan: (payment as any).plan })
    .eq("id", (payment as any).user_id);
  if (profErr) return { ok: false, error: profErr.message };

  return { ok: true };
}

/**
 * Admin: reject a pending plan payment.
 */
export async function rejectPlanPayment(paymentId: string, reason?: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("organizer_plan_payments")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      notes: reason ?? null,
    })
    .eq("id", paymentId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
