import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  Twitter,
  Instagram,
  Linkedin,
  Save,
  Loader2,
  Lock,
  AlertCircle,
  CheckCircle2,
  Camera,
  ExternalLink,
  Eye,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../lib/auth";
import { useSubscription } from "../../hooks/useSubscription";
import { supabase } from "../../lib/supabase";

interface FormState {
  display_name: string;
  slug: string;
  logo: string;
  bio: string;
  website: string;
  twitter: string;
  instagram: string;
  linkedin: string;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function OrganizerProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, can, organizerProfile, refresh } = useSubscription();
  const [form, setForm] = useState<FormState>({
    display_name: "",
    slug: "",
    logo: "",
    bio: "",
    website: "",
    twitter: "",
    instagram: "",
    linkedin: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (organizerProfile) {
      setForm({
        display_name: organizerProfile.name ?? "",
        slug: organizerProfile.slug ?? "",
        logo: organizerProfile.logo_url ?? "",
        bio: organizerProfile.description ?? "",
        website: organizerProfile.website ?? "",
        twitter: organizerProfile.social_links?.twitter ?? "",
        instagram: organizerProfile.social_links?.instagram ?? "",
        linkedin: organizerProfile.social_links?.linkedin ?? "",
      });
    } else if (user) {
      setForm((f) => ({
        ...f,
        display_name: f.display_name || user.email?.split("@")[0] || "",
        slug: f.slug || slugify(user.email?.split("@")[0] || ""),
      }));
    }
  }, [organizerProfile, user]);

  const allowed = can("canCustomizeProfile");

  async function onSave() {
    if (!user) return;
    if (!form.display_name.trim()) {
      setMsg({ kind: "err", text: "Display name is required." });
      return;
    }
    setMsg(null);
    setSaving(true);

    const slug = form.slug.trim() || slugify(form.display_name);
    const social_links = {
      twitter: form.twitter.trim() || undefined,
      instagram: form.instagram.trim() || undefined,
      linkedin: form.linkedin.trim() || undefined,
    };

    // Look up the user's existing org by created_by
    const { data: existing } = await supabase
      .from("organizations")
      .select("id")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const payload: any = {
      name: form.display_name.trim(),
      slug,
      logo_url: form.logo.trim() || null,
      description: form.bio.trim() || null,
      website: form.website.trim() || null,
      social_links,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (existing?.id) {
      const res = await supabase
        .from("organizations")
        .update(payload)
        .eq("id", existing.id);
      error = res.error;
    } else {
      const res = await supabase
        .from("organizations")
        .insert({
          id: user.id,
          created_by: user.id,
          ...payload,
        });
      error = res.error;
    }
    setSaving(false);

    if (error) {
      if (/slug/i.test(error.message)) {
        setMsg({ kind: "err", text: "That URL slug is already taken. Try a different one." });
      } else {
        setMsg({ kind: "err", text: error.message });
      }
      return;
    }
    await refresh();
    setMsg({ kind: "ok", text: "Profile saved." });
  }

  async function onUploadLogo(file: File) {
    if (!user) return;
    setLogoUploading(true);
    try {
      const { uploadPublicImage } = await import("../../lib/storage");
      const { url } = await uploadPublicImage(file, "organizers");
      setForm((f) => ({ ...f, logo: url }));
    } catch (e: any) {
      setMsg({ kind: "err", text: `Logo upload failed: ${e?.message ?? "unknown"}` });
    }
    setLogoUploading(false);
  }

  if (!user) {
    return (
      <div className="page container text-center">
        <h1 className="text-2xl font-semibold">Sign in required</h1>
        <Button className="mt-5" onClick={() => navigate("/login")}>
          Log in
        </Button>
      </div>
    );
  }

  return (
    <div className="page pb-20">
      <div className="container max-w-3xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              Organizer
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              Organizer profile
            </h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              The face of your events on Occaz. Your profile is public at{" "}
              <code className="rounded bg-[var(--bg-card)] px-1.5 py-0.5 text-xs">
                /organizers/{form.slug || "your-slug"}
              </code>
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/organizer")}>
            Dashboard
          </Button>
        </div>

        {!allowed && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
            <Lock className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">Profile customization is on Occaz Pro and Business</div>
              <p className="mt-1 text-sm text-amber-200/80">
                You're on the {plan.name} plan. You can fill in the basic fields,
                but the public page will only show your display name. Upgrade to
                add a logo, bio, custom URL, and social links.
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => navigate("/organizer/billing")}
              >
                Upgrade plan
              </Button>
            </div>
          </div>
        )}

        {msg && (
          <div
            className={
              "mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm " +
              (msg.kind === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-300")
            }
          >
            {msg.kind === "ok" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* Logo + identity */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <h2 className="text-base font-semibold">Identity</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            How your brand shows up across Occaz
          </p>

          <div className="mt-5 flex items-center gap-5">
            <div className="relative">
              {form.logo ? (
                <img
                  src={form.logo}
                  alt=""
                  className="h-20 w-20 rounded-2xl object-cover ring-1 ring-[var(--border-default)]"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 text-2xl font-bold text-white">
                  {(form.display_name || "O").slice(0, 1).toUpperCase()}
                </div>
              )}
              {allowed && (
                <label className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-[var(--bg-elevated)] ring-2 ring-bg-card hover:bg-[var(--bg-card-hover)]">
                  <Camera className="h-3.5 w-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUploadLogo(f);
                    }}
                  />
                </label>
              )}
            </div>
            <div className="flex-1">
              {allowed ? (
                <>
                  <input
                    value={form.logo}
                    onChange={(e) => setForm({ ...form, logo: e.target.value })}
                    placeholder="…or paste a logo URL"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {logoUploading ? "Uploading…" : "Square JPG / PNG, at least 256×256"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[var(--text-tertiary)]">
                  Logo upload is part of the Pro plan.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Display name" required>
              <input
                value={form.display_name}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({
                    ...f,
                    display_name: v,
                    slug: f.slug || slugify(v),
                  }));
                }}
                className="input"
                placeholder="e.g. BizzEvents"
              />
            </Field>
            <Field
              label="URL slug"
              hint="Letters, numbers, and dashes only"
              required
            >
              <div className="flex items-center gap-1 rounded-lg bg-[var(--bg-elevated)] ring-1 ring-[var(--border-subtle)] focus-within:ring-accent-500">
                <span className="px-3 text-xs text-[var(--text-tertiary)]">/organizers/</span>
                <input
                  value={form.slug}
                  onChange={(e) =>
                    setForm({ ...form, slug: slugify(e.target.value) })
                  }
                  className="flex-1 bg-transparent py-2 pr-3 text-sm outline-none"
                  placeholder="bizzy-events"
                />
                {form.slug && (
                  <a
                    href={`/organizers/${form.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 text-[var(--text-tertiary)] hover:text-accent-400"
                    title="Preview"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </Field>
          </div>

          <Field label="Bio" className="mt-5">
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              disabled={!allowed}
              placeholder="Tell attendees what your events are about"
              className="input min-h-[88px]"
            />
          </Field>
        </section>

        {/* Links */}
        <section className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <h2 className="text-base font-semibold">Links & social</h2>
          <p className="mt-1 text-sm text-[var(--text-tertiary)]">
            Show attendees how to find you elsewhere
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <IconField icon={<Globe className="h-4 w-4" />} label="Website">
              <input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://yourawesomeorg.com"
                disabled={!allowed}
                className="input pl-10"
              />
            </IconField>
            <IconField icon={<Twitter className="h-4 w-4" />} label="X / Twitter">
              <input
                value={form.twitter}
                onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                placeholder="https://x.com/yourorg"
                disabled={!allowed}
                className="input pl-10"
              />
            </IconField>
            <IconField icon={<Instagram className="h-4 w-4" />} label="Instagram">
              <input
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="https://instagram.com/yourorg"
                disabled={!allowed}
                className="input pl-10"
              />
            </IconField>
            <IconField icon={<Linkedin className="h-4 w-4" />} label="LinkedIn">
              <input
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/yourorg"
                disabled={!allowed}
                className="input pl-10"
              />
            </IconField>
          </div>
        </section>

        <div className="mt-6 flex items-center justify-end gap-3">
          {form.slug && allowed && (
            <a
              href={`/organizers/${form.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] hover:text-white"
            >
              <Eye className="h-3.5 w-3.5" /> Preview public page
            </a>
          )}
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save profile
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={"block " + (className ?? "")}>
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      {children}
      {hint && <p className="mt-1 text-xs text-[var(--text-tertiary)]">{hint}</p>}
    </label>
  );
}

function IconField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
          {icon}
        </span>
        {children}
      </div>
    </Field>
  );
}
