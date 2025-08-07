
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskProvider } from "@/contexts/TaskContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { SystemAuthProvider } from "@/contexts/SystemAuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import Index from "./pages/Index";
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
import { SystemGuard } from "@/components/system/SystemGuard";

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
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
      <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
      <a href="/" className="text-blue-600 hover:text-blue-800 underline">
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
    '/super-admin', 
    '/branch-admin-login',
    '/branch-selection',
    '/carer-login', 
    '/client-login', 
    '/carer-invitation', 
    '/carer-onboarding',
    '/tenant-setup',
    '/system-login'
  ].includes(window.location.pathname);

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
              <Route path="/super-admin" element={<SuperAdminLogin />} />
              <Route path="/branch-admin-login" element={<BranchAdminLogin />} />
              <Route path="/branch-selection" element={<BranchSelection />} />
              <Route path="/carer-login" element={<CarerLoginSafe />} />
              <Route path="/carer-invitation" element={<CarerInvitation />} />
              <Route path="/carer-onboarding" element={<CarerOnboarding />} />
              <Route path="/client-login" element={<ClientLogin />} />
              <Route path="/tenant-setup" element={<TenantSetup />} />
              <Route path="/system-login" element={<SystemLogin />} />
              
              {/* System Dashboard Routes */}
              <Route path="/system-dashboard" element={
                <SystemGuard>
                  <SystemDashboard />
                </SystemGuard>
              } />
              <Route path="/system-dashboard/*" element={
                <SystemGuard>
                  <SystemDashboard />
                </SystemGuard>
              } />
              
              {/* Protected Routes */}
              {AdminRoutes()}
              {CarerRoutes()}
              {ClientRoutes()}
              
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
      <TooltipProvider>
        <SystemAuthProvider>
          <AuthProvider>
            <TenantProvider>
              <Toaster />
              <Sonner />
              <AppContent />
            </TenantProvider>
          </AuthProvider>
        </SystemAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
