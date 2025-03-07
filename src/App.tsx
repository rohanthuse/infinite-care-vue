
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

// Pages
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
import TaskMatrix from "./pages/TaskMatrix";
import TrainingMatrix from "./pages/TrainingMatrix";
import FormMatrix from "./pages/FormMatrix";
import Medication from "./pages/Medication";
import Reviews from "./pages/Reviews";
import Communication from "./pages/Communication";

// Redirect components for consistent routing
const FormsToFormMatrixRedirect = () => {
  const location = useLocation();
  const redirectTo = location.pathname.replace('/forms', '/form-matrix');
  return <Navigate to={redirectTo} />;
};

const WorkflowRedirect = () => {
  return <Navigate to="/workflow/task-matrix" />;
};

// Redirect components for matrix pages and medication
const TaskMatrixRedirect = () => {
  return <Navigate to="/workflow/task-matrix" />;
};

const TrainingMatrixRedirect = () => {
  return <Navigate to="/workflow/training-matrix" />;
};

const FormMatrixRedirect = () => {
  return <Navigate to="/workflow/form-matrix" />;
};

const MedicationRedirect = () => {
  return <Navigate to="/workflow/medication" />;
};

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/super-admin" element={<SuperAdminLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/notifications/:categoryId" element={<Notifications />} />
            <Route path="/services" element={<Services />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/agreement" element={<Agreement />} />
            
            {/* Direct medication access now redirects to workflow section */}
            <Route path="/medication" element={<MedicationRedirect />} />
            
            <Route path="/hobbies" element={<Hobbies />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/medical-mental" element={<MedicalMental />} />
            <Route path="/type-of-work" element={<TypeOfWork />} />
            <Route path="/body-map-points" element={<BodyMapPoints />} />
            <Route path="/branch" element={<Branch />} />
            <Route path="/branch-details/:id" element={<BranchDetails />} />
            <Route path="/branch-admins" element={<BranchAdmins />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/communication" element={<Communication />} />
            
            {/* Global workflow routes */}
            <Route path="/workflow" element={<WorkflowRedirect />} />
            <Route path="/workflow/task-matrix" element={<TaskMatrix />} />
            <Route path="/workflow/training-matrix" element={<TrainingMatrix />} />
            <Route path="/workflow/form-matrix" element={<FormMatrix />} />
            <Route path="/workflow/medication" element={<Medication />} />
            
            {/* Direct access to matrix pages from root now redirects to workflow section */}
            <Route path="/task-matrix" element={<TaskMatrixRedirect />} />
            <Route path="/training-matrix" element={<TrainingMatrixRedirect />} />
            <Route path="/form-matrix" element={<FormMatrixRedirect />} />
            
            {/* Branch-specific routes */}
            <Route path="/branch-dashboard/:id/:branchName" element={<BranchDashboard />} />
            <Route path="/branch-dashboard/:id/:branchName/carers/:carerId" element={<CarerProfilePage />} />
            <Route path="/branch-dashboard/:id/:branchName/recruitment/application/:candidateId" element={<ApplicationDetailsPage />} />
            <Route path="/branch-dashboard/:id/:branchName/recruitment/post-job" element={<PostJobPage />} />
            <Route path="/branch-dashboard/:id/:branchName/notifications" element={<Notifications />} />
            <Route path="/branch-dashboard/:id/:branchName/notifications/:categoryId" element={<Notifications />} />
            <Route path="/branch-dashboard/:id/:branchName/reviews" element={<Reviews />} />
            <Route path="/branch-dashboard/:id/:branchName/communication" element={<Communication />} />
            
            {/* Branch workflow routes */}
            <Route path="/branch-dashboard/:id/:branchName/task-matrix" element={<TaskMatrix />} />
            <Route path="/branch-dashboard/:id/:branchName/training-matrix" element={<TrainingMatrix />} />
            <Route path="/branch-dashboard/:id/:branchName/form-matrix" element={<FormMatrix />} />
            <Route path="/branch-dashboard/:id/:branchName/medication" element={<Medication />} />
            
            {/* Redirect old form route format to the new one */}
            <Route 
              path="/branch-dashboard/:id/:branchName/forms" 
              element={<FormsToFormMatrixRedirect />} 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
