import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Trash2, Image as ImageIcon, Save, RefreshCw, Eye, Sparkles, Link2, X } from "lucide-react";
import { useToast } from "../../lib/toast";
import { Button } from "../../components/ui/Button";
import { OccazLogo } from "../../components/brand/OccazLogo";
import { SOCIAL_PLATFORMS } from "../../components/brand/BrandSocialLinks";
import { useBranding, updateBrand, resetBrandCache, type SocialLinks } from "../../hooks/useBranding";
import { supabase } from "../../lib/supabase";
import { writeAuditLog } from "../../lib/adminAudit";
import clsx from "clsx";

const STORAGE_BUCKET = "occaz";
const LOGO_PATH = "brand/logo";
const FAVICON_PATH = "brand/favicon";

async function uploadToStorage(file: File, path: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const fullPath = `${path}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fullPath, file, { cacheControl: "3600", upsert: true });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fullPath);
  return data.publicUrl;
}

export function AdminBranding() {
  const { push } = useToast();
  const brand = useBranding();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [favFile, setFavFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [favPreview, setFavPreview] = useState<string | null>(null);
  const [wordmark, setWordmark] = useState("Occaz");
  const [tagline, setTagline] = useState("");
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const favInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when brand loads/changes
  useEffect(() => {
    setWordmark(brand.wordmark);
    setTagline(brand.tagline ?? "");
    setSocials({ ...(brand.social_links || {}) });
    setContactEmail(brand.contact_email ?? "");
    setContactPhone(brand.contact_phone ?? "");
    setAddress(brand.address ?? "");
  }, [brand.wordmark, brand.tagline, brand.social_links, brand.contact_email, brand.contact_phone, brand.address]);

  // Object-URL previews for newly picked files
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!favFile) {
      setFavPreview(null);
      return;
    }
    const url = URL.createObjectURL(favFile);
    setFavPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [favFile]);

  function pickLogo() {
    logoInputRef.current?.click();
  }
  function pickFav() {
    favInputRef.current?.click();
  }

  // Compare the form against the saved brand so the Save button only
  // enables when something actually changed.
  const hasChanges = (() => {
    if (logoFile || favFile) return true;
    if (wordmark !== brand.wordmark) return true;
    if (tagline !== (brand.tagline ?? "")) return true;
    if (contactEmail !== (brand.contact_email ?? "")) return true;
    if (contactPhone !== (brand.contact_phone ?? "")) return true;
    if (address !== (brand.address ?? "")) return true;
    const saved = brand.social_links || {};
    const keys = new Set([...Object.keys(saved), ...Object.keys(socials)]);
    for (const k of keys) {
      if ((saved[k] || "") !== (socials[k] || "")) return true;
    }
    return false;
  })();

  async function handleSave() {
    setBusy(true);
    try {
      // Only keep social links that have a non-empty value
      const cleanSocials: Record<string, string> = {};
      for (const [k, v] of Object.entries(socials)) {
        const trimmed = (v || "").trim();
        if (trimmed) cleanSocials[k] = trimmed;
      }
      const patch: any = {
        wordmark: wordmark.trim() || "Occaz",
        tagline: tagline.trim() || null,
        social_links: cleanSocials,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        address: address.trim() || null,
      };
      if (logoFile) {
        patch.logo_url = await uploadToStorage(logoFile, LOGO_PATH);
      }
      if (favFile) {
        patch.favicon_url = await uploadToStorage(favFile, FAVICON_PATH);
      }
      await updateBrand(patch);
      await writeAuditLog({
        action: "brand.updated",
        target_type: "brand",
        target_id: "1",
        meta: {
          wordmark: patch.wordmark,
          tagline: patch.tagline,
          logo_uploaded: !!logoFile,
          favicon_uploaded: !!favFile,
          social_links: Object.keys(cleanSocials),
        },
      });
      push({ tone: "green", title: "Branding updated", message: "Live everywhere on the site." });
      setLogoFile(null);
      setFavFile(null);
    } catch (e: any) {
      push({ tone: "red", title: "Save failed", message: e?.message || "Try again." });
    }
    setBusy(false);
  }

  async function clearLogo() {
    if (!confirm("Remove the custom logo and revert to the default 'ocz' monogram?")) return;
    setBusy(true);
    try {
      await updateBrand({ logo_url: null });
      await writeAuditLog({
        action: "brand.logo_cleared",
        target_type: "brand",
        target_id: "1",
      });
      push({ tone: "amber", title: "Logo removed", message: "Default monogram restored." });
    } catch (e: any) {
      push({ tone: "red", title: "Failed", message: e?.message || "Try again." });
    }
    setBusy(false);
  }

  async function clearFavicon() {
    if (!confirm("Remove the custom favicon and revert to the default?")) return;
    setBusy(true);
    try {
      await updateBrand({ favicon_url: null });
      await writeAuditLog({
        action: "brand.favicon_cleared",
        target_type: "brand",
        target_id: "1",
      });
      push({ tone: "amber", title: "Favicon removed" });
    } catch (e: any) {
      push({ tone: "red", title: "Failed", message: e?.message || "Try again." });
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Branding
          </h1>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Upload your logo and wordmark. Changes apply live across
            the whole site — header, sidebar, footer, mobile nav,
            admin, favicon.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setLogoFile(null);
            setFavFile(null);
            setWordmark(brand.wordmark);
            setTagline(brand.tagline ?? "");
            setSocials({ ...(brand.social_links || {}) });
            setContactEmail(brand.contact_email ?? "");
            setContactPhone(brand.contact_phone ?? "");
            setAddress(brand.address ?? "");
          }}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Reset form
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LOGO UPLOAD */}
        <div className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)] lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Logo</div>
              <div className="text-xs text-[var(--text-tertiary)]">
                PNG, SVG, or WebP. Transparent backgrounds work best.
              </div>
            </div>
            {brand.logo_url && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearLogo}
                disabled={busy}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Remove
              </Button>
            )}
          </div>

          <div
            onClick={pickLogo}
            className={clsx(
              "group flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition",
              "border-[var(--border-default)] bg-[var(--bg-elevated)]/40 hover:border-accent-500/40 hover:bg-accent-500/5",
            )}
          >
            {logoPreview || brand.logo_url ? (
              <div className="flex flex-col items-center gap-3">
                <div className="grid h-24 w-48 place-items-center rounded-lg bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
                  <img
                    src={logoPreview ?? brand.logo_url ?? ""}
                    alt="Logo preview"
                    className="max-h-20 max-w-[180px] object-contain"
                  />
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  Click to replace
                </div>
              </div>
            ) : (
              <>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent-500/10 text-accent-400 ring-1 ring-accent-500/30">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium">Click to upload a logo</div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  or drag and drop
                </div>
              </>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/svg+xml,image/webp,image/jpeg"
            className="hidden"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* FAVICON */}
        <div className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Favicon</div>
              <div className="text-xs text-[var(--text-tertiary)]">
                Square, ideally 512×512
              </div>
            </div>
            {brand.favicon_url && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFavicon}
                disabled={busy}
                leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Remove
              </Button>
            )}
          </div>
          <div
            onClick={pickFav}
            className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)]/40 p-4 transition hover:border-accent-500/40"
          >
            {favPreview || brand.favicon_url ? (
              <img
                src={favPreview ?? brand.favicon_url ?? ""}
                alt="Favicon preview"
                className="h-12 w-12 rounded object-cover ring-1 ring-[var(--border-subtle)]"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-[var(--text-tertiary)]" />
            )}
            <div className="text-xs text-[var(--text-tertiary)]">
              {favPreview || brand.favicon_url ? "Click to replace" : "Click to upload"}
            </div>
          </div>
          <input
            ref={favInputRef}
            type="file"
            accept="image/png,image/svg+xml,image/ico,image/webp"
            className="hidden"
            onChange={(e) => setFavFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {/* WORDMARK + TAGLINE */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
            Wordmark (brand name)
          </label>
          <input
            value={wordmark}
            onChange={(e) => setWordmark(e.target.value)}
            placeholder="Occaz"
            className="input w-full"
            maxLength={32}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
            Tagline (optional)
          </label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Events, tickets & opportunities"
            className="input w-full"
            maxLength={120}
          />
        </div>
      </div>

      {/* SOCIAL LINKS */}
      <div className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
        <div className="mb-1 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-accent-400" />
          <h3 className="text-base font-semibold">Social links</h3>
        </div>
        <p className="mb-4 text-xs text-[var(--text-tertiary)]">
          Shown in the site footer and landing page footer. Leave a field
          blank to hide that icon. You can paste a full URL or just the
          handle (e.g. <code className="text-[10px]">@occaz</code>).
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((p) => {
            const value = socials[p.key] || "";
            const has = value.trim().length > 0;
            return (
              <div key={p.key} className="relative">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                  <p.Icon className="h-3.5 w-3.5" />
                  {p.label}
                </label>
                <div className="relative">
                  <input
                    value={value}
                    onChange={(e) =>
                      setSocials((prev) => ({ ...prev, [p.key]: e.target.value }))
                    }
                    placeholder={p.placeholder}
                    className="input w-full pr-8"
                  />
                  {has && (
                    <button
                      type="button"
                      onClick={() =>
                        setSocials((prev) => ({ ...prev, [p.key]: "" }))
                      }
                      className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-[var(--text-tertiary)] transition hover:bg-red-500/10 hover:text-red-400"
                      aria-label={`Clear ${p.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live preview of social icons */}
        <div className="mt-4 rounded-xl bg-[var(--bg-elevated)]/40 p-3 ring-1 ring-[var(--border-subtle)]">
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            Footer preview
          </div>
          {(() => {
            const active = SOCIAL_PLATFORMS.filter(
              (p) => (socials[p.key] || "").trim().length > 0,
            );
            if (active.length === 0) {
              return (
                <div className="text-xs text-[var(--text-tertiary)]">
                  No social links set — icons will be hidden.
                </div>
              );
            }
            return (
              <div className="flex flex-wrap items-center gap-3">
                {active.map((p) => (
                  <div
                    key={p.key}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card-hover)] text-[var(--text-secondary)] ring-1 ring-[var(--border-default)]"
                    title={p.label}
                  >
                    <p.Icon className="h-4 w-4" />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* CONTACT DETAILS */}
      <div className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
        <div className="mb-1 text-base font-semibold">Contact details</div>
        <p className="mb-4 text-xs text-[var(--text-tertiary)]">
          Optional — shown in the site footer below the social icons.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
              Contact email
            </label>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="hello@occaz.app"
              type="email"
              className="input w-full"
              maxLength={120}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
              Contact phone
            </label>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="input w-full"
              maxLength={40}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
              Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Karachi, Pakistan"
              className="input w-full"
              maxLength={200}
            />
          </div>
        </div>
      </div>

      {/* LIVE PREVIEW */}
      <div className="rounded-2xl bg-[var(--bg-card)] p-5 ring-1 ring-[var(--border-subtle)]">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Eye className="h-4 w-4 text-accent-400" />
          Live preview
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <PreviewRow label="Top nav (mobile)">
            <div className="flex items-center gap-2 px-3 py-2">
              <BrandMarkPreview size={32} />
              <span className="text-sm font-bold tracking-tight">{wordmark}</span>
            </div>
          </PreviewRow>
          <PreviewRow label="Sidebar (desktop)">
            <div className="flex items-center gap-2 px-3 py-2">
              <BrandMarkPreview size={32} />
              <span className="text-sm font-bold tracking-tight">{wordmark}</span>
            </div>
          </PreviewRow>
          <PreviewRow label="Footer">
            <div className="flex items-center gap-2 px-3 py-2">
              <BrandMarkPreview size={28} />
              <span className="text-sm font-semibold">{wordmark}</span>
            </div>
          </PreviewRow>
          <PreviewRow label="Favicon tab">
            <div className="flex items-center gap-2 rounded-md bg-[var(--bg-elevated)] px-3 py-2 text-xs">
              {(favPreview || brand.favicon_url) ? (
                <img
                  src={favPreview ?? brand.favicon_url ?? ""}
                  alt=""
                  className="h-4 w-4 rounded-sm object-cover"
                />
              ) : (
                <BrandMarkPreview size={16} />
              )}
              {wordmark} — {tagline || "Events, tickets & opportunities"}
            </div>
          </PreviewRow>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <Sparkles className="h-3.5 w-3.5" />
          Changes broadcast live to every page within seconds — no deploy required.
        </div>
        <Button
          onClick={handleSave}
          disabled={busy || !hasChanges}
          leftIcon={<Save className="h-4 w-4" />}
        >
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function PreviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[var(--bg-elevated)]/40 p-3 ring-1 ring-[var(--border-subtle)]">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
        {label}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Self-contained brand mark for the live-preview tiles.
 * Uses a data-URL SVG for the default monogram (no hook, no
 * module-level cache, no React state — just renders), and an
 * <img> for any user-uploaded logo. This avoids the cross-component
 * useBranding race that caused the preview to show only text.
 */
function BrandMarkPreview({ size }: { size: number }) {
  const brand = useBranding();
  const h = Math.round((size * 140) / 200);
  if (brand.logo_url) {
    return (
      <img
        src={brand.logo_url}
        alt="Logo"
        style={{ height: h, width: "auto", display: "block" }}
        draggable={false}
      />
    );
  }
  // Default monogram — inline data URL so it ALWAYS renders, even
  // before the Supabase fetch completes.
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 140'>` +
      `<defs><linearGradient id='g' x1='20' y1='20' x2='180' y2='120' gradientUnits='userSpaceOnUse'>` +
      `<stop offset='0' stop-color='%237c3aed'/>` +
      `<stop offset='0.35' stop-color='%23a21caf'/>` +
      `<stop offset='0.7' stop-color='%23d946ef'/>` +
      `<stop offset='1' stop-color='%23f43f5e'/>` +
      `</linearGradient></defs>` +
      `<g fill='url(%23g)'>` +
      `<path fill-rule='evenodd' d='M 110 60 A 50 50 0 1 0 10 60 A 50 50 0 1 0 110 60 Z M 92 60 A 32 32 0 1 1 28 60 A 32 32 0 1 1 92 60 Z'/>` +
      `<path fill-rule='evenodd' d='M 153 55 A 38 38 0 1 0 77 55 A 38 38 0 1 0 153 55 Z M 137 55 A 22 22 0 1 1 93 55 A 22 22 0 1 1 137 55 Z'/>` +
      `<path d='M 130 78 L 168 78 A 10 10 0 0 1 168 98 L 130 98 Z'/>` +
      `</g></svg>`
  );
  return (
    <img
      src={`data:image/svg+xml;utf8,${svg}`}
      alt="Occaz"
      width={size}
      height={h}
      style={{ display: "block" }}
      draggable={false}
    />
  );
}
