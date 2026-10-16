import { useEffect, useState } from "react";
import { Building2, Save } from "lucide-react";
import { useAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../lib/toast";

/**
 * Section 8 — Organizer Profile
 * Edit display name, bio, contact, social, operating cities, logo, cover.
 */
export function Section8Profile() {
  const { user, refreshProfile } = useAuth();
  const { push } = useToast();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    city: "",
    address: "",
    website: "",
    contact_email: "",
    contact_phone: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    organizer_type: "individual",
    operating_cities: [] as string[],
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("organizer_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setOrg(data);
        setForm({
          display_name: data.display_name ?? "",
          bio: data.bio ?? "",
          city: data.city ?? "",
          address: data.address ?? "",
          website: data.website ?? "",
          contact_email: data.contact_email ?? "",
          contact_phone: data.contact_phone ?? "",
          instagram: data.instagram ?? "",
          facebook: data.facebook ?? "",
          tiktok: data.tiktok ?? "",
          organizer_type: data.organizer_type ?? "individual",
          operating_cities: data.operating_cities ?? [],
        });
      }
      setLoading(false);
    })();
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizer_profiles")
      .update({
        ...form,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      push({ tone: "red", title: "Save failed", message: error.message });
      return;
    }
    push({ tone: "green", title: "Profile updated", message: "Saved." });
    refreshProfile?.();
  }

  if (loading) {
    return <div className="text-sm text-zinc-500">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Organizer profile</h2>
          <p className="text-xs text-zinc-500">
            Public profile that attendees see on your /organizers page
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <h3 className="text-sm font-bold text-white">Brand & basics</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Display name">
            <input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              className="input"
              placeholder="Bloomfield Hall School Multan"
            />
          </Field>
          <Field label="Type">
            <select
              value={form.organizer_type}
              onChange={(e) => setForm({ ...form, organizer_type: e.target.value })}
              className="input"
            >
              <option value="individual">Individual</option>
              <option value="event_company">Event Company</option>
              <option value="university_society">University / Society</option>
              <option value="business_venue">Business / Venue</option>
              <option value="ngo_organization">NGO / Organization</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="City" full>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="input"
              placeholder="Multan"
            />
          </Field>
          <Field label="Address" full>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input"
              placeholder="Street, area"
            />
          </Field>
          <Field label="Short bio" full>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="input"
              placeholder="What your organizer profile is known for…"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <h3 className="text-sm font-bold text-white">Contact</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Contact email">
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="input"
              placeholder="hello@yourbrand.com"
            />
          </Field>
          <Field label="Contact phone">
            <input
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              className="input"
              placeholder="0300-1234567"
            />
          </Field>
          <Field label="Website" full>
            <input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="input"
              placeholder="https://"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-5">
        <h3 className="text-sm font-bold text-white">Social</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Instagram">
            <input
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              className="input"
              placeholder="@yourbrand"
            />
          </Field>
          <Field label="Facebook">
            <input
              value={form.facebook}
              onChange={(e) => setForm({ ...form, facebook: e.target.value })}
              className="input"
              placeholder="/yourbrand"
            />
          </Field>
          <Field label="TikTok">
            <input
              value={form.tiktok}
              onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
              className="input"
              placeholder="@yourbrand"
            />
          </Field>
        </div>
      </div>

      <p className="text-center text-[10px] text-zinc-600">
        Logo & cover image upload coming in the next build.
      </p>
    </div>
  );
}

function Field({ label, full, children }: any) {
  return (
    <label className={full ? "sm:col-span-2" : ""}>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      {children}
    </label>
  );
}
