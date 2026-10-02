import { useNavigate, useParams } from "react-router-dom";
import {
  Bookmark,
  Share2,
  Calendar,
  MapPin,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  ListChecks,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDateLong, formatPrice } from "../data/mock";
import { useOpportunities, useOpportunity } from "../hooks/useListings";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { CardGrid } from "../components/ui/CardGrid";
import { ImageGallery } from "../components/ui/ImageGallery";
import { OpportunityCard } from "../components/cards/OpportunityCard";
import { SafeImage } from "../components/ui/SafeImage";
import { useSaved } from "../hooks/useSaved";
import { FadeIn, Stagger } from "../components/motion/Motion";

export function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const opp = useOpportunity(id || "");
  const opportunities = useOpportunities();
  const { isOpportunitySaved, toggleOpportunity } = useSaved();

  if (!opp) {
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

  return (
    <div className="pb-16">
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
              By {opp.organizer}
            </motion.p>
          </div>
        </div>
      </section>

      <div className="container mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <Stagger className="grid gap-3 rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)] sm:grid-cols-2">
            {[
              { Icon: Calendar, label: "Application Deadline", value: formatDateLong(opp.deadline) },
              { Icon: MapPin, label: "Location", value: opp.city },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--bg-card-hover)] ring-1 ring-[var(--border-subtle)]">
                  <Icon className="h-4 w-4 text-accent-400" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">{label}</div>
                  <div className="mt-0.5 text-sm font-medium">{value}</div>
                </div>
              </div>
            ))}
          </Stagger>

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
                    <span className="text-sm text-[var(--text-secondary)]">{e}</span>
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
                    <span className="text-sm text-[var(--text-secondary)]">{r}</span>
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

          <FadeIn delay={0.25} className="mt-10 rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-pink-500 ring-1 ring-[var(--border-default)]">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-[var(--text-tertiary)]">Hosted by</div>
                <div className="mt-0.5 text-base font-semibold">{opp.organizer}</div>
              </div>
              <button className="rounded-full bg-[var(--bg-card-hover)] px-4 py-2 text-sm ring-1 ring-[var(--border-subtle)] transition hover:bg-[var(--bg-card)]">
                Follow
              </button>
            </div>
          </FadeIn>

          {related.length > 0 && (
            <div className="mt-14">
              <h2 className="text-xl font-semibold">Related opportunities</h2>
              <div className="mt-6">
                <CardGrid>
                  {related.map((o) => (
                    <OpportunityCard key={o.id} opp={o} />
                  ))}
                </CardGrid>
              </div>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl bg-[var(--bg-card)] p-6 ring-1 ring-[var(--border-subtle)]"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-[var(--text-tertiary)]">Application fee</span>
              <span className="text-2xl font-bold">
                {formatPrice(opp.price ?? 0, opp.currency ?? "PKR")}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2 text-sm text-amber-400">
              <Calendar className="h-4 w-4" />
              <span>Deadline approaching</span>
            </div>
            <div className="mt-2 text-xl font-semibold">{formatDateLong(opp.deadline)}</div>

            <div className="mt-6 space-y-2">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                disabled={!opp.registrationsOpen}
                leftIcon={<ArrowUpRight className="h-4 w-4" />}
                onClick={() => window.open(opp.applyUrl, "_blank")}
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

            <div className="mt-6 rounded-xl bg-[var(--bg-elevated)] p-4 ring-1 ring-[var(--border-subtle)]">
              <div className="text-xs text-[var(--text-tertiary)]">Stipend / Value</div>
              <div className="mt-1 text-base font-semibold">
                {opp.hasStipend && opp.stipend ? opp.stipend : "Unpaid"}
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-[var(--bg-elevated)] p-4 ring-1 ring-[var(--border-subtle)]">
              <div className="text-xs text-[var(--text-tertiary)]">Application fee</div>
              <div className="mt-1 text-base font-semibold">
                {opp.feeType === "free"
                  ? "Free to apply"
                  : opp.feeType === "one_time"
                  ? `One-time · ${formatPrice(opp.price ?? 0, opp.currency ?? "PKR")}`
                  : `Recurring · ${formatPrice(opp.price ?? 0, opp.currency ?? "PKR")} ${opp.feePeriod ? `/ ${opp.feePeriod}` : "/ period"}`}
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
