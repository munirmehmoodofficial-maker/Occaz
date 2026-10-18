import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "./components/layout/Layout";
import { useBranding } from "./hooks/useBranding";
import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { EventsPage } from "./pages/EventsPage";
import { OpportunitiesPage } from "./pages/OpportunitiesPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { OpportunityDetailPage } from "./pages/OpportunityDetailPage";
import { TicketsPage } from "./pages/TicketsPage";
import { SavedPage } from "./pages/SavedPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SearchPage } from "./pages/SearchPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { AuthConfirmedPage } from "./pages/AuthConfirmedPage";
import { DevConfirmPage } from "./pages/DevConfirmPage";
import { StorageDebugPage } from "./pages/StorageDebugPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrganizerBillingPage } from "./pages/organizer/OrganizerBillingPage";
import { OrganizerEventsPage } from "./pages/organizer/OrganizerEventsPage";
import { OrganizerAnalyticsPage } from "./pages/organizer/OrganizerAnalyticsPage";
import { OrganizerPromotePage } from "./pages/organizer/OrganizerPromotePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { OrganizerCheckoutPage } from "./pages/organizer/OrganizerCheckoutPage";
import { OrganizerShell } from "./components/organizer/OrganizerShell";
import {
  Section1Dashboard,
  Section2Events,
  Section3Orders,
  Section4Checkin,
  Section5Finance,
  Section6Analytics,
  Section7Marketing,
  Section8Profile,
  Section9Subscription,
  Section10Team,
  Section11Support,
  Section12Settings,
} from "./pages/organizer/v2";
import { AdminOrganizerFeaturesPage } from "./pages/admin/AdminOrganizerFeaturesPage";
import { AdminOrganizerVerifications } from "./pages/admin/AdminOrganizerVerifications";
import { AdminOrganizerBillingPage } from "./pages/admin/AdminOrganizerBillingPage";
import { LandingPage } from "./pages/LandingPage";
import { OrganizerProfilePage } from "./pages/organizer/OrganizerProfilePage";
import { OrganizerDashboardPage } from "./pages/organizer/OrganizerDashboardPage";
import { PublicOrganizerPage } from "./pages/PublicOrganizerPage";
import { OrganizersDirectoryPage } from "./pages/OrganizersDirectoryPage";
import { BecomeOrganizerPage } from "./pages/BecomeOrganizerPage";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminEvents } from "./pages/admin/AdminEvents";
import { AdminOpportunities } from "./pages/admin/AdminOpportunities";
import { AdminTickets } from "./pages/admin/AdminTickets";
import { AdminUsers } from "./pages/admin/AdminUsers";
import {
  AdminCategories,
  AdminOrganizers,
  AdminFeatured,
  AdminReports,
  AdminSettings,
} from "./pages/admin/AdminSimple";
import { AdminSubscriptions } from "./pages/admin/AdminSubscriptions";
import { AdminSystemMonitor } from "./pages/admin/AdminSystemMonitor";
import { AdminOrganizerDetail } from "./pages/admin/AdminOrganizerDetail";
import { AdminAuditLog as AdminAuditLogReal } from "./pages/admin/AdminAuditLog";
import { AdminBranding } from "./pages/admin/AdminBranding";
import {
  AdminAnalytics,
  AdminRegistrations,
  AdminReviews,
  AdminNotifications,
  AdminEmailCampaigns,
  AdminCoupons,
  AdminAuditLog,
  AdminSupport,
  AdminPayouts,
  AdminRevenue,
  AdminIntegrations,
  AdminDomains,
  AdminCities,
  AdminPaymentSettings,
  AdminPaymentSubmissions,
  AdminPlanPayments,
  AdminBackup,
  AdminRoles,
  AdminHomepage,
} from "./pages/admin/AdminPages";
import { RequireUser, RequireAdmin, RequireOrganizer } from "./lib/guards";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StatusPage } from "./pages/StatusPage";

function FaviconSync() {
  const brand = useBranding();
  useEffect(() => {
    const href = brand.favicon_url;
    if (!href) return;
    let link = document.querySelector(
      "link[rel~='icon']",
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/png";
    link.href = href;
  }, [brand.favicon_url]);

  // Keep <title> in sync with the wordmark
  useEffect(() => {
    const t = `${brand.wordmark} — Events, Tickets & Opportunities`;
    if (document.title !== t) document.title = t;
  }, [brand.wordmark]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <FaviconSync />
        <Routes>
          {/* Auth / marketing / onboarding pages — no Layout chrome */}
          <Route path="/welcome" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/confirmed" element={<AuthConfirmedPage />} />
        <Route path="/dev-confirm" element={<DevConfirmPage />} />
        <Route path="/__storage-debug" element={<StorageDebugPage />} />
        <Route path="/__status" element={<StatusPage />} />

        <Route element={<Layout />}>
          <Route path="/become-organizer" element={<BecomeOrganizerPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
          <Route path="/tickets" element={<RequireUser><TicketsPage /></RequireUser>} />
          <Route path="/saved" element={<RequireUser><SavedPage /></RequireUser>} />
          <Route path="/profile" element={<RequireUser><ProfilePage /></RequireUser>} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/checkout" element={<RequireUser><CheckoutPage /></RequireUser>} />
          <Route path="/organizer" element={<RequireOrganizer><OrganizerShell /></RequireOrganizer>}>
            <Route index element={<Section1Dashboard />} />
            <Route path="events" element={<Section2Events />} />
            <Route path="orders" element={<Section3Orders />} />
            <Route path="check-in" element={<Section4Checkin />} />
            <Route path="finance" element={<Section5Finance />} />
            <Route path="analytics" element={<Section6Analytics />} />
            <Route path="marketing" element={<Section7Marketing />} />
            <Route path="profile" element={<Section8Profile />} />
            <Route path="subscription" element={<Section9Subscription />} />
            <Route path="team" element={<Section10Team />} />
            <Route path="support" element={<Section11Support />} />
            <Route path="settings" element={<Section12Settings />} />
          </Route>
          <Route path="/organizer/billing" element={<RequireOrganizer><OrganizerBillingPage /></RequireOrganizer>} />
          <Route path="/organizer/billing/checkout/:paymentId" element={<RequireOrganizer><OrganizerCheckoutPage /></RequireOrganizer>} />
          <Route path="/organizer/promote" element={<RequireOrganizer><OrganizerPromotePage /></RequireOrganizer>} />
          <Route path="/organizers" element={<OrganizersDirectoryPage />} />
          <Route path="/organizers/:slug" element={<PublicOrganizerPage />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="opportunities" element={<AdminOpportunities />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="featured" element={<AdminFeatured />} />
          <Route path="homepage" element={<AdminHomepage />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="organizers" element={<AdminOrganizers />} />
          <Route path="organizer-features" element={<AdminOrganizerFeaturesPage />} />
          <Route path="organizer-verifications" element={<AdminOrganizerVerifications />} />
          <Route path="organizer-billing/:id" element={<AdminOrganizerBillingPage />} />
          <Route path="organizer-detail/:id" element={<AdminOrganizerDetail />} />
          <Route path="registrations" element={<AdminRegistrations />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="email" element={<AdminEmailCampaigns />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="activity" element={<AdminAuditLogReal />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="system-monitor" element={<AdminSystemMonitor />} />
          <Route path="branding" element={<AdminBranding />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="integrations" element={<AdminIntegrations />} />
          <Route path="domains" element={<AdminDomains />} />
          <Route path="cities" element={<AdminCities />} />
          <Route path="payment-settings" element={<AdminPaymentSettings />} />
          <Route path="payment-submissions" element={<AdminPaymentSubmissions />} />
          <Route path="plan-payments" element={<AdminPlanPayments />} />
          <Route path="backup" element={<AdminBackup />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
