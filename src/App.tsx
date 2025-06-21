
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
                
                {/* Legacy admin route redirects */}
                <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/services" element={<Navigate to="/admin/services" replace />} />
                <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
                <Route path="/agreement" element={<Navigate to="/admin/agreement" replace />} />
                <Route path="/hobbies" element={<Navigate to="/admin/hobbies" replace />} />
                <Route path="/skills" element={<Navigate to="/admin/skills" replace />} />
                <Route path="/medical-mental" element={<Navigate to="/admin/medical-mental" replace />} />
                <Route path="/type-of-work" element={<Navigate to="/admin/type-of-work" replace />} />
                <Route path="/body-map-points" element={<Navigate to="/admin/body-map-points" replace />} />
                <Route path="/branch" element={<Navigate to="/admin/branch" replace />} />
                <Route path="/branch-details/:id" element={<Navigate to="/admin/branch-details/:id" replace />} />
                <Route path="/branch-admins" element={<Navigate to="/admin/branch-admins" replace />} />
                <Route path="/workflow" element={<Navigate to="/admin/workflow" replace />} />
                <Route path="/task-matrix" element={<Navigate to="/admin/task-matrix" replace />} />
                <Route path="/training-matrix" element={<Navigate to="/admin/training-matrix" replace />} />
                <Route path="/key-parameters" element={<Navigate to="/admin/key-parameters" replace />} />
                <Route path="/booking-approvals" element={<Navigate to="/admin/booking-approvals" replace />} />
                <Route path="/notifications" element={<Navigate to="/admin/notifications" replace />} />
                
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
