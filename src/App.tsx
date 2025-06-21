
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TaskProvider } from "@/contexts/TaskContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Services from "./pages/Services";
import Hobbies from "./pages/Hobbies";
import Skills from "./pages/Skills";
import TypeOfWork from "./pages/TypeOfWork";
import MedicalMental from "./pages/MedicalMental";
import KeyParameters from "./pages/KeyParameters";
import BodyMapPoints from "./pages/BodyMapPoints";
import Branch from "./pages/Branch";
import BranchDetails from "./pages/BranchDetails";
import BranchDashboard from "./pages/BranchDashboard";
import BranchAdmins from "./pages/BranchAdmins";
import Accounting from "./pages/Accounting";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Workflow from "./pages/Workflow";
import TrainingMatrix from "./pages/TrainingMatrix";
import TaskMatrix from "./pages/TaskMatrix";
import FormBuilder from "./pages/FormBuilder";
import Agreement from "./pages/Agreement";
import Attendance from "./pages/Attendance";
import BookingApprovals from "./pages/BookingApprovals";
import Library from "./pages/Library";
import Documents from "./pages/Documents";
import EventsLogs from "./pages/EventsLogs";
import Notifications from "./pages/Notifications";
import ThirdPartyAccess from "./pages/ThirdPartyAccess";
import ThirdPartyLogin from "./pages/ThirdPartyLogin";
import ThirdPartyDashboard from "./pages/ThirdPartyDashboard";
import CarePlanView from "./pages/CarePlanView";
import CarerLogin from "./pages/CarerLogin";
import CarerDashboard from "./pages/CarerDashboard";
import CarerProfilePage from "./pages/CarerProfilePage";
import ClientLogin from "./pages/ClientLogin";
import ClientDashboard from "./pages/ClientDashboard";
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
                <Route path="/super-admin-login" element={<SuperAdminLogin />} />
                <Route path="/carer-login" element={<CarerLogin />} />
                <Route path="/client-login" element={<ClientLogin />} />
                <Route path="/third-party-login" element={<ThirdPartyLogin />} />
                <Route path="/third-party-dashboard" element={<ThirdPartyDashboard />} />
                
                {/* Admin routes */}
                <Route path="/admin/*" element={<AdminRoutes />} />
                
                {/* Carer routes */}
                <Route path="/carer/*" element={<CarerRoutes />} />
                
                {/* Client routes */}
                <Route path="/client/*" element={<ClientRoutes />} />
                
                {/* Protected admin routes - Fix route order to ensure /branch comes before branch-dashboard patterns */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/branch" element={<Branch />} />
                <Route path="/services" element={<Services />} />
                <Route path="/hobbies" element={<Hobbies />} />
                <Route path="/skills" element={<Skills />} />
                <Route path="/type-of-work" element={<TypeOfWork />} />
                <Route path="/medical-mental" element={<MedicalMental />} />
                <Route path="/key-parameters" element={<KeyParameters />} />
                <Route path="/body-map-points" element={<BodyMapPoints />} />
                <Route path="/branch-details/:id" element={<BranchDetails />} />
                
                {/* Branch Dashboard Routes - Main and with tabs */}
                <Route path="/branch-dashboard/:id/:branchName" element={<BranchDashboard />} />
                <Route path="/branch-dashboard/:id/:branchName/:tab" element={<BranchDashboard />} />
                
                {/* Dedicated Branch Pages */}
                <Route path="/branch-admins/:id" element={<BranchAdmins />} />
                <Route path="/accounting/:id/:branchName" element={<Accounting />} />
                <Route path="/accounting/:id/:branchName/:tab" element={<Accounting />} />
                <Route path="/third-party/:id/:branchName" element={<ThirdPartyAccess />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/reports/:id/:branchName" element={<Reports />} />
                <Route path="/reports/:id/:branchName/:tab" element={<Reports />} />
                <Route path="/workflow/:id/:branchName" element={<Workflow />} />
                <Route path="/workflow/:id/:branchName/:tab" element={<Workflow />} />
                <Route path="/training/:id/:branchName" element={<TrainingMatrix />} />
                <Route path="/training/:id/:branchName/:tab" element={<TrainingMatrix />} />
                <Route path="/tasks/:id/:branchName" element={<TaskMatrix />} />
                <Route path="/tasks/:id/:branchName/:tab" element={<TaskMatrix />} />
                <Route path="/form-builder/:id/:branchName" element={<FormBuilder />} />
                <Route path="/form-builder/:id/:branchName/:tab" element={<FormBuilder />} />
                <Route path="/agreement/:id/:branchName" element={<Agreement />} />
                <Route path="/agreement/:id/:branchName/:tab" element={<Agreement />} />
                <Route path="/attendance/:id/:branchName" element={<Attendance />} />
                <Route path="/attendance/:id/:branchName/:tab" element={<Attendance />} />
                <Route path="/booking-approvals/:id/:branchName" element={<BookingApprovals />} />
                <Route path="/library/:id/:branchName" element={<Library />} />
                <Route path="/library/:id/:branchName/:tab" element={<Library />} />
                <Route path="/documents/:id/:branchName" element={<Documents />} />
                <Route path="/documents/:id/:branchName/:tab" element={<Documents />} />
                <Route path="/events-logs/:id/:branchName" element={<EventsLogs />} />
                <Route path="/events-logs/:id/:branchName/:tab" element={<EventsLogs />} />
                <Route path="/notifications/:id/:branchName" element={<Notifications />} />
                <Route path="/notifications/:id/:branchName/:tab" element={<Notifications />} />
                <Route path="/care-plan/:id" element={<CarePlanView />} />
                <Route path="/carer-profile/:id" element={<CarerProfilePage />} />
                
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
