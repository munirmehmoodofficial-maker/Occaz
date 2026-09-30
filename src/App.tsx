import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
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
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { AuthConfirmedPage } from "./pages/AuthConfirmedPage";
import { DevConfirmPage } from "./pages/DevConfirmPage";
import { StorageDebugPage } from "./pages/StorageDebugPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrganizerBillingPage } from "./pages/organizer/OrganizerBillingPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { OrganizerCheckoutPage } from "./pages/organizer/OrganizerCheckoutPage";
import { AdminOrganizerFeaturesPage } from "./pages/admin/AdminOrganizerFeaturesPage";
import { LandingPage } from "./pages/LandingPage";
import { OrganizerProfilePage } from "./pages/organizer/OrganizerProfilePage";
import { OrganizerDashboardPage } from "./pages/organizer/OrganizerDashboardPage";
import { PublicOrganizerPage } from "./pages/PublicOrganizerPage";
import { OrganizersDirectoryPage } from "./pages/OrganizersDirectoryPage";
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
  AdminBackup,
  AdminRoles,
  AdminHomepage,
} from "./pages/admin/AdminPages";
import { RequireUser, RequireAdmin, RequireOrganizer } from "./lib/guards";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth / marketing / onboarding pages — no Layout chrome */}
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/auth/confirmed" element={<AuthConfirmedPage />} />
        <Route path="/dev-confirm" element={<DevConfirmPage />} />
        <Route path="/__storage-debug" element={<StorageDebugPage />} />

        <Route element={<Layout />}>
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
          <Route path="/organizer" element={<RequireOrganizer><OrganizerDashboardPage /></RequireOrganizer>} />
          <Route path="/organizer/billing" element={<RequireOrganizer><OrganizerBillingPage /></RequireOrganizer>} />
          <Route path="/organizer/billing/checkout/:paymentId" element={<RequireOrganizer><OrganizerCheckoutPage /></RequireOrganizer>} />
          <Route path="/organizer/profile" element={<RequireOrganizer><OrganizerProfilePage /></RequireOrganizer>} />
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
          <Route path="registrations" element={<AdminRegistrations />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="email" element={<AdminEmailCampaigns />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="activity" element={<AdminAuditLog />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="integrations" element={<AdminIntegrations />} />
          <Route path="domains" element={<AdminDomains />} />
          <Route path="backup" element={<AdminBackup />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
