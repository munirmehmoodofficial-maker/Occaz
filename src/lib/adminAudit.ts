import { supabase } from "./supabase";

/**
 * Fire-and-forget audit log write.
 * Always returns void — never throws into the caller.
 * If the audit_log table / RPC doesn't exist (older DB), silently no-ops.
 */
export async function writeAuditLog(opts: {
  action: string;
  target_type?: string;
  target_id?: string;
  meta?: Record<string, any>;
}): Promise<void> {
  try {
    // Try the SQL function first (preferred — it has SECURITY DEFINER and
    // captures actor id + email server-side).
    const { error } = await supabase.rpc("write_audit_log", {
      p_action: opts.action,
      p_target_type: opts.target_type ?? null,
      p_target_id: opts.target_id ?? null,
      p_meta: opts.meta ?? {},
    });
    if (!error) return;

    // Fallback: insert directly (if RLS allows admin write)
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .maybeSingle();
    await supabase.from("audit_log").insert({
      actor_id: prof?.id ?? null,
      actor_email: prof?.email ?? null,
      action: opts.action,
      target_type: opts.target_type ?? null,
      target_id: opts.target_id ?? null,
      meta: opts.meta ?? {},
    });
  } catch {
    // never throw
  }
}
