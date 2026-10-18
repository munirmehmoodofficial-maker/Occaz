import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface Brand {
  logo_url: string | null;
  favicon_url: string | null;
  wordmark: string;
  tagline: string | null;
}

const DEFAULT_BRAND: Brand = {
  logo_url: null,
  favicon_url: null,
  wordmark: "Occaz",
  tagline: "Events, tickets & opportunities",
};

let cached: Brand | null = null;
const listeners = new Set<(b: Brand) => void>();

function emit(b: Brand) {
  cached = b;
  for (const l of listeners) l(b);
}

/**
 * Live, reactive brand settings. The first call fetches from
 * `brand_settings`; subsequent calls share the cached value and
 * re-render on changes. Updates from the admin Branding page
 * broadcast to every component using this hook.
 */
export function useBranding(): Brand {
  const [brand, setBrand] = useState<Brand>(cached ?? DEFAULT_BRAND);

  useEffect(() => {
    if (cached) {
      setBrand(cached);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("brand_settings")
        .select("logo_url, favicon_url, wordmark, tagline")
        .eq("id", 1)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        const b: Brand = {
          logo_url: (data as any).logo_url ?? null,
          favicon_url: (data as any).favicon_url ?? null,
          wordmark: (data as any).wordmark ?? "Occaz",
          tagline: (data as any).tagline ?? null,
        };
        emit(b);
        setBrand(b);
      } else {
        setBrand(DEFAULT_BRAND);
      }
    })();

    const handler = (b: Brand) => setBrand(b);
    listeners.add(handler);
    return () => {
      cancelled = true;
      listeners.delete(handler);
    };
  }, []);

  return brand;
}

/**
 * Update the brand (admin only — RLS-enforced). Broadcasts to all
 * useBranding() consumers in this session immediately, no refresh.
 */
export async function updateBrand(patch: Partial<Brand>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const payload: any = { id: 1, ...patch, updated_at: new Date().toISOString() };
  if (user) payload.updated_by = user.id;
  const { data, error } = await supabase
    .from("brand_settings")
    .upsert(payload)
    .select("logo_url, favicon_url, wordmark, tagline")
    .single();
  if (error) throw error;
  if (data) {
    const b: Brand = {
      logo_url: (data as any).logo_url ?? null,
      favicon_url: (data as any).favicon_url ?? null,
      wordmark: (data as any).wordmark ?? "Occaz",
      tagline: (data as any).tagline ?? null,
    };
    emit(b);
  }
}

/**
 * Imperative cache reset (used after reset-to-default).
 */
export function resetBrandCache() {
  emit(DEFAULT_BRAND);
}
