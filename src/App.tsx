
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import BranchDashboard from "./pages/BranchDashboard";
import CarerDashboard from "./pages/CarerDashboard";
import CarerLogin from "./pages/CarerLogin";
import CarerProfile from "./pages/carer/CarerProfile";
import CarerProfilePage from "./pages/CarerProfilePage";
import ClientLogin from "./pages/ClientLogin";
import ClientProfile from "./pages/client/ClientProfile";
import ClientAppointments from "./pages/client/ClientAppointments";
import ClientCarePlans from "./pages/client/ClientCarePlans";
import ClientDocuments from "./pages/client/ClientDocuments";
import ClientEdit from "./pages/client/ClientEdit";
import Attendance from "./pages/Attendance";
import Agreement from "./pages/Agreement";
import Accounting from "./pages/Accounting";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import { AuthProvider } from "./contexts/AuthContext";
import { TaskProvider } from "./contexts/TaskContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TaskProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Super Admin Route */}
              <Route path="/super-admin" element={<SuperAdminLogin />} />
              
              {/* Admin Dashboard Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/branch-dashboard/:id/:branchName/*" element={<BranchDashboard />} />
              
              {/* Carer Routes */}
              <Route path="/carer-login" element={<CarerLogin />} />
              <Route path="/carer-dashboard/*" element={<CarerDashboard />} />
              <Route path="/carer-dashboard/profile" element={<CarerProfile />} />
              
              {/* Individual Carer Profile Route */}
              <Route path="/branch-dashboard/:id/:branchName/carers/:carerId" element={<CarerProfilePage />} />
              
              {/* Client Routes */}
              <Route path="/client-login" element={<ClientLogin />} />
              <Route path="/client-dashboard/profile" element={<ClientProfile />} />
              <Route path="/client-dashboard/appointments" element={<ClientAppointments />} />
              <Route path="/client-dashboard/care-plans" element={<ClientCarePlans />} />
              <Route path="/client-dashboard/documents" element={<ClientDocuments />} />
              
              {/* Client Edit Route */}
              <Route path="/branch-dashboard/:id/:branchName/clients/:clientId/edit" element={<ClientEdit />} />
              
              {/* Standalone Pages */}
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/agreement" element={<Agreement />} />
              <Route path="/accounting" element={<Accounting />} />
            </Routes>
          </TaskProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
