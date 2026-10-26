import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import {
  Bookmark,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  ListChecks,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDateLong, formatPrice } from "../data/mock";
import { useOpportunities, useOpportunity, useListingsLoading } from "../hooks/useListings";
import { useToast } from "../lib/toast";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { OpportunityCardGrid } from "../components/ui/CardGrid";
import { ImageGallery } from "../components/ui/ImageGallery";
import { OpportunityCard } from "../components/cards/OpportunityCard";
import { SafeImage } from "../components/ui/SafeImage";
import { useSaved } from "../hooks/useSaved";
import { cheapestTierPrice } from "../lib/freePricing";
import { FadeIn, Stagger } from "../components/motion/Motion";

export function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const opp = useOpportunity(id || "");
  const opportunities = useOpportunities();
  const { isOpportunitySaved, toggleOpportunity } = useSaved();
  const { push } = useToast();
  const listingsLoading = useListingsLoading();

  if (!opp) {
    // Wait for the store's first fetch before declaring it missing —
    // otherwise a slow load flashes "Opportunity not found" first.
    if (listingsLoading) {
      return (
        <div className="page container flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-tertiary)]" />
        </div>
      );
    }
    return (
      <div className="page container text-center">
        <h1 className="text-2xl font-semibold">Opportunity not found</h1>
        <Button onClick={() => navigate("/opportunities")} className="mt-4">
          Back to opportunities
        </Button>
      </div>
    );
  }

  const saved = isOpportunitySaved(opp.id);
  const related = opportunities
    .filter((o) => o.id !== opp.id && o.category === opp.category)
    .slice(0, 4);

  // Which pricing tier the applicant picked. Defaults to the first tier
  // so the "Apply" button always has a target.
  const feeTiers = opp.feeTiers ?? [];
  const [selectedTierId, setSelectedTierId] = useState<string | undefined>(
    feeTiers[0]?.id,
  );
  const selectedTier =
    feeTiers.find((t: any) => t.id === selectedTierId) ?? feeTiers[0] ?? null;
  // The tier's own form if it has one, otherwise the listing-level URL.
  const applyUrl = (selectedTier as any)?.applyUrl || opp.applyUrl || "";

  // The price actually being charged: the picked tier, else the cheapest.
  const activePrice = selectedTier
    ? Number((selectedTier as any).price ?? 0)
    : (cheapestTierPrice(opp) ?? opp.price ?? 0);
  const activeTierType = selectedTier
    ? ((selectedTier as any).feeType ?? opp.feeType)
    : opp.feeType;
  const activeTierPeriod = selectedTier
    ? (selectedTier as any).feePeriod
    : opp.feePeriod;
  const activeIsFree = activePrice === 0;
  // The whole pricing block can be hidden by the admin.
  const showPricing = opp.showFee !== false;

  return (
    <div className="pb-24 lg:pb-16">
      <section className="relative h-[360px] overflow-hidden md:h-[440px]">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <SafeImage
            src={opp.image}
            alt={opp.title}
            fallbackTitle={opp.title}
            className="h-full w-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="container pb-8">
            <Stagger className="mb-4 flex flex-wrap items-center gap-2" stagger={0.08}>
              <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                <Badge tone="accent">{opp.category}</Badge>
              </motion.div>
              {opp.featured && (
                <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                  <Badge tone="amber">★ Featured</Badge>
                </motion.div>
              )}
              <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                <Badge tone="outline">{opp.mode}</Badge>
              </motion.div>
              {opp.stipend && (
                <motion.div variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                  <Badge tone="emerald">{opp.stipend}</Badge>
                </motion.div>
              )}
            </Stagger>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="max-w-3xl text-3xl font-bold tracking-tight md:text-4xl"
            >
              {opp.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-3 text-base text-[var(--text-secondary)] md:text-lg"
            >
              By {opp.organizer || "Occaz Organizer"}
            </motion.p>
          </div>
        </div>
      </section>

      <div className="container mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* min-w-0: prevents the horizontally-scrolling gallery from
            forcing this grid column wider than the viewport. */}
        <div className="min-w-0">
          <Stagger className="grid gap-3 rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)] sm:grid-cols-2">
            {[
              { Icon: Calendar, label: "Application Deadline", value: formatDateLong(opp.deadline) },
              { Icon: MapPin, label: "Location", value: opp.city },
              { Icon: Building2, label: "Mode", value: opp.mode },
              { Icon: Clock, label: "Posted", value: opp.createdAt ? formatDateLong(opp.createdAt) : "—" },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex min-w-0 items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--bg-card-hover)] ring-1 ring-[var(--border-subtle)]">
                  <Icon className="h-4 w-4 text-accent-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-[var(--text-tertiary)]">{label}</div>
                  <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
                </div>
              </div>
            ))}
          </Stagger>

          {/* Pricing — application fee, selectable tiers and the Apply button */}
          {showPricing && (
            <FadeIn delay={0.1} className="mt-6 rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[var(--text-tertiary)]">Application fee</span>
                <span
                  className={
                    activeIsFree
                      ? "text-2xl font-bold text-emerald-400"
                      : "text-2xl font-bold"
                  }
                >
                  {activeIsFree
                    ? "Free"
                    : formatPrice(activePrice, opp.currency ?? "PKR")}
                  {!activeIsFree && activeTierType === "recurring" && (
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      {" "}
                      / {activeTierPeriod || "period"}
                    </span>
                  )}
                </span>
              </div>

              {feeTiers.length > 0 ? (
                <div className="mt-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Application options
                  </div>
                  <div className="mt-2 space-y-2">
                    {feeTiers.map((t: any) => {
                      const tierType = t.feeType ?? opp.feeType;
                      const tierPrice = Number(t.price ?? 0);
                      const active = (selectedTier?.id ?? null) === t.id;
                      return (
                        <button
                          key={t.id ?? t.name}
                          type="button"
                          onClick={() => setSelectedTierId(t.id)}
                          className={
                            "w-full rounded-xl p-3 text-left ring-1 transition " +
                            (active
                              ? "bg-accent-500/15 ring-accent-500/40"
                              : "bg-[var(--bg-elevated)] ring-[var(--border-subtle)] hover:ring-[var(--border-default)]")
                          }
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex min-w-0 items-center gap-2">
                              <span
                                className={
                                  "grid h-4 w-4 shrink-0 place-items-center rounded-full ring-1 " +
                                  (active
                                    ? "bg-accent-500 ring-accent-500"
                                    : "ring-[var(--border-default)]")
                                }
                              >
                                {active && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                )}
                              </span>
                              <span className="truncate text-sm font-medium">{t.name}</span>
                            </span>
                            <span
                              className={
                                tierPrice === 0
                                  ? "shrink-0 text-sm font-semibold text-emerald-400"
                                  : "shrink-0 text-sm font-semibold"
                              }
                            >
                              {tierPrice === 0
                                ? "Free"
                                : tierType === "recurring"
                                ? `${formatPrice(tierPrice, opp.currency ?? "PKR")}${
                                    t.feePeriod ? ` / ${t.feePeriod}` : " / period"
                                  }`
                                : formatPrice(tierPrice, opp.currency ?? "PKR")}
                            </span>
                          </div>
                          {t.description && (
                            <p className="mt-1 pl-6 text-xs text-[var(--text-tertiary)]">
                              {t.description}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                activeIsFree && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      This opportunity is free to apply for — no application fee.
                    </span>
                  </div>
                )
              )}

              {/* Stipend / value — hidden when the admin turned it off */}
              {opp.showStipend !== false && (
                <div className="mt-4 rounded-xl bg-[var(--bg-elevated)] p-4 ring-1 ring-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-tertiary)]">Stipend / Value</div>
                  <div className="mt-1 text-base font-semibold">
                    {opp.hasStipend && opp.stipend ? opp.stipend : "Unpaid"}
                  </div>
                </div>
              )}

              {/* Apply / Save / Share live with the pricing, not at the bottom */}
              <div className="mt-5 space-y-2">
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  disabled={!opp.registrationsOpen}
                  leftIcon={<ArrowUpRight className="h-4 w-4" />}
                  onClick={() => {
                    if (applyUrl) window.open(applyUrl, "_blank");
                    else
                      push({
                        tone: "red",
                        title: "No application link",
                        message: "This opportunity has no application URL yet.",
                      });
                  }}
                >
                  {!opp.registrationsOpen
                    ? "Applications closed"
                    : activeIsFree
                    ? "Apply for free"
                    : "Apply now"}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    leftIcon={<Bookmark className="h-4 w-4" />}
                    onClick={() => toggleOpportunity(opp.id)}
                  >
                    {saved ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" size="md" leftIcon={<Share2 className="h-4 w-4" />}>
                    Share
                  </Button>
                </div>
              </div>
            </FadeIn>
          )}

          {/* When the pricing block is hidden, the apply actions still need
              to live somewhere — put them in their own card. */}
          {!showPricing && (
            <FadeIn delay={0.1} className="mt-6 rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  disabled={!opp.registrationsOpen}
                  leftIcon={<ArrowUpRight className="h-4 w-4" />}
                  onClick={() => {
                    if (applyUrl) window.open(applyUrl, "_blank");
                    else
                      push({
                        tone: "red",
                        title: "No application link",
                        message: "This opportunity has no application URL yet.",
                      });
                  }}
                >
                  {!opp.registrationsOpen
                    ? "Applications closed"
                    : "Apply now"}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    leftIcon={<Bookmark className="h-4 w-4" />}
                    onClick={() => toggleOpportunity(opp.id)}
                  >
                    {saved ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" size="md" leftIcon={<Share2 className="h-4 w-4" />}>
                    Share
                  </Button>
                </div>
              </div>
            </FadeIn>
          )}

          <FadeIn delay={0.1} className="mt-10">
            <h2 className="text-xl font-semibold">About</h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
              {opp.description}
            </p>
          </FadeIn>

          {opp.eligibility && opp.eligibility.length > 0 && (
            <FadeIn delay={0.15} className="mt-10">
              <h2 className="text-xl font-semibold">Eligibility</h2>
              <ul className="mt-4 space-y-2">
                {opp.eligibility.map((e) => (
                  <motion.li
                    key={e}
                    whileHover={{ x: 2 }}
                    className="flex items-start gap-3 rounded-xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span className="min-w-0 break-words text-sm text-[var(--text-secondary)]">{e}</span>
                  </motion.li>
                ))}
              </ul>
            </FadeIn>
          )}

          {opp.requirements && opp.requirements.length > 0 && (
            <FadeIn delay={0.2} className="mt-10">
              <h2 className="text-xl font-semibold">Requirements</h2>
              <ul className="mt-4 space-y-2">
                {opp.requirements.map((r) => (
                  <motion.li
                    key={r}
                    whileHover={{ x: 2 }}
                    className="flex items-start gap-3 rounded-xl bg-[var(--bg-card)] p-4 ring-1 ring-[var(--border-subtle)]"
                  >
                    <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" />
                    <span className="min-w-0 break-words text-sm text-[var(--text-secondary)]">{r}</span>
                  </motion.li>
                ))}
              </ul>
            </FadeIn>
          )}

          <FadeIn delay={0.22} className="mt-10">
            <h2 className="text-xl font-semibold">Gallery</h2>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              {opp.gallery?.length
                ? "Images and program highlights"
                : "More visuals coming soon"}
            </p>
            <div className="mt-4">
              <ImageGallery
                images={
                  opp.gallery && opp.gallery.length
                    ? [opp.image, ...opp.gallery]
                    : [opp.image]
                }
                title={opp.title}
              />
            </div>
          </FadeIn>

          {/* Location */}
          {opp.city && (
            <FadeIn delay={0.25} className="mt-10">
              <h2 className="text-xl font-semibold">Location</h2>
              <div className="mt-3 overflow-hidden rounded-2xl bg-[var(--bg-card)] ring-1 ring-[var(--border-subtle)]">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={`https://picsum.photos/seed/${opp.id}-map/1200/600`}
                    alt="Map"
                    className="h-full w-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-[var(--bg-card)]/90 p-4 ring-1 ring-[var(--border-default)] backdrop-blur">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-500/20 ring-1 ring-accent-500/30">
                      <MapPin className="h-5 w-5 text-accent-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{opp.city}</div>
                      <div className="truncate text-sm text-[var(--text-secondary)]">
                        {opp.mode}
                      </div>
                    </div>
                    <button className="ml-auto shrink-0 rounded-full bg-[var(--bg-card-hover)] px-3 py-1.5 text-xs ring-1 ring-[var(--border-subtle)] hover:bg-[var(--bg-card)]">
                      Open in maps
                    </button>
                  </div>
                </div>
              </div>
            </FadeIn>
          )}

          {/* Organizer — sits at the very bottom of the listing */}
          <FadeIn delay={0.28} className="mt-10 rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-pink-500 ring-1 ring-[var(--border-default)]">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-[var(--text-tertiary)]">Hosted by</div>
                <div className="mt-0.5 truncate text-base font-semibold">
                  {opp.organizer || "Occaz Organizer"}
                </div>
              </div>
              <button className="shrink-0 rounded-full bg-[var(--bg-card-hover)] px-4 py-2 text-sm ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--bg-card)]">
                Follow
              </button>
            </div>
          </FadeIn>

          {related.length > 0 && (
            <div className="mt-14">
              <h2 className="text-xl font-semibold">Related opportunities</h2>
              <div className="mt-6">
                <OpportunityCardGrid>
                  {related.map((o) => (
                    <OpportunityCard key={o.id} opp={o} />
                  ))}
                </OpportunityCardGrid>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — deadline reminder only. The fee, tiers, stipend and the
            Apply/Save/Share actions all live in the PRICING card in the
            main column now. */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
          >
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <Calendar className="h-4 w-4" />
              <span>Deadline approaching</span>
            </div>
            <div className="mt-2 text-xl font-semibold">{formatDateLong(opp.deadline)}</div>
            <p className="mt-2 text-sm text-[var(--text-tertiary)]">
              Applications close on {formatDateLong(opp.deadline)}.
            </p>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
