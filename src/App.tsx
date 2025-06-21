
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TaskProvider } from "@/contexts/TaskContext";
import Index from "./pages/Index";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import CarerLogin from "./pages/CarerLogin";
import ClientLogin from "./pages/ClientLogin";
import ThirdPartyLogin from "./pages/ThirdPartyLogin";
import ThirdPartyDashboard from "./pages/ThirdPartyDashboard";
import NotFound from "./pages/NotFound";
import AdminRoutes from "./routes/AdminRoutes";
import CarerRoutes from "./routes/CarerRoutes";
import ClientRoutes from "./routes/ClientRoutes";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TaskProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                
                {/* Authentication routes */}
                <Route path="/super-admin-login" element={<SuperAdminLogin />} />
                <Route path="/carer-login" element={<CarerLogin />} />
                <Route path="/client-login" element={<ClientLogin />} />
                <Route path="/third-party-login" element={<ThirdPartyLogin />} />
                <Route path="/third-party-dashboard" element={<ThirdPartyDashboard />} />
                
                {/* Route redirects for common URL patterns */}
                <Route path="/super-admin" element={<Navigate to="/super-admin-login" replace />} />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                
                {/* Admin routes */}
                <Route path="/admin/*" element={<AdminRoutes />} />
                
                {/* Carer routes */}
                <Route path="/carer/*" element={<CarerRoutes />} />
                
                {/* Client routes */}
                <Route path="/client/*" element={<ClientRoutes />} />
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TaskProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
