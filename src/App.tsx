
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CarerDashboard from "@/pages/CarerDashboard";
import CarerProfile from "@/pages/carer/CarerProfile";
import CarerClients from "@/pages/carer/CarerClients";
import CarerClientView from "@/pages/carer/CarerClientView";
import CarerCarePlans from "@/pages/carer/CarerCarePlans";
import CarerLogin from "@/pages/CarerLogin";
import CarerSchedule from "@/pages/carer/CarerSchedule";
import CarerAppointments from "@/pages/carer/CarerAppointments";
import CarerTasks from "@/pages/carer/CarerTasks";
import CarerReports from "@/pages/carer/CarerReports";
import CarerPayments from "@/pages/carer/CarerPayments";
import CarerTraining from "@/pages/carer/CarerTraining";
import CarerOverview from "@/pages/carer/CarerOverview";
import CarerActiveVisit from "@/pages/carer/CarerActiveVisit";
import Index from "./pages/Index";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Dashboard from "./pages/Dashboard";
import BranchAdmins from "./pages/BranchAdmins";
import Branch from "./pages/Branch";
import NotFound from "./pages/NotFound";

// Parameter Pages
import KeyParameters from "./pages/KeyParameters";
import Services from "./pages/Services";
import Hobbies from "./pages/Hobbies";
import Skills from "./pages/Skills";
import MedicalMental from "./pages/MedicalMental";
import TypeOfWork from "./pages/TypeOfWork";
import BodyMapPoints from "./pages/BodyMapPoints";

// Admin & Branch Pages
import BranchDashboard from "./pages/BranchDashboard";
import BranchDetails from "./pages/BranchDetails";
import Workflow from "./pages/Workflow";
import Settings from "./pages/Settings";
import Agreement from "./pages/Agreement";

// Feature Pages
import Accounting from "./pages/Accounting";
import Attendance from "./pages/Attendance";
import Documents from "./pages/Documents";
import FormBuilder from "./pages/FormBuilder";
import Library from "./pages/Library";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import TaskMatrix from "./pages/TaskMatrix";
import ThirdPartyAccess from "./pages/ThirdPartyAccess";
import TrainingMatrix from "./pages/TrainingMatrix";
import EventsLogs from "./pages/EventsLogs";
import CarePlanView from "./pages/CarePlanView";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        
        {/* Super Admin Routes */}
        <Route path="/super-admin" element={<SuperAdminLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/branch-admins" element={<BranchAdmins />} />
        <Route path="/branch" element={<Branch />} />
        
        {/* Key Parameter Routes */}
        <Route path="/key-parameters" element={<KeyParameters />} />
        <Route path="/services" element={<Services />} />
        <Route path="/hobbies" element={<Hobbies />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/medical-mental" element={<MedicalMental />} />
        <Route path="/type-of-work" element={<TypeOfWork />} />
        <Route path="/body-map-points" element={<BodyMapPoints />} />
        
        {/* Admin Setting Routes */}
        <Route path="/workflow" element={<Workflow />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/agreement" element={<Agreement />} />
        
        {/* Branch Routes */}
        <Route path="/branch-dashboard" element={<BranchDashboard />} />
        <Route path="/branch-details/:branchId" element={<BranchDetails />} />
        
        {/* Feature Routes */}
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/events-logs" element={<EventsLogs />} />
        <Route path="/form-builder" element={<FormBuilder />} />
        <Route path="/library" element={<Library />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/task-matrix" element={<TaskMatrix />} />
        <Route path="/third-party-access" element={<ThirdPartyAccess />} />
        <Route path="/training-matrix" element={<TrainingMatrix />} />
        <Route path="/careplan/:clientId" element={<CarePlanView />} />
        
        {/* Carer Routes */}
        <Route path="/carer-login" element={<CarerLogin />} />
        
        <Route path="/carer-dashboard" element={<CarerDashboard />}>
          <Route index element={<CarerOverview />} />
          <Route path="profile" element={<CarerProfile />} />
          <Route path="clients" element={<CarerClients />} />
          <Route path="client/:clientId" element={<CarerClientView />} />
          <Route path="careplans" element={<CarerCarePlans />} />
          <Route path="schedule" element={<CarerSchedule />} />
          <Route path="appointments" element={<CarerAppointments />} />
          <Route path="tasks" element={<CarerTasks />} />
          <Route path="reports" element={<CarerReports />} />
          <Route path="payments" element={<CarerPayments />} />
          <Route path="training" element={<CarerTraining />} />
          <Route path="active-visit/:clientId/:appointmentId" element={<CarerActiveVisit />} />
        </Route>

        {/* 404 Route - must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
