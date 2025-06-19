
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
import ClientPortal from "./pages/ClientPortal";
import ClientLogin from "./pages/ClientLogin";
import ClientProfile from "./pages/client/ClientProfile";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientAppointments from "./pages/client/ClientAppointments";
import ClientCommunications from "./pages/client/ClientCommunications";
import ClientBilling from "./pages/client/ClientBilling";
import ClientCarePlans from "./pages/client/ClientCarePlans";
import ClientDocuments from "./pages/client/ClientDocuments";
import Attendance from "./pages/Attendance";
import Agreement from "./pages/Agreement";
import Accounting from "./pages/Accounting";
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
              <Route path="/client-portal" element={<ClientPortal />} />
              <Route path="/client-login" element={<ClientLogin />} />
              <Route path="/client-dashboard/*" element={<ClientDashboard />} />
              <Route path="/client-dashboard/profile" element={<ClientProfile />} />
              <Route path="/client-dashboard/appointments" element={<ClientAppointments />} />
              <Route path="/client-dashboard/communications" element={<ClientCommunications />} />
              <Route path="/client-dashboard/billing" element={<ClientBilling />} />
              <Route path="/client-dashboard/care-plans" element={<ClientCarePlans />} />
              <Route path="/client-dashboard/documents" element={<ClientDocuments />} />
              
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
