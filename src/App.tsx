
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        
        {/* Super Admin Routes */}
        <Route path="/super-admin" element={<SuperAdminLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/branch-admins" element={<BranchAdmins />} />
        
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
      </Routes>
    </Router>
  );
}

export default App;
