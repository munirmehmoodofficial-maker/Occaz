import { supabase } from "../lib/supabase";

export interface Coupon {
  id: string;
  code: string;
  organizer_id: string | null; // null = platform-wide
  plan: "pro" | "business" | "any";
  kind: "percent" | "fixed";
  amount: number;          // percent (0-100) or fixed PKR
  max_redemptions: number; // 0 = unlimited
  redemptions: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  created_at: string;
}

export interface CouponValidation {
  ok: boolean;
  discount: number;
  finalAmount: number;
  error?: string;
}

export async function validateCoupon(
  code: string,
  planId: string,
  amount: number,
): Promise<CouponValidation> {
  if (!code) return { ok: false, discount: 0, finalAmount: amount };
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("active", true)
    .maybeSingle();
  if (error || !data) {
    return { ok: false, discount: 0, finalAmount: amount, error: "Invalid code" };
  }
  const c = data as Coupon;
  if (c.plan !== "any" && c.plan !== planId) {
    return { ok: false, discount: 0, finalAmount: amount, error: `Code is for ${c.plan} plan only` };
  }
  if (c.max_redemptions > 0 && c.redemptions >= c.max_redemptions) {
    return { ok: false, discount: 0, finalAmount: amount, error: "Code fully redeemed" };
  }
  if (c.valid_until && new Date(c.valid_until) < new Date()) {
    return { ok: false, discount: 0, finalAmount: amount, error: "Code expired" };
  }
  let discount = 0;
  if (c.kind === "percent") discount = Math.round((amount * c.amount) / 100);
  else discount = Math.min(c.amount, amount);
  return { ok: true, discount, finalAmount: amount - discount };
}

export async function redeemCoupon(code: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("redeem_coupon", { p_code: code.toUpperCase() });
  if (error) return { ok: false, error: error.message };
  if (!data || !(data as any).ok) {
    return { ok: false, error: (data as any)?.error ?? "Could not redeem" };
  }
  return { ok: true };
}
