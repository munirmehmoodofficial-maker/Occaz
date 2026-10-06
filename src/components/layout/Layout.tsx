import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";
import { CommandPalette } from "./CommandPalette";
import { PageTransition } from "../motion/Motion";
import { useAuth } from "../../lib/auth";
import { isGuest } from "../../lib/guest";
import { Loader2 } from "lucide-react";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Gate the main app: only render the chrome (and Outlet) when the user
  // has either signed in (and completed onboarding) or is browsing as a
  // guest. Otherwise bounce them through onboarding.
  useEffect(() => {
    if (authLoading) return;
    // /become-organizer is the organizer setup flow — let everyone reach it,
    // even unauthenticated users (they can sign up at step 1).
    if (location.pathname.startsWith("/become-organizer")) return;
    if (!user && !isGuest()) {
      navigate("/onboarding", { replace: true });
      return;
    }
    // Admins skip onboarding entirely.
    if (user && profile?.role === "admin") return;
    // Organizers (users who opted into the organizer flow) skip onboarding.
    // They already have a brand and dashboard; routing them through the
    // generic welcome flow creates a deadlock loop.
    if (user && profile?.is_organizer) return;
    // If user is signed in but not yet onboarded (or profile hasn't loaded),
    // send them to /onboarding to complete the flow.
    if (user && !authLoading && (!profile || !profile.onboarded)) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, profile, authLoading, navigate, location.pathname]);

  // Show the main app only if:
  //   - the user is signed in AND has completed onboarding, OR
  //   - the visitor is browsing as a guest, OR
  //   - the user is an admin (they have full access), OR
  //   - the user is an organizer (skips attendee onboarding), OR
  //   - the user is on the organizer setup path (skip attendee onboarding)
  const guest = isGuest();
  const isAdminUser = profile?.role === "admin";
  const isOrganizerUser = Boolean(profile?.is_organizer);
  const onOrganizerSetup = location.pathname.startsWith("/become-organizer");
  const ready =
    !authLoading && (
      guest ||
      isAdminUser ||
      isOrganizerUser ||
      onOrganizerSetup ||
      (user && (profile?.onboarded ?? false))
    );

  // If we know the user is not signed in and not a guest, don't show a
  // long loading screen — let the useEffect above navigate to /onboarding.
  // Exception: the /become-organizer page is accessible without auth (sign-up
  // happens at step 1), so render it directly.
  if (!authLoading && !user && !guest && !onOrganizerSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Redirecting…
        </div>
      </div>
    );
  }

  // If user is signed in but their profile hasn't loaded yet, show loading
  // briefly. This should normally resolve in <2s thanks to the profile
  // fetch timeout. Admins skip this and go straight in.
  if (!ready && user && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading your account…
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((p) => !p)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        {/* Reserve space at the bottom on mobile so content isn't hidden under BottomNav */}
        <main className="flex-1 pb-20 lg:pb-0">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>

        <Footer />
      </div>

      <BottomNav />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
