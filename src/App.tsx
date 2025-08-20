
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TaskProvider } from "@/contexts/TaskContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { SystemAuthProvider } from "@/contexts/SystemAuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import Index from "./pages/Index";
import UnifiedLogin from "./components/UnifiedLogin";
import CarerLogin from "./pages/CarerLogin";
import CarerLoginSafe from "./pages/CarerLoginSafe";
import CarerInvitation from "./pages/CarerInvitation";
import CarerOnboarding from "./pages/CarerOnboarding";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import BranchAdminLogin from "./pages/BranchAdminLogin";
import BranchSelection from "./pages/BranchSelection";
import ClientLogin from "./pages/ClientLogin";
import AdminRoutes from "./routes/AdminRoutes";
import CarerRoutes from "./routes/CarerRoutes";
import ClientRoutes from "./routes/ClientRoutes";
import { ErrorBoundary } from "@/components/care/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { TenantSetup } from "./pages/TenantSetup";
import SystemLogin from "./pages/SystemLogin";
import SystemDashboard from "./pages/SystemDashboard";
import SystemTenants from "./pages/system/SystemTenants";
import SystemUsers from "./pages/system/SystemUsers";
import SystemAnalytics from "./pages/system/SystemAnalytics";
import SystemSettings from "./pages/system/SystemSettings";
import TenantLogin from "./pages/TenantLogin";
import TenantClientLogin from "./pages/TenantClientLogin";
import TenantCarerLogin from "./pages/TenantCarerLogin";
import TenantDashboard from "./pages/TenantDashboard";
import { SystemGuard } from "@/components/system/SystemGuard";
import { TenantError } from "./pages/TenantError";
import { TenantErrorWrapper } from "@/components/TenantErrorWrapper";
import { BranchDashboardRedirect } from "@/components/BranchDashboardRedirect";
import { CarerDashboardRedirect } from "@/components/CarerDashboardRedirect";
import DemoRequest from "./pages/DemoRequest";
import { SharedClientProfile } from "./pages/shared/SharedClientProfile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

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
  const { loading, error } = useAuth();

  // Show loading screen only for protected routes, not public routes
  const isPublicRoute = [
    '/', 
    '/demo-request',
    '/login',
    '/branch-admin-login',
    '/branch-selection',
    '/carer-login', 
    '/client-login', 
    '/carer-invitation', 
    '/carer-onboarding',
    '/tenant-setup',
    '/system-login'
  ].includes(window.location.pathname) || 
  window.location.pathname.includes('/login') ||
  window.location.pathname.startsWith('/shared/client/');

  if (loading && !isPublicRoute) {
    return <LoadingScreen />;
  }

  return (
    <AuthErrorBoundary error={error}>
      <BrowserRouter>
        <TaskProvider>
          <ErrorBoundary fallback={<RoutingErrorFallback />}>
            <Routes>
              {/* Public Routes - Always accessible */}
              <Route path="/" element={<Index />} />
              <Route path="/demo-request" element={<DemoRequest />} />
              <Route path="/login" element={<UnifiedLogin />} />
              {/* Redirect old super-admin route to main page */}
              <Route path="/super-admin" element={<Index />} />
              <Route path="/branch-admin-login" element={<BranchAdminLogin />} />
              <Route path="/branch-selection" element={<BranchSelection />} />
              <Route path="/carer-login" element={<CarerLoginSafe />} />
              <Route path="/carer-invitation" element={<CarerInvitation />} />
              <Route path="/carer-onboarding" element={<CarerOnboarding />} />
              <Route path="/client-login" element={<ClientLogin />} />
              <Route path="/tenant-setup" element={<TenantSetup />} />
              <Route path="/tenant-error" element={<TenantError />} />
              <Route path="/system-login" element={<SystemLogin />} />
              
              {/* Shared Client Profile Route - Must be before tenant routes */}
              <Route path="/shared/client/:clientId" element={<SharedClientProfile />} />
              
              {/* System Dashboard Routes */}
              <Route path="/system-dashboard" element={
                <SystemGuard>
                  <SystemDashboard />
                </SystemGuard>
              } />
              <Route path="/system-dashboard/tenants" element={
                <SystemGuard>
                  <SystemTenants />
                </SystemGuard>
              } />
              <Route path="/system-dashboard/users" element={
                <SystemGuard>
                  <SystemUsers />
                </SystemGuard>
              } />
              <Route path="/system-dashboard/analytics" element={
                <SystemGuard>
                  <SystemAnalytics />
                </SystemGuard>
              } />
              <Route path="/system-dashboard/settings" element={
                <SystemGuard>
                  <SystemSettings />
                </SystemGuard>
              } />
              <Route path="/system-dashboard/audit" element={
                <SystemGuard>
                  <SystemAnalytics />
                </SystemGuard>
              } />
              <Route path="/system-dashboard/database" element={
                <SystemGuard>
                  <SystemAnalytics />
                </SystemGuard>
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
              <Route path="/:tenantSlug/carer-login" element={
                <TenantProvider>
                  <TenantCarerLogin />
                </TenantProvider>
              } />
              
              {/* Tenant Dashboard Route */}
              <Route path="/:tenantSlug/dashboard" element={
                <TenantProvider>
                  <TenantErrorWrapper>
                    <TenantDashboard />
                  </TenantErrorWrapper>
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
          <SystemAuthProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <AppContent />
            </AuthProvider>
          </SystemAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
