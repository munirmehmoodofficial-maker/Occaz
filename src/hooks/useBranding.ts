import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  github?: string;
  whatsapp?: string;
  telegram?: string;
  threads?: string;
  discord?: string;
}

export interface Brand {
  logo_url: string | null;
  favicon_url: string | null;
  wordmark: string;
  tagline: string | null;
  social_links: SocialLinks;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
}

export const DEFAULT_BRAND: Brand = {
  logo_url: null,
  favicon_url: null,
  wordmark: "Occaz",
  tagline: "Events, tickets & opportunities",
  social_links: {},
  contact_email: null,
  contact_phone: null,
  address: null,
};

let cached: Brand | null = null;
const listeners = new Set<(b: Brand) => void>();

function emit(b: Brand) {
  cached = b;
  for (const l of listeners) l(b);
}

function normalize(raw: any): Brand {
  return {
    logo_url: raw?.logo_url ?? null,
    favicon_url: raw?.favicon_url ?? null,
    wordmark: raw?.wordmark ?? "Occaz",
    tagline: raw?.tagline ?? null,
    social_links: (raw?.social_links as SocialLinks) ?? {},
    contact_email: raw?.contact_email ?? null,
    contact_phone: raw?.contact_phone ?? null,
    address: raw?.address ?? null,
  };
}

const SELECT_COLS =
  "logo_url, favicon_url, wordmark, tagline, social_links, contact_email, contact_phone, address";

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
        .select(SELECT_COLS)
        .eq("id", 1)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        const b = normalize(data);
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
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  if (data) emit(normalize(data));
}

/**
 * Imperative cache reset (used after reset-to-default).
 */
export function resetBrandCache() {
  emit(DEFAULT_BRAND);
}
