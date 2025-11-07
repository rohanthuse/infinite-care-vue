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
import { LoadingScreen } from "@/components/LoadingScreen";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import { NavigationGuard } from "@/components/NavigationGuard";
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
import { useAuth } from "@/contexts/UnifiedAuthProvider";
import { TenantSetup } from "./pages/TenantSetup";
import SystemLogin from "./pages/SystemLogin";
import SystemDashboard from "./pages/SystemDashboard";
import SystemTenants from "./pages/system/SystemTenants";
import SystemUsers from "./pages/system/SystemUsers";
import SystemAnalytics from "./pages/system/SystemAnalytics";
import SystemSettings from "./pages/system/SystemSettings";
import Dashboard from "./pages/Dashboard";
import TenantLogin from "./pages/TenantLogin";
import TenantClientLogin from "./pages/TenantClientLogin";
import TenantDashboard from "./pages/TenantDashboard";
import { SystemGuard } from "@/components/system/SystemGuard";
import { SystemAuthProvider } from "@/contexts/SystemAuthContext";
import { SuperAdminGuard } from "@/components/SuperAdminGuard";
import { TenantError } from "./pages/TenantError";
import { TenantErrorWrapper } from "@/components/TenantErrorWrapper";
import { BranchDashboardRedirect } from "@/components/BranchDashboardRedirect";
import { CarerDashboardRedirect } from "@/components/CarerDashboardRedirect";
import DemoRequest from "./pages/DemoRequest";
import { SharedClientProfile } from "./pages/shared/SharedClientProfile";
import ThirdPartyWorkspace from "./pages/ThirdPartyWorkspace";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { LoginNavigationInterceptor } from "@/components/LoginNavigationInterceptor";

import { queryClient } from "./lib/queryClient";

// Fallback component for routing errors
const RoutingErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h1>
      <p className="text-muted-foreground mb-4">The page you're looking for doesn't exist.</p>
      <a href="/" className="text-primary hover:text-primary/80 underline">
        Return to Home
      </a>
    </div>
  </div>
);

// Inner app component that uses auth context
const AppContent = () => {
  const { loading, error, user } = useAuth();

  console.log('[App] Auth state:', { loading, error: !!error, user: !!user, pathname: window.location.pathname });

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
    '/system-login'
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
          <TaskProvider>
            <ErrorBoundary fallback={<RoutingErrorFallback />}>
              <NavigationGuard />
              <PWAInstallPrompt />
              <OfflineIndicator />
              <PWAUpdatePrompt />
              <Routes>
              {/* Public Routes - Always accessible */}
              <Route path="/" element={<Index />} />
              <Route path="/demo-request" element={<DemoRequest />} />
              <Route path="/login" element={<UnifiedLogin />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Redirect old super-admin route to main page */}
              <Route path="/super-admin" element={<Index />} />
              <Route path="/carer-invitation" element={<CarerInvitation />} />
              <Route path="/carer-onboarding" element={<CarerOnboarding />} />
              <Route path="/client-login" element={<ClientLogin />} />
              <Route path="/tenant-setup" element={<TenantSetup />} />
              <Route path="/tenant-error" element={<TenantError />} />
              <Route path="/system-login" element={
                <SystemAuthProvider>
                  <SystemLogin />
                </SystemAuthProvider>
              } />
              
              {/* Shared Client Profile Route - Must be before tenant routes */}
              <Route path="/shared/client/:clientId" element={<SharedClientProfile />} />
              
              {/* Third-Party Workspace Route */}
              <Route path="/third-party/workspace" element={<ThirdPartyWorkspace />} />
              
              {/* System Dashboard Routes */}
              <Route path="/system-dashboard" element={
                <SystemAuthProvider>
                  <SystemGuard>
                    <SystemDashboard />
                  </SystemGuard>
                </SystemAuthProvider>
              } />
              <Route path="/system-dashboard/tenants" element={
                <SystemAuthProvider>
                  <SystemGuard>
                    <SystemTenants />
                  </SystemGuard>
                </SystemAuthProvider>
              } />
              <Route path="/system-dashboard/users" element={
                <SystemAuthProvider>
                  <SystemGuard>
                    <SystemUsers />
                  </SystemGuard>
                </SystemAuthProvider>
              } />
              <Route path="/system-dashboard/analytics" element={
                <SystemAuthProvider>
                  <SystemGuard>
                    <SystemAnalytics />
                  </SystemGuard>
                </SystemAuthProvider>
              } />
              <Route path="/system-dashboard/settings" element={
                <SystemAuthProvider>
                  <SystemGuard>
                    <SystemSettings />
                  </SystemGuard>
                </SystemAuthProvider>
              } />
              <Route path="/system-dashboard/audit" element={
                <SystemAuthProvider>
                  <SystemGuard>
                    <SystemAnalytics />
                  </SystemGuard>
                </SystemAuthProvider>
              } />
              <Route path="/system-dashboard/database" element={
                <SystemAuthProvider>
                  <SystemGuard>
                    <SystemAnalytics />
                  </SystemGuard>
                </SystemAuthProvider>
              } />
              
              {/* Main Admin Dashboard Route for Super Admins */}
              <Route path="/dashboard" element={
                <SuperAdminGuard>
                  <Dashboard />
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
              
              {/* Tenant-specific Protected Routes */}
              <Route path="/:tenantSlug/*" element={
                <TenantProvider>
                  <TenantErrorWrapper>
                    <Routes>
                      {AdminRoutes()}
                      {CarerRoutes()}
                      {ClientRoutes()}
                    </Routes>
                  </TenantErrorWrapper>
                </TenantProvider>
              } />
              
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
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
