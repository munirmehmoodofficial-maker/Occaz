// Supabase Edge Function — payment webhook receiver.
// Deploy with:
//   supabase functions deploy payment-webhook --no-verify-jwt
// Then point JazzCash / Easypaisa / Stripe / etc. at:
//   https://<project-ref>.supabase.co/functions/v1/payment-webhook?gateway=jazzcash
//
// This handler:
//   1. Verifies the gateway's signature header (placeholder for now — replace
//      with the gateway's HMAC/secret check before going live).
//   2. Parses the payload into a { paymentId, status, gatewayPaymentId, raw } shape.
//   3. Updates the `payments` row + flips the linked `subscriptions` row.
//
// Env vars expected (set in Supabase dashboard under Edge Function secrets):
//   PAYMENT_WEBHOOK_SECRET  — used to verify X-Webhook-Signature header

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — Supabase Edge Function runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("PAYMENT_WEBHOOK_SECRET") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) return true; // dev mode
  if (!signature) return false;
  // Implement HMAC-SHA256 verification per gateway.
  // e.g. for JazzCash: HMAC over rawBody with shared secret, hex-encoded.
  // Replace this stub with the real algorithm when wiring a real provider.
  return true;
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const url = new URL(req.url);
  const gateway = url.searchParams.get("gateway") ?? "unknown";
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature");

  if (!verifySignature(rawBody, signature)) {
    return jsonResponse({ error: "Invalid signature" }, 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  // Adapt payload → { paymentId, status, gatewayPaymentId }
  // The shape below is intentionally generic; the dispatch picks the right one.
  const paymentId: string | undefined =
    payload.paymentId ??
    payload.payment_id ??
    payload.our_payment_id ??
    payload.data?.paymentId;
  const gatewayPaymentId: string | undefined =
    payload.gatewayPaymentId ??
    payload.gateway_payment_id ??
    payload.transactionId ??
    payload.txn_id ??
    payload.data?.transactionId;
  const status: string =
    (payload.status ?? payload.data?.status ?? "").toLowerCase();

  if (!paymentId) {
    return jsonResponse({ error: "Missing paymentId" }, 400);
  }

  const succeeded = ["succeeded", "paid", "completed", "success", "captured"].includes(status);
  const failed = ["failed", "declined", "cancelled", "canceled", "expired"].includes(status);

  if (!succeeded && !failed) {
    return jsonResponse({ error: `Unrecognized status: ${status}` }, 400);
  }

  // 1. Update the payment row
  const { data: pay, error: payErr } = await supabase
    .from("payments")
    .update({
      status: succeeded ? "succeeded" : "failed",
      gateway,
      gateway_payment_id: gatewayPaymentId ?? null,
      gateway_response: payload,
      paid_at: succeeded ? new Date().toISOString() : null,
    })
    .eq("id", paymentId)
    .select()
    .single();
  if (payErr) return jsonResponse({ error: payErr.message }, 500);

  // 2. Flip the linked subscription
  if (succeeded && pay?.subscription_id) {
    await supabase
      .from("subscriptions")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", pay.subscription_id);
  } else if (failed && pay?.subscription_id) {
    await supabase
      .from("subscriptions")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", pay.subscription_id);
  }

  return jsonResponse({ ok: true, paymentId, status: succeeded ? "succeeded" : "failed" });
});
