import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { PageLoader } from "@/components/common/PageLoader";
import { SkipLink } from "@/components/common/SkipLink";
import { useLocationTracking } from "@/hooks/useLocationTracking";
const AIChatWidget = lazy(() => import("@/components/ai/AIChatWidget").then(m => ({ default: m.AIChatWidget })));
import { CustomerOnboardingWrapper } from "@/components/customer/CustomerOnboardingWrapper";
import { useActiveBanners } from "@/hooks/useBanners";
import { useCarListings } from "@/hooks/useCarListings";

// ===============================================
// LAZY LOADED PAGES - Code Splitting for Performance
// Each page loads only when needed, reducing initial bundle
// ===============================================

// Public Pages
const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const CustomerAuth = lazy(() => import("@/pages/CustomerAuth"));
const StaffAuth = lazy(() => import("@/pages/StaffAuth"));
const AdminAuth = lazy(() => import("@/pages/AdminAuth"));
const DealerLogin = lazy(() => import("@/pages/dealer/DealerLogin"));
const DealerStaffLogin = lazy(() => import("@/pages/DealerStaffLogin"));
const NotFound = lazy(() => import("@/pages/NotFound"));
// ... existing imports ...

// ... inside Routes ...

const DealerProfile = lazy(() => import("@/pages/DealerProfile"));
const DealerRegistration = lazy(() => import("@/pages/DealerRegistration"));
const SellCar = lazy(() => import("@/pages/SellCar"));
const CarDetailRoute = lazy(() => import("@/pages/CarDetail.page"));
const LoanDocumentUpload = lazy(() => import("@/pages/loan-upload/LoanDocumentUpload"));

// Customer Pages
const SavedCars = lazy(() => import("@/pages/user/SavedCars"));
const MyCarStatus = lazy(() => import("@/pages/user/MyCarStatus"));
const RecommendedCars = lazy(() => import("@/pages/user/RecommendedCars"));
const UserProfile = lazy(() => import("@/pages/user/Profile"));

// Dashboard Core
const Overview = lazy(() => import("@/pages/dashboard/Overview"));
const DashboardHome = lazy(() => import("@/components/dashboard/DashboardHome").then(m => ({ default: m.DashboardHome })));
const Messages = lazy(() => import("@/pages/dashboard/Messages"));
const Profile = lazy(() => import("@/pages/dashboard/modules/Profile"));
const DashboardLayout = lazy(() => import("@/components/dashboard/DashboardLayout").then(m => ({ default: m.DashboardLayout })));

// PowerDesk Modules
const MasterSetup = lazy(() => import("@/pages/dashboard/modules/MasterSetup"));
const UserManagement = lazy(() => import("@/pages/dashboard/modules/UserManagement"));
const ActivityMonitor = lazy(() => import("@/pages/dashboard/modules/ActivityMonitor"));
const Permissions = lazy(() => import("@/pages/dashboard/modules/Permissions"));
const Reports = lazy(() => import("@/pages/dashboard/modules/Reports"));
const CarListings = lazy(() => import("@/pages/dashboard/modules/CarListings"));

// Website Manager Modules
const Content = lazy(() => import("@/pages/dashboard/modules/Content"));
const Gallery = lazy(() => import("@/pages/dashboard/modules/Gallery"));
const SEO = lazy(() => import("@/pages/dashboard/modules/SEO"));

// Dealer/Sales/Finance/Inspection Modules
const Inventory = lazy(() => import("@/pages/dashboard/modules/Inventory"));
const Leads = lazy(() => import("@/pages/dashboard/modules/Leads"));
const PlaceholderPage = lazy(() => import("@/pages/dashboard/PlaceholderPage"));
const Plans = lazy(() => import("@/pages/dashboard/modules/Plans"));
const SubscriptionManagement = lazy(() => import("@/pages/dashboard/modules/SubscriptionManagement"));
const DemandGapsWrapper = lazy(() => import("@/pages/dashboard/modules/DemandGapsWrapper"));
const Dealers = lazy(() => import("@/pages/dashboard/modules/Dealers"));
const DealerProfileInfo = lazy(() => import("@/pages/dashboard/modules/DealerProfileInfo"));
const DealerProfiles = lazy(() => import("@/pages/dashboard/modules/DealerProfiles"));
const PrintStockList = lazy(() => import("@/pages/dashboard/modules/PrintStockList"));

// Analytics Modules
const LeadIntelligence = lazy(() => import("@/pages/dashboard/modules/LeadIntelligence"));
const DealerAnalytics = lazy(() => import("@/pages/dashboard/modules/DealerAnalytics"));
const MarketIntelligence = lazy(() => import("@/pages/dashboard/modules/MarketIntelligence"));
const AISuggestions = lazy(() => import("@/pages/dashboard/modules/AISuggestions"));
const ConversionAnalytics = lazy(() => import("@/pages/dashboard/modules/ConversionAnalytics"));
const AIInsights = lazy(() => import("@/pages/dashboard/modules/AIInsights"));
const UserIntelligence = lazy(() => import("@/pages/dashboard/modules/UserIntelligence"));
const TestDriveBookings = lazy(() => import("@/pages/dashboard/modules/TestDriveBookings"));
const LoanApplications = lazy(() => import("@/pages/dashboard/modules/finance/LoanApplications"));
const DealerStaffManager = lazy(() => import("@/components/dealer/DealerStaffManager").then(m => ({ default: m.DealerStaffManager })));

// ===============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * DataPreloader - Triggers critical data queries early in the App lifecycle
 * This reduces the data waterfall by starting fetches while pages are lazy-loading
 */
const DataPreloader = () => {
  // Pre-fetch critical marketplace data
  useActiveBanners();
  useCarListings({ status: 'live', pageSize: 12 });
  return null;
};

const AppContent = () => {
  useLocationTracking();
  return (
    <>
      <DataPreloader />
      <Suspense fallback={null}>
        <AIChatWidget />
      </Suspense>
    </>
  );
};


const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
          <TooltipProvider>
            <SkipLink />
            <Toaster />
            <Sonner />
            <AppContent />
            <BrowserRouter>
              <CustomerOnboardingWrapper>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<CustomerAuth />} />
                    <Route path="/old-auth" element={<Auth />} />
                    <Route path="/staff-login" element={<StaffAuth />} />
                    <Route path="/admin-login" element={<AdminAuth />} />
                    <Route path="/dealer-registration" element={<DealerRegistration />} />
                    <Route path="/sell-car" element={<SellCar />} />
                    <Route path="/car/:carId" element={<CarDetailRoute />} />
                    <Route path="/dealer/:dealerId" element={<DealerProfile />} />
                    <Route path="/loan-upload/:token" element={<LoanDocumentUpload />} />

                    {/* Dealer Login - Separate from staff login */}
                    <Route path="/dealer/login" element={<DealerLogin />} />
                    <Route path="/dealer/staff/login" element={<DealerStaffLogin />} />

                    {/* Customer/User Routes - NOT in dashboard */}
                    <Route
                      path="/saved-cars"
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <SavedCars />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/my-car-status"
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <MyCarStatus />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/recommended-cars"
                      element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <RecommendedCars />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <UserProfile />
                        </ProtectedRoute>
                      }
                    />

                    {/* Dashboard Routes - ONLY for staff */}
                    <Route path="/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection', 'dealer_staff']}>
                          <DashboardLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Navigate to="/dashboard/home" replace />} />
                      <Route path="home" element={<DashboardHome />} />
                      <Route path="overview" element={<Overview />} />
                      <Route path="messages" element={<Messages />} />
                      <Route path="profile" element={<Profile />} />

                      {/* PowerDesk Routes */}
                      <Route path="master-setup" element={<MasterSetup />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="dealers" element={<Dealers />} />
                      <Route path="dealer-profiles" element={<DealerProfiles />} />
                      <Route path="dealer-profile-info/:dealerId?" element={<DealerProfileInfo />} />
                      <Route path="activity" element={<ActivityMonitor />} />
                      <Route path="permissions" element={<Permissions />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="car-listings" element={<CarListings />} />

                      {/* Analytics Routes */}
                      <Route path="lead-intelligence" element={<LeadIntelligence />} />
                      <Route path="dealer-analytics" element={<DealerAnalytics />} />
                      <Route path="market-intelligence" element={<MarketIntelligence />} />
                      <Route path="user-intelligence" element={<UserIntelligence />} />
                      <Route path="ai-suggestions" element={<AISuggestions />} />
                      <Route path="conversion-analytics" element={<ConversionAnalytics />} />
                      <Route path="ai-insights" element={<AIInsights />} />

                      {/* Website Manager Routes */}
                      <Route path="content" element={<Content />} />
                      <Route path="gallery" element={<Gallery />} />
                      <Route path="seo" element={<SEO />} />
                      <Route path="master-data" element={<PlaceholderPage title="Master Data" description="View-only access to master data" features={['View cities and locations', 'View brands and models', 'View categories']} />} />
                      <Route path="campaigns" element={<PlaceholderPage title="Campaigns" description="Manage promotional campaigns" features={['Create campaigns', 'Track performance', 'Manage offers']} />} />
                      <Route path="analytics" element={<PlaceholderPage title="Analytics" description="Website analytics and insights" features={['Traffic analytics', 'User behavior', 'Conversion tracking']} />} />

                      {/* Dealer Routes */}
                      <Route path="staff" element={<DealerStaffManager />} />
                      <Route path="inventory" element={<CarListings />} />
                      <Route path="leads" element={<Leads />} />
                      <Route path="my-listings" element={<CarListings />} />
                      <Route
                        path="print-stock-list"
                        element={
                          <ProtectedRoute allowedRoles={['powerdesk', 'dealer']}>
                            <PrintStockList />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="plans" element={<Plans />} />
                      <Route path="subscription-management" element={<SubscriptionManagement />} />
                      <Route path="demand-gaps" element={<DemandGapsWrapper />} />
                      <Route path="test-drive-bookings" element={<TestDriveBookings />} />
                      <Route path="sales-pipeline" element={<PlaceholderPage title="Sales Pipeline" description="Track your sales progress" features={['Pipeline stages', 'Deal tracking', 'Forecasting']} />} />
                      <Route path="finance-requests" element={<PlaceholderPage title="Finance Requests" description="Finance requests for your cars" features={['View requests', 'Track status', 'Approval workflow']} />} />
                      <Route path="inspections" element={<PlaceholderPage title="Inspections" description="Manage vehicle inspections" features={['Request inspections', 'View reports', 'Track status']} />} />

                      {/* Sales Routes */}
                      <Route path="followups" element={<PlaceholderPage title="Follow-ups" description="Manage customer follow-ups" features={['Follow-up tasks', 'Reminders', 'Call logs']} />} />
                      <Route path="customers" element={<PlaceholderPage title="Customers" description="Customer database" features={['Customer profiles', 'Purchase history', 'Preferences']} />} />
                      <Route path="deals" element={<PlaceholderPage title="Deal Pipeline" description="Track deals and conversions" features={['Deal stages', 'Win/loss analysis', 'Revenue forecasting']} />} />
                      <Route path="performance" element={<PlaceholderPage title="Performance" description="Your sales performance metrics" features={['Sales targets', 'Achievements', 'Leaderboards']} />} />

                      {/* Finance Routes */}
                      <Route path="applications" element={<LoanApplications />} />
                      <Route path="finance/applications" element={<LoanApplications />} />
                      <Route path="emi-calculator" element={<PlaceholderPage title="EMI Calculator" description="Calculate loan EMIs" features={['EMI calculation', 'Interest rates', 'Loan comparisons']} />} />
                      <Route path="documents" element={<PlaceholderPage title="Documents" description="Manage loan documents" features={['Upload documents', 'Verification', 'Document tracking']} />} />
                      <Route path="approvals" element={<PlaceholderPage title="Approvals" description="Loan approval workflow" features={['Pending approvals', 'Approve/reject', 'Approval history']} />} />

                      {/* Inspection Routes */}
                      <Route path="inspection-queue" element={<PlaceholderPage title="Inspection Queue" description="Pending inspection requests" features={['View queue', 'Assign inspections', 'Priority management']} />} />
                      <Route path="inspection-reports" element={<PlaceholderPage title="Inspection Reports" description="Create and manage reports" features={['Create reports', 'Upload photos', 'Quality checks']} />} />
                      <Route path="vehicle-history" element={<PlaceholderPage title="Vehicle History" description="Vehicle inspection history" features={['Past inspections', 'Issue tracking', 'Maintenance records']} />} />
                      <Route path="quality-metrics" element={<PlaceholderPage title="Quality Metrics" description="Inspection quality analytics" features={['Quality scores', 'Inspector performance', 'Audit trails']} />} />

                    </Route>

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </CustomerOnboardingWrapper>
            </BrowserRouter>
          </TooltipProvider>
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
