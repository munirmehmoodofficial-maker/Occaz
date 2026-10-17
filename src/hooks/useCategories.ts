import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface Category {
  id: string;
  name: string;
  kind: "event" | "opportunity";
}

/**
 * Live categories from the `categories` table (managed by the admin
 * Categories page). Falls back to the hardcoded `data/mock` list on the
 * first paint so the UI is never empty while the network request is in
 * flight.
 */
export function useCategories(kind?: "event" | "opportunity"): Category[] {
  const [rows, setRows] = useState<Category[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let q = supabase
        .from("categories")
        .select("id, name, kind")
        .order("name", { ascending: true });
      if (kind) q = q.eq("kind", kind);
      const { data, error } = await q;
      if (cancelled) return;
      if (!error && data) {
        setRows(data as Category[]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return rows ?? [];
}

/**
 * One-shot fetch (no React state) — useful inside event handlers.
 */
export async function fetchCategories(kind?: "event" | "opportunity"): Promise<Category[]> {
  let q = supabase
    .from("categories")
    .select("id, name, kind")
    .order("name", { ascending: true });
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as Category[];
}
