
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SuperAdminLogin from "./pages/SuperAdminLogin";
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
import { useState } from "react";
import TaskMatrix from "./pages/TaskMatrix";
import Workflow from "./pages/Workflow";
import KeyParameters from "./pages/KeyParameters";
import EventsLogs from "./pages/EventsLogs";

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/super-admin" element={<SuperAdminLogin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/notifications/:categoryId" element={<Notifications />} />
              <Route path="/services" element={<Services />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/agreement" element={<Agreement />} />
              
              <Route path="/hobbies" element={<Hobbies />} />
              <Route path="/skills" element={<Skills />} />
              <Route path="/medical-mental" element={<MedicalMental />} />
              <Route path="/type-of-work" element={<TypeOfWork />} />
              <Route path="/body-map-points" element={<BodyMapPoints />} />
              <Route path="/branch" element={<Branch />} />
              <Route path="/branch-details/:id" element={<BranchDetails />} />
              <Route path="/branch-admins" element={<BranchAdmins />} />
              <Route path="/task-matrix" element={<TaskMatrix />} />
              <Route path="/workflow" element={<Workflow />} />
              <Route path="/key-parameters" element={<KeyParameters />} />
              <Route path="/events-logs" element={<EventsLogs />} />
              
              <Route path="/branch-dashboard/:id/:branchName/*" element={<BranchDashboard />} />
              <Route path="/branch-dashboard/:id/:branchName/carers/:carerId" element={<CarerProfilePage />} />
              <Route path="/branch-dashboard/:id/:branchName/recruitment/application/:candidateId" element={<ApplicationDetailsPage />} />
              <Route path="/branch-dashboard/:id/:branchName/recruitment/post-job" element={<PostJobPage />} />
              <Route path="/branch-dashboard/:id/:branchName/notifications" element={<Notifications />} />
              <Route path="/branch-dashboard/:id/:branchName/notifications/:categoryId" element={<Notifications />} />
              <Route path="/branch-dashboard/:id/:branchName/task-matrix" element={<TaskMatrix />} />
              <Route path="/branch-dashboard/:id/:branchName/workflow" element={<Workflow />} />
              <Route path="/branch-dashboard/:id/:branchName/key-parameters" element={<KeyParameters />} />
              <Route path="/branch-dashboard/:id/:branchName/events-logs" element={<EventsLogs />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
