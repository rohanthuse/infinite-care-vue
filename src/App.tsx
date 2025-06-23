
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClientAuthProvider } from "@/hooks/useClientAuth";
import Index from "@/pages/Index";
import SuperAdminLogin from "@/pages/SuperAdminLogin";
import ClientLogin from "@/pages/ClientLogin";
import CarerLogin from "@/pages/CarerLogin";
import CarerLoginSafe from "@/pages/CarerLoginSafe";
import CarerInvitation from "@/pages/CarerInvitation";
import CarerOnboarding from "@/pages/CarerOnboarding";
import NotFound from "@/pages/NotFound";
import AdminRoutes from "@/routes/AdminRoutes";
import CarerRoutes from "@/routes/CarerRoutes";
import ClientRoutes from "@/routes/ClientRoutes";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClientAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/super-admin" element={<SuperAdminLogin />} />
                <Route path="/client-login" element={<ClientLogin />} />
                <Route path="/carer-login" element={<CarerLogin />} />
                <Route path="/carer-login-safe" element={<CarerLoginSafe />} />
                <Route path="/carer-invitation/:token" element={<CarerInvitation />} />
                <Route path="/carer-onboarding" element={<CarerOnboarding />} />
                {AdminRoutes()}
                {CarerRoutes()}
                {ClientRoutes()}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ClientAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
