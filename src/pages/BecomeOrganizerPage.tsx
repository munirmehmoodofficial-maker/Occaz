import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Mail,
  Lock,
  User as UserIcon,
  Building2,
  GraduationCap,
  Briefcase,
  Heart,
  Compass,
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Crown,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Music,
  CreditCard,
  Receipt,
  Eye,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/Button";
import { useToast } from "../lib/toast";
import { uploadPublicImage } from "../lib/storage";
import { PLANS, type PlanId } from "../lib/plans";
import { validateCoupon } from "../lib/coupons";
import { startCheckout } from "../lib/billing";
import clsx from "clsx";

type Step = 1 | 2 | 3 | 4 | 5;
type OrganizerType =
  | "individual"
  | "event_company"
  | "university_society"
  | "business_venue"
  | "ngo_organization"
  | "other";

const ORG_TYPES: { id: OrganizerType; label: string; Icon: any }[] = [
  { id: "individual", label: "Individual", Icon: UserIcon },
  { id: "event_company", label: "Event Company", Icon: Briefcase },
  { id: "university_society", label: "University / Society", Icon: GraduationCap },
  { id: "business_venue", label: "Business / Venue", Icon: Building2 },
  { id: "ngo_organization", label: "NGO / Organization", Icon: Heart },
  { id: "other", label: "Other", Icon: Compass },
];

const PAKISTAN_CITIES = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan",
  "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad", "Bahawalpur",
  "Sargodha", "Sahiwal", "Larkana", "Mardan", "Abbottabad", "Other",
];

export function BecomeOrganizerPage() {
  const navigate = useNavigate();
  const { user, signUp, signIn, refresh } = useAuth();
  const { push } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Step 1: register
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [organizerType, setOrganizerType] = useState<OrganizerType>("individual");
  const [isLogin, setIsLogin] = useState(false);

  // Step 2: profile
  const [brandName, setBrandName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [operatingCities, setOperatingCities] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // Step 3: plan
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("pro");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Step 4: payment
  const [paymentMethod, setPaymentMethod] = useState<"card" | "manual">("card");
  const [paymentDone, setPaymentDone] = useState(false);

  // Hydrate from existing user if logged in
  useEffect(() => {
    if (user) {
      setFullName((user as any).full_name ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  // If already an organizer, jump to dashboard
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("organizer_profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.id) navigate("/organizer");
    })();
  }, [user]);

  // STEP 1 handlers
  async function onSubmitRegister() {
    setErr(null);
    if (!fullName.trim()) return setErr("Full name is required");
    if (!email.trim()) return setErr("Email is required");
    if (!phone.trim()) return setErr("Phone is required");
    if (!city.trim()) return setErr("City is required");
    if (!isLogin && password.length < 6) return setErr("Password must be at least 6 characters");
    setBusy(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setErr(error);
          setBusy(false);
          return;
        }
      } else {
        const { error, needsVerification } = await signUp(email, password, fullName);
        if (error) {
          setErr(error);
          setBusy(false);
          return;
        }
        if (needsVerification) {
          setErr(null);
          push("ok", "Account created! Check your email to verify, then sign in.");
          setIsLogin(true);
          setBusy(false);
          return;
        }
      }
      await refresh();
      setStep(2);
    } finally {
      setBusy(false);
    }
  }

  // STEP 2 handlers
  async function uploadImage(file: File, kind: "logo" | "cover"): Promise<string | null> {
    if (kind === "logo") setLogoUploading(true);
    else setCoverUploading(true);
    try {
      const { url } = await uploadPublicImage(file, "organizers");
      return url;
    } catch (e: any) {
      push("err", e?.message ?? "Upload failed");
      return null;
    } finally {
      if (kind === "logo") setLogoUploading(false);
      else setCoverUploading(false);
    }
  }

  function onLogoChange(file: File | null) {
    if (!file) return;
    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
  }
  function onCoverChange(file: File | null) {
    if (!file) return;
    setCoverFile(file);
    setCoverUrl(URL.createObjectURL(file));
  }

  async function onSubmitProfile() {
    setErr(null);
    if (!brandName.trim()) return setErr("Organizer / brand name is required");
    if (!bio.trim() || bio.trim().length < 20)
      return setErr("Bio must be at least 20 characters");
    if (!contactEmail.trim()) return setErr("Contact email is required");
    setBusy(true);
    try {
      let logo = logoUrl;
      let cover = coverUrl;
      if (logoFile) {
        const u = await uploadImage(logoFile, "logo");
        if (u) logo = u;
      }
      if (coverFile) {
        const u = await uploadImage(coverFile, "cover");
        if (u) cover = u;
      }
      // Save into organizer_profiles (id = user.id)
      const payload = {
        id: user.id,
        display_name: brandName.trim(),
        slug: slugify(brandName),
        logo: logo,
        cover_image: cover,
        bio: bio.trim(),
        website: website.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        tiktok: tiktok.trim() || null,
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim() || null,
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim() || null,
        operating_cities: operatingCities,
        organizer_type: organizerType,
        // Don't auto-assign a plan here — the user picks one during the
        // payment step. Until then, the dashboard treats them as "No plan".
        plan: null,
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("organizer_profiles")
        .upsert(payload, { onConflict: "id" });
      if (error) {
        setErr(error.message);
        setBusy(false);
        return;
      }
      // also upsert into organizations table
      const orgPayload = {
        owner_id: user.id,
        created_by: user.id,
        name: brandName.trim(),
        slug: slugify(brandName),
        logo_url: logo,
        cover_image: cover,
        cover_url: cover,
        description: bio.trim(),
        website: website.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        tiktok: tiktok.trim() || null,
        email: contactEmail.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim() || null,
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim() || null,
        operating_cities: operatingCities,
        organizer_type: organizerType,
        // No plan until the user picks one in the payment step.
        plan: null,
        verification_status: "pending",
        is_published: false,
        updated_at: new Date().toISOString(),
      };
      await supabase.from("organizations").upsert(orgPayload, { onConflict: "owner_id" });
      setStep(3);
    } finally {
      setBusy(false);
    }
  }

  // STEP 3: coupon
  async function applyCoupon() {
    if (!coupon.trim()) return;
    setCouponMsg(null);
    setCouponLoading(true);
    const basePrice = interval === "yearly"
      ? PLANS.find((p) => p.id === selectedPlan)!.yearlyPKR
      : PLANS.find((p) => p.id === selectedPlan)!.monthlyPKR;
    const res = await validateCoupon(coupon, selectedPlan, basePrice);
    setCouponLoading(false);
    if (!res.ok) {
      setCouponMsg({ kind: "err", text: res.error ?? "Invalid code" });
      setAppliedCoupon(null);
      return;
    }
    const planName = selectedPlan === "business" ? "Business" : selectedPlan === "pro" ? "Pro" : "Starter";
    setAppliedCoupon({ code: coupon.toUpperCase(), discount: res.discount });
    setCouponMsg({
      kind: "ok",
      text: `Saved ₨ ${res.discount.toLocaleString()} on ${planName}.`,
    });
  }

  function clearCoupon() {
    setAppliedCoupon(null);
    setCoupon("");
    setCouponMsg(null);
  }

  // STEP 4: payment
  async function onPay() {
    if (!user) return setErr("Please sign in first");
    setErr(null);
    setBusy(true);
    try {
      const basePrice = interval === "yearly"
        ? PLANS.find((p) => p.id === selectedPlan)!.yearlyPKR
        : PLANS.find((p) => p.id === selectedPlan)!.monthlyPKR;
      const finalPrice = appliedCoupon
        ? Math.max(0, basePrice - appliedCoupon.discount)
        : basePrice;
      const res = await startCheckout({
        plan: selectedPlan,
        interval,
        method: paymentMethod,
        userId: user.id,
        amount: finalPrice,
        coupon: appliedCoupon?.code,
      });
      if (res.error || res.status === "failed") {
        setErr(res.error ?? "Payment failed");
        return;
      }
      setPaymentDone(true);
      setStep(5);
    } finally {
      setBusy(false);
    }
  }

  const totalSteps = 5;
  const progress = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="page pb-20">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="text-xs text-[var(--text-tertiary)]">
            Step {step} of {totalSteps}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {err && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <Step1
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              password={password}
              setPassword={setPassword}
              city={city}
              setCity={setCity}
              organizerType={organizerType}
              setOrganizerType={setOrganizerType}
              isLogin={isLogin}
              setIsLogin={setIsLogin}
              onSubmit={onSubmitRegister}
              busy={busy}
            />
          )}
          {step === 2 && (
            <Step2
              brandName={brandName}
              setBrandName={setBrandName}
              bio={bio}
              setBio={setBio}
              website={website}
              setWebsite={setWebsite}
              instagram={instagram}
              setInstagram={setInstagram}
              facebook={facebook}
              setFacebook={setFacebook}
              tiktok={tiktok}
              setTiktok={setTiktok}
              contactEmail={contactEmail}
              setContactEmail={setContactEmail}
              contactPhone={contactPhone}
              setContactPhone={setContactPhone}
              address={address}
              setAddress={setAddress}
              operatingCities={operatingCities}
              setOperatingCities={setOperatingCities}
              logoUrl={logoUrl}
              coverUrl={coverUrl}
              onLogoChange={onLogoChange}
              onCoverChange={onCoverChange}
              logoUploading={logoUploading}
              coverUploading={coverUploading}
              onBack={() => setStep(1)}
              onSubmit={onSubmitProfile}
              busy={busy}
            />
          )}
          {step === 3 && (
            <Step3
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              interval={interval}
              setInterval={setInterval}
              coupon={coupon}
              setCoupon={setCoupon}
              appliedCoupon={appliedCoupon}
              applyCoupon={applyCoupon}
              clearCoupon={clearCoupon}
              couponMsg={couponMsg}
              couponLoading={couponLoading}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <Step4
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              selectedPlan={selectedPlan}
              interval={interval}
              finalPrice={
                appliedCoupon
                  ? Math.max(
                      0,
                      (interval === "yearly"
                        ? PLANS.find((p) => p.id === selectedPlan)!.yearlyPKR
                        : PLANS.find((p) => p.id === selectedPlan)!.monthlyPKR) -
                        appliedCoupon.discount,
                    )
                  : interval === "yearly"
                  ? PLANS.find((p) => p.id === selectedPlan)!.yearlyPKR
                  : PLANS.find((p) => p.id === selectedPlan)!.monthlyPKR
              }
              onBack={() => setStep(3)}
              onPay={onPay}
              onSkip={() => setStep(5)}
              busy={busy}
            />
          )}
          {step === 5 && <Step5 onDashboard={() => navigate("/organizer")} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "organizer";
}

// STEP 1
function Step1(props: {
  fullName: string;
  setFullName: (s: string) => void;
  email: string;
  setEmail: (s: string) => void;
  phone: string;
  setPhone: (s: string) => void;
  password: string;
  setPassword: (s: string) => void;
  city: string;
  setCity: (s: string) => void;
  organizerType: OrganizerType;
  setOrganizerType: (s: OrganizerType) => void;
  isLogin: boolean;
  setIsLogin: (b: boolean) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 md:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 text-white">
          <UserIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            {props.isLogin ? "Welcome back" : "Become an organizer"}
          </h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            {props.isLogin
              ? "Sign in to continue your organizer setup"
              : "Create your account to start listing on Occaz"}
          </p>
        </div>
      </div>

      <div className="mb-6 flex rounded-xl border border-[var(--border-subtle)] p-1">
        <button
          onClick={() => props.setIsLogin(false)}
          className={clsx(
            "flex-1 rounded-lg py-2 text-sm font-medium transition",
            !props.isLogin ? "bg-white text-black" : "text-[var(--text-tertiary)] hover:text-white",
          )}
        >
          Register
        </button>
        <button
          onClick={() => props.setIsLogin(true)}
          className={clsx(
            "flex-1 rounded-lg py-2 text-sm font-medium transition",
            props.isLogin ? "bg-white text-black" : "text-[var(--text-tertiary)] hover:text-white",
          )}
        >
          Sign in
        </button>
      </div>

      <div className="space-y-4">
        {!props.isLogin && (
          <Field label="Full name" icon={<UserIcon className="h-4 w-4" />}>
            <input
              value={props.fullName}
              onChange={(e) => props.setFullName(e.target.value)}
              placeholder="Munir Mehmood"
              className="input"
              autoComplete="name"
            />
          </Field>
        )}

        <Field label="Email address" icon={<Mail className="h-4 w-4" />}>
          <input
            type="email"
            value={props.email}
            onChange={(e) => props.setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
            autoComplete="email"
          />
        </Field>

        {!props.isLogin && (
          <>
            <Field label="Phone number" icon={<CreditPhone />}>
              <input
                type="tel"
                value={props.phone}
                onChange={(e) => props.setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="input"
              />
            </Field>

            <Field label="Password" icon={<Lock className="h-4 w-4" />}>
              <input
                type="password"
                value={props.password}
                onChange={(e) => props.setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="input"
                autoComplete="new-password"
              />
            </Field>

            <Field label="City" icon={<MapPin className="h-4 w-4" />}>
              <select
                value={props.city}
                onChange={(e) => props.setCity(e.target.value)}
                className="input"
              >
                <option value="">Select your city</option>
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <div>
              <label className="mb-2 block text-sm font-medium">Organizer type</label>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {ORG_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => props.setOrganizerType(t.id)}
                    className={clsx(
                      "flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition",
                      props.organizerType === t.id
                        ? "border-accent-500/50 bg-accent-500/10 text-white"
                        : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-accent-500/30",
                    )}
                  >
                    <t.Icon className="h-4 w-4 shrink-0" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={props.onSubmit}
          disabled={props.busy}
          rightIcon={
            props.busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )
          }
        >
          {props.isLogin ? "Sign in & continue" : "Create account & continue"}
        </Button>
      </div>
    </motion.div>
  );
}

function CreditPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  );
}

// STEP 2
function Step2(props: any) {
  function toggleOperatingCity(c: string) {
    if (props.operatingCities.includes(c)) {
      props.setOperatingCities(props.operatingCities.filter((x: string) => x !== c));
    } else {
      props.setOperatingCities([...props.operatingCities, c]);
    }
  }

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 md:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 text-white">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Set up your profile</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            Tell attendees who you are. You can edit this any time.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Cover + Logo */}
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <div>
            <label className="mb-2 block text-sm font-medium">Profile logo</label>
            <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              {props.logoUrl ? (
                <>
                  <img src={props.logoUrl} className="h-full w-full object-cover" alt="" />
                  <button
                    onClick={() => props.onLogoChange(null)}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <label className="grid h-full w-full cursor-pointer place-items-center text-[var(--text-tertiary)] hover:text-white">
                  {props.logoUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-6 w-6" />
                      <div className="mt-1 text-[10px]">Upload</div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => props.onLogoChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Cover image</label>
            <div className="relative aspect-[2/1] overflow-hidden rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              {props.coverUrl ? (
                <>
                  <img src={props.coverUrl} className="h-full w-full object-cover" alt="" />
                  <button
                    onClick={() => props.onCoverChange(null)}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <label className="grid h-full w-full cursor-pointer place-items-center text-[var(--text-tertiary)] hover:text-white">
                  {props.coverUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-6 w-6" />
                      <div className="mt-1 text-xs">Upload cover</div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => props.onCoverChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <Field label="Organizer / brand name *" icon={<Building2 className="h-4 w-4" />}>
          <input
            value={props.brandName}
            onChange={(e) => props.setBrandName(e.target.value)}
            placeholder="The Events Office"
            className="input"
          />
        </Field>

        <div>
          <label className="mb-2 block text-sm font-medium">Short bio / description *</label>
          <textarea
            value={props.bio}
            onChange={(e) => props.setBio(e.target.value)}
            placeholder="What you do, what events you run, your mission (20+ characters)"
            rows={4}
            className="input min-h-[100px] resize-y"
          />
          <div className="mt-1 text-right text-xs text-[var(--text-tertiary)]">
            {props.bio.length} characters
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website" icon={<Globe className="h-4 w-4" />}>
            <input
              type="url"
              value={props.website}
              onChange={(e) => props.setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="input"
            />
          </Field>
          <Field label="Contact email *" icon={<Mail className="h-4 w-4" />}>
            <input
              type="email"
              value={props.contactEmail}
              onChange={(e) => props.setContactEmail(e.target.value)}
              placeholder="contact@yourbrand.com"
              className="input"
            />
          </Field>
        </div>

        <Field label="Contact phone" icon={<CreditPhone />}>
          <input
            type="tel"
            value={props.contactPhone}
            onChange={(e) => props.setContactPhone(e.target.value)}
            placeholder="+92 300 1234567"
            className="input"
          />
        </Field>

        <div>
          <label className="mb-2 block text-sm font-medium">Social media</label>
          <div className="grid gap-2 sm:grid-cols-3">
            <Field icon={<Instagram className="h-4 w-4" />}>
              <input
                value={props.instagram}
                onChange={(e) => props.setInstagram(e.target.value)}
                placeholder="@yourhandle"
                className="input"
              />
            </Field>
            <Field icon={<Facebook className="h-4 w-4" />}>
              <input
                value={props.facebook}
                onChange={(e) => props.setFacebook(e.target.value)}
                placeholder="yourbrand"
                className="input"
              />
            </Field>
            <Field icon={<Music className="h-4 w-4" />}>
              <input
                value={props.tiktok}
                onChange={(e) => props.setTiktok(e.target.value)}
                placeholder="@yourhandle"
                className="input"
              />
            </Field>
          </div>
        </div>

        <Field label="Address / venue address" icon={<MapPin className="h-4 w-4" />}>
          <input
            value={props.address}
            onChange={(e) => props.setAddress(e.target.value)}
            placeholder="123 Main St, F-7 Markaz"
            className="input"
          />
        </Field>

        <div>
          <label className="mb-2 block text-sm font-medium">Areas / Cities you operate in</label>
          <div className="flex flex-wrap gap-2">
            {PAKISTAN_CITIES.filter((c) => c !== "Other").map((c) => (
              <button
                key={c}
                onClick={() => toggleOperatingCity(c)}
                className={clsx(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  props.operatingCities.includes(c)
                    ? "border-accent-500/50 bg-accent-500/15 text-white"
                    : "border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-white",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            Tap all cities where you plan to host events or run operations
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={props.onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
          <Button
            fullWidth
            size="lg"
            onClick={props.onSubmit}
            disabled={props.busy}
            rightIcon={
              props.busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )
            }
          >
            Continue to plan
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// STEP 3: choose plan
function Step3(props: any) {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 md:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 text-white">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Pick your plan</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            Choose how you want to grow on Occaz.
          </p>
        </div>
      </div>

      {/* Interval toggle */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-full border border-[var(--border-subtle)] p-1">
          <button
            onClick={() => props.setInterval("monthly")}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              props.interval === "monthly"
                ? "bg-white text-black"
                : "text-[var(--text-tertiary)] hover:text-white",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => props.setInterval("yearly")}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              props.interval === "yearly"
                ? "bg-white text-black"
                : "text-[var(--text-tertiary)] hover:text-white",
            )}
          >
            Yearly · 2 months free
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p: any) => {
          const price = props.interval === "yearly" ? p.yearlyPKR : p.monthlyPKR;
          const selected = props.selectedPlan === p.id;
          const Icon = p.id === "starter" ? Sparkles : p.id === "pro" ? Crown : Building2;
          return (
            <button
              key={p.id}
              onClick={() => props.setSelectedPlan(p.id)}
              className={clsx(
                "flex flex-col rounded-2xl border bg-[var(--bg-elevated)] p-5 text-left transition",
                selected
                  ? "border-accent-500/60 ring-2 ring-accent-500/30"
                  : "border-[var(--border-subtle)] hover:border-accent-500/30",
              )}
            >
              <div className="mb-3 flex items-center gap-2">
                <Icon className="h-5 w-5 text-accent-400" />
                <h3 className="text-lg font-semibold">{p.name}</h3>
                {selected && (
                  <CheckCircle2 className="ml-auto h-5 w-5 text-accent-400" />
                )}
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">{p.tagline}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold">₨ {price.toLocaleString()}</span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  /{props.interval === "yearly" ? "year" : "month"}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-[var(--text-secondary)]">
                <li>• {p.flags.maxEventsPerMonth} events/mo</li>
                {p.flags.canFeature && <li>• Featured placement</li>}
                {p.flags.hasPromotionalTools && <li>• Promotional tools</li>}
                {p.flags.hasDedicatedSupport && <li>• Dedicated support</li>}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Coupon */}
      {props.selectedPlan !== "starter" && (
        <div className="mt-6 rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Receipt className="h-4 w-4 text-violet-400" />
            Have a coupon?
          </div>
          {props.appliedCoupon ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              <span>
                <span className="font-mono">{props.appliedCoupon.code}</span> − ₨{" "}
                {props.appliedCoupon.discount.toLocaleString()}
              </span>
              <button onClick={props.clearCoupon} className="rounded p-1 hover:bg-emerald-500/20">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={props.coupon}
                onChange={(e) => props.setCoupon(e.target.value.toUpperCase())}
                placeholder="OCCAZ20"
                className="input min-w-0 flex-1 font-mono text-sm uppercase"
              />
              <Button
                onClick={props.applyCoupon}
                disabled={props.couponLoading || !props.coupon.trim()}
              >
                {props.couponLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
          )}
          {props.couponMsg && (
            <p
              className={clsx(
                "mt-2 text-xs",
                props.couponMsg.kind === "ok" ? "text-emerald-300" : "text-red-300",
              )}
            >
              {props.couponMsg.text}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={props.onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
        <Button
          fullWidth
          size="lg"
          onClick={props.onNext}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Continue to payment
        </Button>
      </div>
    </motion.div>
  );
}

// STEP 4: payment
function Step4(props: any) {
  const planObj = PLANS.find((p: any) => p.id === props.selectedPlan);
  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 md:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 text-white">
          <CreditCard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Pay & activate</h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            Pay with card or manually via bank / JazzCash. Manual is verified within 24h.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-tertiary)]">Plan</span>
          <span className="font-semibold">{planObj?.name}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-[var(--text-tertiary)]">Interval</span>
          <span className="font-medium">
            {props.interval === "yearly" ? "Yearly" : "Monthly"}
          </span>
        </div>
        <div className="my-3 border-t border-[var(--border-subtle)]" />
        <div className="flex items-center justify-between">
          <span className="text-sm">Total</span>
          <span className="text-2xl font-bold">₨ {props.finalPrice.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => props.setPaymentMethod("card")}
          className={clsx(
            "rounded-2xl border p-4 text-left transition",
            props.paymentMethod === "card"
              ? "border-accent-500/60 bg-accent-500/10"
              : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-accent-500/30",
          )}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent-400" />
            <span className="font-medium">Pay with card</span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Activates your organizer instantly
          </p>
        </button>
        <button
          onClick={() => props.setPaymentMethod("manual")}
          className={clsx(
            "rounded-2xl border p-4 text-left transition",
            props.paymentMethod === "manual"
              ? "border-accent-500/60 bg-accent-500/10"
              : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-accent-500/30",
          )}
        >
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-violet-400" />
            <span className="font-medium">Pay manually</span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Bank / JazzCash — verified in 24h
          </p>
        </button>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={props.onBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
        <Button
          fullWidth
          size="lg"
          onClick={props.onPay}
          disabled={props.busy}
          rightIcon={
            props.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />
          }
        >
          {props.busy ? "Processing…" : `Pay ₨ ${props.finalPrice.toLocaleString()}`}
        </Button>
      </div>

      <button
        onClick={props.onSkip}
        disabled={props.busy}
        className="mt-3 w-full text-center text-xs text-[var(--text-tertiary)] hover:text-white disabled:opacity-50"
      >
        Skip for now — set up billing later
      </button>
    </motion.div>
  );
}

// STEP 5: done
function Step5(props: { onDashboard: () => void }) {
  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 text-center md:p-10"
    >
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold md:text-3xl">Welcome to Occaz Organizers!</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-tertiary)]">
        Your account is set up and your plan is active. While your phone is being verified by
        our team (typically within 24h), you can already start exploring the dashboard.
      </p>

      <div className="mx-auto mt-6 max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-left">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye className="h-4 w-4 text-accent-400" />
          What happens next?
        </div>
        <ul className="mt-3 space-y-1.5 text-xs text-[var(--text-secondary)]">
          <li>✓ Your profile is saved</li>
          <li>✓ Your plan is active</li>
          <li>⏳ Admin verifies your account (≤24h)</li>
          <li>→ You'll appear in the public organizers directory</li>
          <li>→ You can start creating events</li>
        </ul>
      </div>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button onClick={props.onDashboard} rightIcon={<ArrowRight className="h-4 w-4" />}>
          Go to dashboard
        </Button>
      </div>
    </motion.div>
  );
}

function Field(props: { label?: string; icon?: any; children: any }) {
  return (
    <div>
      {props.label && (
        <label className="mb-1.5 block text-sm font-medium">{props.label}</label>
      )}
      <div className="relative">
        {props.icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            {props.icon}
          </div>
        )}
        <div className={props.icon ? "[&_.input]:pl-9" : ""}>{props.children}</div>
      </div>
    </div>
  );
}