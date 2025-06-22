
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TaskProvider } from "@/contexts/TaskContext";
import Index from "./pages/Index";
import BranchDashboard from "./pages/BranchDashboard";
import CarerLogin from "./pages/CarerLogin";
import CarerLoginSafe from "./pages/CarerLoginSafe";
import CarerInvitation from "./pages/CarerInvitation";
import CarerOnboarding from "./pages/CarerOnboarding";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import ClientLogin from "./pages/ClientLogin";
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
          <TaskProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/super-admin" element={<SuperAdminLogin />} />
              <Route path="/carer-login" element={<CarerLoginSafe />} />
              <Route path="/carer-invitation" element={<CarerInvitation />} />
              <Route path="/carer-onboarding" element={<CarerOnboarding />} />
              <Route path="/client-login" element={<ClientLogin />} />
              
              {/* Include all carer routes with TaskProvider already wrapping them */}
              {CarerRoutes()}
              
              {/* Include all client routes */}
              {ClientRoutes()}
              
              {/* Admin routes - includes all branch dashboard specific routes */}
              {AdminRoutes}
              
              {/* Fallback route for branch dashboard */}
              <Route path="/branch-dashboard/:id/:branchName/*" element={<BranchDashboard />} />
            </Routes>
          </TaskProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
