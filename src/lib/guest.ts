// Tracks whether the visitor chose to continue as a guest (no auth).
// Lives in localStorage so a refresh doesn't kick them back to /welcome.
const KEY = "occaz.guest";

export function isGuest(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setGuest(v: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (v) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {}
}
