import { Outlet, useNavigate } from "react-router-dom";
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

  // Gate the main app: only render the chrome (and Outlet) when the user
  // has either signed in (and completed onboarding) or is browsing as a
  // guest. Otherwise bounce them through onboarding.
  useEffect(() => {
    if (authLoading) return;
    if (!user && !isGuest()) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Show the main app only if:
  //   - the user is signed in AND has completed onboarding, OR
  //   - the visitor is browsing as a guest
  const ready =
    !authLoading && (isGuest() || (user && (profile?.onboarded ?? false)));

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
