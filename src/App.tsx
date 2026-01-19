import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TaskProvider } from "@/contexts/TaskContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { AuthoritiesProvider } from "@/contexts/AuthoritiesContext";
import { NativeAppProvider } from "@/contexts/NativeAppContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import { NavigationGuard } from "@/components/NavigationGuard";
import { NativeCarerRedirector } from "@/components/native/NativeCarerRedirector";
import Index from "./pages/Index";
import UnifiedLogin from "./components/UnifiedLogin";
import ResetPassword from "./pages/ResetPassword";
import CarerInvitation from "./pages/CarerInvitation";
import CarerOnboarding from "./pages/CarerOnboarding";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import ClientLogin from "./pages/ClientLogin";
import AdminRoutes from "./routes/AdminRoutes";
import CarerRoutes from "./routes/CarerRoutes";
import ClientRoutes from "./routes/ClientRoutes";
import { ErrorBoundary } from "@/components/care/ErrorBoundary";
import { useAuthSafe } from "@/hooks/useAuthSafe";
import { TenantSetup } from "./pages/TenantSetup";
import SystemLogin from "./pages/SystemLogin";
import SystemDashboard from "./pages/SystemDashboard";
import SystemTenants from "./pages/system/SystemTenants";
import SystemUsers from "./pages/system/SystemUsers";
import SystemTenantAgreements from "./pages/system/SystemTenantAgreements";
import SystemSubscriptionPlans from "./pages/system/SystemSubscriptionPlans";
import SystemTemplates from "./pages/system/SystemTemplates";
import SystemTemplateBuilder from "./pages/system/SystemTemplateBuilder";
import SystemAnalytics from "./pages/system/SystemAnalytics";
import SystemSettings from "./pages/system/SystemSettings";
import Dashboard from "./pages/Dashboard";
import TenantLogin from "./pages/TenantLogin";
import TenantClientLogin from "./pages/TenantClientLogin";
import TenantDashboard from "./pages/TenantDashboard";
import { SystemGuard } from "@/components/system/SystemGuard";
import { SystemRoutesLayout } from "@/components/system/SystemRoutesLayout";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";
import { TenantError } from "./pages/TenantError";
import { TenantErrorWrapper } from "@/components/TenantErrorWrapper";
import { TenantRoutesLayout } from "@/components/TenantRoutesLayout";
import { BranchDashboardRedirect } from "@/components/BranchDashboardRedirect";
import { CarerDashboardRedirect } from "@/components/CarerDashboardRedirect";
import DemoRequest from "./pages/DemoRequest";
import { SharedClientProfile } from "./pages/shared/SharedClientProfile";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import CaseStudies from "./pages/CaseStudies";
import Resources from "./pages/Resources";
import AboutUs from "./pages/AboutUs";
import Careers from "./pages/Careers";
import News from "./pages/News";
import Partners from "./pages/Partners";
import HelpCenter from "./pages/HelpCenter";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ThirdPartyWorkspace from "./pages/ThirdPartyWorkspace";
import ThirdPartyLoginPage from "./pages/ThirdPartyLoginPage";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { LoginNavigationInterceptor } from "@/components/LoginNavigationInterceptor";
import { useNotificationEmailSender } from "@/hooks/useNotificationEmailSender";
import { StuckStateRecovery } from "@/components/StuckStateRecovery";

import { queryClient } from "./lib/queryClient";

// Fallback component for routing errors
const RoutingErrorFallback = ({ error, errorInfo }: { error?: Error | null; errorInfo?: React.ErrorInfo | null }) => {
  const clearCacheAndReload = () => {
    console.log('[RoutingErrorFallback] Clearing cache and reloading...');
    sessionStorage.clear();
    localStorage.removeItem('navigating_to_dashboard');
    localStorage.removeItem('target_dashboard');
    localStorage.removeItem('redirect_in_progress');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-lg p-8">
        <h1 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or failed to load.
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-left mb-4">
            <summary className="cursor-pointer font-semibold text-red-700 dark:text-red-400 mb-2">
              Error Details (Dev Mode)
            </summary>
            <div className="text-xs space-y-2">
              <div>
                <strong>Error:</strong>
                <pre className="mt-1 p-2 bg-red-100 dark:bg-red-900 rounded overflow-auto">
                  {error.toString()}
                </pre>
              </div>
              {error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="mt-1 p-2 bg-red-100 dark:bg-red-900 rounded overflow-auto text-xs">
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo?.componentStack && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="mt-1 p-2 bg-red-100 dark:bg-red-900 rounded overflow-auto text-xs">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={clearCacheAndReload}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Clear Cache & Reload
          </button>
          <a
            href="/"
            className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
          >
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};

// Notification email sender component - only initializes when user is authenticated
const NotificationEmailManager = () => {
  useNotificationEmailSender();
  return null;
};

// Inner app component that uses auth context
const AppContent = () => {
  const { loading, error, user } = useAuthSafe();

  console.log('[App] Auth state:', { loading, error: !!error, user: !!user, pathname: window.location.pathname });

  // PHASE 3: Global navigation timeout - clear stuck flags on mount
  React.useEffect(() => {
    console.log('[App] Mounted, checking for stuck navigation flags');
    
    const checkStuckFlags = () => {
      const navigating = sessionStorage.getItem('navigating_to_dashboard');
      const flagTimestamp = sessionStorage.getItem('navigation_flag_timestamp');
      
      if (navigating === 'true') {
        if (flagTimestamp) {
          const age = Date.now() - parseInt(flagTimestamp);
          // Reduced timeout from 3000ms to 2000ms for faster recovery
          if (age > 2000) {
            console.warn('[App] Detected stuck navigation flags (age:', age, 'ms), clearing');
            sessionStorage.removeItem('navigating_to_dashboard');
            sessionStorage.removeItem('target_dashboard');
            sessionStorage.removeItem('redirect_in_progress');
            sessionStorage.removeItem('navigation_flag_timestamp');
          }
        } else {
          // No timestamp but flag is set - clear immediately
          console.warn('[App] Navigation flag without timestamp, clearing immediately');
          sessionStorage.removeItem('navigating_to_dashboard');
          sessionStorage.removeItem('target_dashboard');
          sessionStorage.removeItem('redirect_in_progress');
        }
      }
    };
    
    // Check immediately on mount
    checkStuckFlags();
    
    // Check again after 500ms as failsafe
    const timeoutId = setTimeout(checkStuckFlags, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Show loading screen only for protected routes, not public routes
  const isPublicRoute = [
    '/', 
    '/demo-request',
    '/login',
    '/reset-password',
    '/client-login', 
    '/carer-invitation', 
    '/carer-onboarding',
    '/tenant-setup',
    '/system-login',
    '/features',
    '/pricing',
    '/case-studies',
    '/resources',
    '/about',
    '/careers',
    '/news',
    '/partners',
    '/help-center',
    '/contact',
    '/privacy-policy',
    '/terms-of-service'
  ].includes(window.location.pathname) ||
  window.location.pathname.includes('/login') ||
  window.location.pathname.startsWith('/shared/client/');

  console.log('[App] Route check:', { isPublicRoute, shouldShowLoading: loading && !isPublicRoute });


  if (loading && !isPublicRoute) {
    console.log('[App] Showing loading screen for protected route');
    return <LoadingScreen />;
  }

  return (
    <AuthErrorBoundary error={error}>
      <BrowserRouter>
        <LoginNavigationInterceptor />
        <NavigationProvider>
          <NativeCarerRedirector>
          <AuthoritiesProvider>
          <TaskProvider>
            <ErrorBoundary fallback={(error, errorInfo) => <RoutingErrorFallback error={error} errorInfo={errorInfo} />}>
              <NavigationGuard />
              <PWAInstallPrompt />
              <OfflineIndicator />
              <PWAUpdatePrompt />
              <StuckStateRecovery />
              {user && <NotificationEmailManager />}
              <Routes>
              {/* Public Routes - Always accessible */}
              <Route path="/" element={<Index />} />
              <Route path="/demo-request" element={<DemoRequest />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/case-studies" element={<CaseStudies />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/news" element={<News />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/login" element={
                <ErrorBoundary fallback={
                  <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="text-center max-w-md p-8">
                      <h2 className="text-2xl font-bold text-foreground mb-4">Login Page Error</h2>
                      <p className="text-muted-foreground mb-6">
                        We encountered an issue loading the login page. Please try again.
                      </p>
                      <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                      >
                        Return to Home
                      </button>
                    </div>
                  </div>
                }>
                  <UnifiedLogin />
                </ErrorBoundary>
              } />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Redirect old super-admin route to main page */}
              <Route path="/super-admin" element={<Index />} />
              <Route path="/carer-invitation" element={<CarerInvitation />} />
              <Route path="/carer-onboarding" element={<CarerOnboarding />} />
              <Route path="/client-login" element={<ClientLogin />} />
              <Route path="/tenant-setup" element={<TenantSetup />} />
              <Route path="/tenant-error" element={<TenantError />} />
              {/* System Routes - All wrapped in single SystemAuthProvider via layout */}
              <Route element={<SystemRoutesLayout />}>
                <Route path="/system-login" element={<SystemLogin />} />
                <Route path="/system-dashboard" element={<SystemGuard><SystemDashboard /></SystemGuard>} />
                <Route path="/system-dashboard/tenants" element={<SystemGuard><SystemTenants /></SystemGuard>} />
                <Route path="/system-dashboard/users" element={<SystemGuard><SystemUsers /></SystemGuard>} />
                <Route path="/system-dashboard/tenant-agreements" element={<SystemGuard><SystemTenantAgreements /></SystemGuard>} />
                <Route path="/system-dashboard/subscription-plans" element={<SystemGuard><SystemSubscriptionPlans /></SystemGuard>} />
                <Route path="/system-dashboard/system-templates" element={<SystemGuard><SystemTemplates /></SystemGuard>} />
                <Route path="/system-dashboard/system-templates/:templateId" element={<SystemGuard><SystemTemplateBuilder /></SystemGuard>} />
                <Route path="/system-dashboard/analytics" element={<SystemGuard><SystemAnalytics /></SystemGuard>} />
                <Route path="/system-dashboard/settings" element={<SystemGuard><SystemSettings /></SystemGuard>} />
                <Route path="/system-dashboard/audit" element={<SystemGuard><SystemAnalytics /></SystemGuard>} />
                <Route path="/system-dashboard/database" element={<SystemGuard><SystemAnalytics /></SystemGuard>} />
              </Route>
              
              {/* Shared Client Profile Route - Must be before tenant routes */}
              <Route path="/shared/client/:clientId" element={<SharedClientProfile />} />
              
              {/* Third-Party Routes */}
              <Route path="/third-party/login" element={<ThirdPartyLoginPage />} />
              <Route path="/third-party/workspace" element={<ThirdPartyWorkspace />} />
              
              {/* Main Admin Dashboard Route for Super Admins */}
              <Route path="/dashboard" element={
                <TenantProvider>
                  <SuperAdminGuard>
                    <Dashboard />
                  </SuperAdminGuard>
                </TenantProvider>
              } />
              
              {/* Super Admin tenant-specific dashboard route */}
              <Route path="/super_admin/:tenantSlug/dashboard" element={
                <SuperAdminGuard fallbackPath="/login">
                  <TenantDashboard />
                </SuperAdminGuard>
              } />
              
              {/* Branch Dashboard Redirect - Ensure tenant-aware URLs */}
              <Route path="/branch-dashboard/*" element={<BranchDashboardRedirect />} />
              
              {/* Carer Dashboard Redirect - Ensure tenant-aware URLs */}
              <Route path="/carer-dashboard/*" element={<CarerDashboardRedirect />} />
              
              {/* Tenant Login Routes - Separate from protected routes */}
              <Route path="/:tenantSlug/login" element={
                <TenantProvider>
                  <TenantLogin />
                </TenantProvider>
              } />
              <Route path="/:tenantSlug/client-login" element={
                <TenantProvider>
                  <TenantClientLogin />
                </TenantProvider>
              } />
              
              {/* Tenant-specific Protected Routes - Using Outlet pattern for proper nested route matching */}
              <Route path="/:tenantSlug" element={<TenantRoutesLayout />}>
                {AdminRoutes()}
                {CarerRoutes()}
                {ClientRoutes()}
              </Route>
              
              {/* Redirect non-tenant client dashboard routes */}
              <Route path="/client-dashboard/*" element={
                <Navigate to="/client-login" replace />
              } />
              <Route path="/client-dashboard" element={
                <Navigate to="/client-login" replace />
              } />
              
              {/* Fallback route for unmatched paths */}
              <Route path="*" element={<RoutingErrorFallback />} />
            </Routes>
          </ErrorBoundary>
        </TaskProvider>
          </AuthoritiesProvider>
          </NativeCarerRedirector>
      </NavigationProvider>
      </BrowserRouter>
    </AuthErrorBoundary>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        <NativeAppProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </NativeAppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
