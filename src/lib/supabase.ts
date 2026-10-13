import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.error(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check .env.local.",
  );
}

export const supabase = createClient(url ?? "", anon ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // IMPORTANT: keep this OFF so the password-reset / email-confirm links
    // don't auto-create a session on first page load. Auth pages
    // (ResetPasswordPage / AuthConfirmedPage) call
    // `supabase.auth.exchangeCodeForSession` / getSession manually so we
    // can decide what to do with the recovery session before it becomes
    // "the active session" for the rest of the app.
    detectSessionInUrl: false,
    storageKey: "occaz.auth",
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});
