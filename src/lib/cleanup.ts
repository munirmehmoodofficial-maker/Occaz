// One-time migration helper: drops any stale Occaz localStorage keys so
// the user transitions cleanly to the Supabase-backed store.
const STALE_KEYS = [
  "occaz.events.v1",
  "occaz.opps.v1",
  "occaz.saved.v1",
  "occaz.tickets.v1",
  "occaz.theme", // keep, it's a device preference
];

export function purgeStaleStorage() {
  if (typeof window === "undefined") return;
  try {
    STALE_KEYS.forEach((k) => {
      if (k === "occaz.theme") return;
      window.localStorage.removeItem(k);
    });
  } catch {}
}
