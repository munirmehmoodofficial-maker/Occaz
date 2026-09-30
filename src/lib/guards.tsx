import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./auth";
import { useState } from "react";
import { supabase } from "./supabase";
import { Loader2, Building2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
      <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

export function RequireUser({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader label="Loading…" />;
  if (!user) {
    return (
      <Navigate to="/login" state={{ from: location.pathname }} replace />
    );
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader label="Verifying access…" />;
  if (!user) {
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }
  if (!isAdmin) {
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }
  return <>{children}</>;
}

/**
 * Gate the organizer area. Non-organizer users see a friendly "Become an
 * organizer" prompt instead of being silently redirected. Admin can always
 * pass.
 */
export function RequireOrganizer({ children }: { children: ReactNode }) {
  const { user, profile, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader label="Loading…" />;
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (isAdmin) return <>{children}</>;
  if (!profile?.is_organizer) {
    return <BecomeOrganizerGate />;
  }
  return <>{children}</>;
}

function BecomeOrganizerGate() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  async function optIn() {
    if (!user) return;
    setBusy(true);
    await supabase.from("profiles").update({ is_organizer: true }).eq("id", user.id);
    // also ensure a profile row exists for older accounts
    const baseName = user.email?.split("@")[0] || "Organizer";
    const baseSlug = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "organizer";
    await supabase.from("organizer_profiles").upsert(
      { id: user.id, display_name: baseName, slug: baseSlug },
      { onConflict: "id" },
    );
    setBusy(false);
    window.location.reload();
  }
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent-500/20 to-pink-500/20 ring-1 ring-accent-500/40">
          <Building2 className="h-7 w-7 text-accent-400" />
        </div>
        <h1 className="text-xl font-semibold">This area is for organizers</h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">
          The Organizer dashboard, billing, and tools are separate from your
          attendee account. You can opt in to become an organizer at any time
          — your data stays yours.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={optIn}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-accent-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {busy ? "Setting up…" : "Become an organizer"}
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-card-hover)]"
          >
            Back to browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
