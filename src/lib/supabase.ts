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
    detectSessionInUrl: true,
    storageKey: "occaz.auth",
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});
