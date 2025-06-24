
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskProvider } from "@/contexts/TaskContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClientAuthProvider } from "@/contexts/ClientAuthContext";
import Index from "./pages/Index";
import CarerLogin from "./pages/CarerLogin";
import CarerLoginSafe from "./pages/CarerLoginSafe";
import CarerInvitation from "./pages/CarerInvitation";
import CarerOnboarding from "./pages/CarerOnboarding";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import ClientLogin from "./pages/ClientLogin";
import AdminRoutes from "./routes/AdminRoutes";
import CarerRoutes from "./routes/CarerRoutes";
import ClientRoutes from "./routes/ClientRoutes";
import { ErrorBoundary } from "@/components/care/ErrorBoundary";

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <TaskProvider>
              <ErrorBoundary fallback={<RoutingErrorFallback />}>
                <Routes>
                  {/* Public Routes - No auth providers */}
                  <Route path="/" element={<Index />} />
                  <Route path="/super-admin" element={<SuperAdminLogin />} />
                  <Route path="/carer-login" element={<CarerLoginSafe />} />
                  <Route path="/carer-invitation" element={<CarerInvitation />} />
                  <Route path="/carer-onboarding" element={<CarerOnboarding />} />
                  <Route path="/client-login" element={<ClientLogin />} />
                  
                  {/* Admin Routes - Only wrapped by AuthProvider */}
                  {AdminRoutes()}
                  
                  {/* Carer Routes - Only wrapped by AuthProvider */}
                  {CarerRoutes()}
                  
                  {/* Client Routes - Wrapped by ClientAuthProvider */}
                  <Route path="/client-dashboard/*" element={
                    <ClientAuthProvider>
                      {ClientRoutes()}
                    </ClientAuthProvider>
                  } />
                  
                  {/* Fallback route for unmatched paths */}
                  <Route path="*" element={<RoutingErrorFallback />} />
                </Routes>
              </ErrorBoundary>
            </TaskProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
