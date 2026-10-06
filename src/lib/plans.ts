// Plan definitions, pricing, and feature flags for Occaz organizer
// subscriptions. Mirrors the `get_user_plan_features` SQL function so
// client-side gating stays in sync with server-side enforcement.

export type PlanId = "starter" | "pro" | "business";
export type PlanInterval = "monthly" | "yearly";

export interface PlanFeatures {
  maxEventsPerMonth: number;
  canFeature: boolean;
  canCustomizeProfile: boolean;
  hasAdvancedAnalytics: boolean;
  hasPromotionalTools: boolean;
  hasAudienceInsights: boolean;
  hasMultipleOrganizers: boolean;
  hasCampaignTools: boolean;
  hasDedicatedSupport: boolean;
  hasPriorityPromotion: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPKR: number;
  yearlyPKR: number;
  popular?: boolean;
  features: string[];
  flags: PlanFeatures;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Get started, list your first events",
    monthlyPKR: 3000,
    yearlyPKR: 30000, // ~2 months free
    features: [
      "Basic event listing",
      "Basic event page",
      "Basic discovery",
      "Up to 3 events / month",
      "Email support",
    ],
    flags: {
      maxEventsPerMonth: 3,
      canFeature: false,
      canCustomizeProfile: false,
      hasAdvancedAnalytics: false,
      hasPromotionalTools: false,
      hasAudienceInsights: false,
      hasMultipleOrganizers: false,
      hasCampaignTools: false,
      hasDedicatedSupport: false,
      hasPriorityPromotion: false,
    },
  },
  {
    id: "pro",
    name: "Occaz Pro",
    tagline: "For organizers running regular events",
    monthlyPKR: 5000,
    yearlyPKR: 50000, // 2 months free
    popular: true,
    features: [
      "Featured placement in discovery",
      "Better analytics dashboard",
      "Promotional tools (coupons, boosts)",
      "Audience insights (demographics, interests)",
      "Up to 25 events / month",
      "Organizer profile customization",
    ],
    flags: {
      maxEventsPerMonth: 25,
      canFeature: true,
      canCustomizeProfile: true,
      hasAdvancedAnalytics: false,
      hasPromotionalTools: true,
      hasAudienceInsights: true,
      hasMultipleOrganizers: false,
      hasCampaignTools: false,
      hasDedicatedSupport: false,
      hasPriorityPromotion: false,
    },
  },
  {
    id: "business",
    name: "Occaz Business",
    tagline: "For teams running large-scale programs",
    monthlyPKR: 12000,
    yearlyPKR: 120000,
    features: [
      "Advanced analytics & exports",
      "Multiple organizers / users",
      "Priority promotion across the app",
      "Campaign tools (email + push)",
      "Dedicated support",
      "Advanced event management (recurring, series, drafts)",
      "Up to 25 events / month",
      "Organizer profile customization",
    ],
    flags: {
      maxEventsPerMonth: 25,
      canFeature: true,
      canCustomizeProfile: true,
      hasAdvancedAnalytics: true,
      hasPromotionalTools: true,
      hasAudienceInsights: true,
      hasMultipleOrganizers: true,
      hasCampaignTools: true,
      hasDedicatedSupport: true,
      hasPriorityPromotion: true,
    },
  },
];

export function getPlan(id: PlanId | string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
