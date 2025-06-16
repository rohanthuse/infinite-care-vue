
import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import CarerLogin from "./pages/CarerLogin";
import ClientLogin from "./pages/ClientLogin";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Settings from "./pages/Settings";
import Hobbies from "./pages/Hobbies";
import Skills from "./pages/Skills";
import MedicalMental from "./pages/MedicalMental";
import TypeOfWork from "./pages/TypeOfWork";
import BodyMapPoints from "./pages/BodyMapPoints";
import Branch from "./pages/Branch";
import BranchDetails from "./pages/BranchDetails";
import BranchDashboard from "./pages/BranchDashboard";
import BranchAdmins from "./pages/BranchAdmins";
import Agreement from "./pages/Agreement";
import CarerProfilePage from "./pages/CarerProfilePage";
import ApplicationDetailsPage from "./components/carers/ApplicationDetailsPage";
import PostJobPage from "./components/carers/PostJobPage";
import Notifications from "./pages/Notifications";
import Workflow from "./pages/Workflow";
import KeyParameters from "./pages/KeyParameters";
import CarePlanView from "./pages/CarePlanView";
import TaskMatrix from "./pages/TaskMatrix";
import TrainingMatrix from "./pages/TrainingMatrix";
import EventsLogs from "./pages/EventsLogs";
import Attendance from "./pages/Attendance";
import FormBuilder from "./pages/FormBuilder";
import Documents from "./pages/Documents";
import Library from "./pages/Library";
import ThirdPartyAccess from "./pages/ThirdPartyAccess";
import Reports from "./pages/Reports";
import BookingApprovals from "./pages/BookingApprovals";

// Import the CarerRoutes component
import CarerRoutes from "./routes/CarerRoutes";

// Import the ClientRoutes component
import ClientRoutes from "./routes/ClientRoutes";

// Import AdminRoutes
import AdminRoutes from "./routes/AdminRoutes";

// Import AuthProvider
import { AuthProvider } from "./contexts/AuthContext";

// Import the TaskProvider context
import { TaskProvider } from "./contexts/TaskContext";

import "./styles/signatures.css"; // Import the signatures styles

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TaskProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/super-admin" element={<SuperAdminLogin />} />
                <Route path="/carer-login" element={<CarerLogin />} />
                <Route path="/client-login" element={<ClientLogin />} />

                {/* Admin Routes are now protected */}
                {AdminRoutes()}
                
                {/* Use the CarerRoutes */}
                {CarerRoutes()}
                
                {/* Use the ClientRoutes */}
                {ClientRoutes()}
                
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
