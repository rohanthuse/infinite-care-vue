
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Hobbies from "./pages/Hobbies";
import Skills from "./pages/Skills";
import TypeOfWork from "./pages/TypeOfWork";
import MedicalMental from "./pages/MedicalMental";
import BodyMapPoints from "./pages/BodyMapPoints";
import Branch from "./pages/Branch";
import Services from "./pages/Services";
import BranchAdmins from "./pages/BranchAdmins";
import KeyParameters from "./pages/KeyParameters";
import Agreement from "./pages/Agreement";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import BranchDashboard from "./pages/BranchDashboard";
import BranchDetails from "./pages/BranchDetails";
import Reports from "./pages/Reports";
import Workflow from "./pages/Workflow";
import Attendance from "./pages/Attendance";
import TaskMatrix from "./pages/TaskMatrix";
import Accounting from "./pages/Accounting";
import Documents from "./pages/Documents";
import FormBuilder from "./pages/FormBuilder";
import ThirdPartyAccess from "./pages/ThirdPartyAccess";
import EventsLogs from "./pages/EventsLogs";
import Library from "./pages/Library";
import TrainingMatrix from "./pages/TrainingMatrix";
import Notifications from "./pages/Notifications";
import CarePlanView from "./pages/CarePlanView";
import CarerProfilePage from "./pages/CarerProfilePage";
import News2PatientPage from "./pages/News2PatientPage";

import "./App.css";
import "sonner";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/super-admin-login" element={<SuperAdminLogin />} />
        <Route path="/hobbies" element={<Hobbies />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/type-of-work" element={<TypeOfWork />} />
        <Route path="/medical-mental" element={<MedicalMental />} />
        <Route path="/body-map-points" element={<BodyMapPoints />} />
        <Route path="/branch" element={<Branch />} />
        <Route path="/services" element={<Services />} />
        <Route path="/branch-admins" element={<BranchAdmins />} />
        <Route path="/key-parameters" element={<KeyParameters />} />
        <Route path="/agreement" element={<Agreement />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/branch-dashboard/:id/:branchName" element={<BranchDashboard />} />
        <Route path="/branch-dashboard/:id/:branchName/details" element={<BranchDetails />} />
        <Route path="/branch-dashboard/:id/:branchName/reports" element={<Reports />} />
        <Route path="/branch-dashboard/:id/:branchName/workflow" element={<Workflow />} />
        <Route path="/branch-dashboard/:id/:branchName/attendance" element={<Attendance />} />
        <Route path="/branch-dashboard/:id/:branchName/tasks" element={<TaskMatrix />} />
        <Route path="/branch-dashboard/:id/:branchName/accounting" element={<Accounting />} />
        <Route path="/branch-dashboard/:id/:branchName/bookings" element={<BranchDashboard tab="bookings" />} />
        <Route path="/branch-dashboard/:id/:branchName/care-plan" element={<BranchDashboard tab="care-plan" />} />
        <Route path="/branch-dashboard/:id/:branchName/care-plan/:patientId" element={<CarePlanView />} />
        <Route path="/branch-dashboard/:id/:branchName/documents" element={<Documents />} />
        <Route path="/branch-dashboard/:id/:branchName/form-builder" element={<FormBuilder />} />
        <Route path="/branch-dashboard/:id/:branchName/third-party" element={<ThirdPartyAccess />} />
        <Route path="/branch-dashboard/:id/:branchName/events-logs" element={<EventsLogs />} />
        <Route path="/branch-dashboard/:id/:branchName/library" element={<Library />} />
        <Route path="/branch-dashboard/:id/:branchName/training" element={<TrainingMatrix />} />
        <Route path="/branch-dashboard/:id/:branchName/notifications" element={<Notifications />} />
        <Route path="/branch-dashboard/:id/:branchName/carers" element={<BranchDashboard tab="carers" />} />
        <Route path="/branch-dashboard/:id/:branchName/carers/:carerId" element={<CarerProfilePage />} />
        
        {/* NEWS2 Patient Details Page */}
        <Route path="/branch-dashboard/:id/:branchName/news2/patient/:patientId" element={<News2PatientPage />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
