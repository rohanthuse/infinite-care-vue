import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CarerDashboard from "@/pages/CarerDashboard";
import CarerProfile from "@/pages/carer/CarerProfile";
import CarerClients from "@/pages/carer/CarerClients";
import CarerClientView from "@/pages/carer/CarerClientView";
import CarerCarePlans from "@/pages/carer/CarerCarePlans";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BranchDashboard from "./pages/BranchDashboard";
import CarePlan from "./pages/CarePlan";
import Clients from "./pages/Clients";
import Schedule from "./pages/Schedule";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import CarerLogin from "./pages/CarerLogin";
import ClientDetailView from "./pages/ClientDetailView";
import CarePlanView from "./pages/CarePlanView";
import CarerSchedule from "./pages/carer/CarerSchedule";
import CarerAppointments from "./pages/carer/CarerAppointments";
import CarerCareplans from "./pages/carer/CarerCareplans";
import CarerTasks from "./pages/carer/CarerTasks";
import CarerNews from "./pages/carer/CarerNews";
import CarerReports from "./pages/carer/CarerReports";
import CarerPayments from "./pages/carer/CarerPayments";
import CarerTraining from "./pages/carer/CarerTraining";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/carer-login" element={<CarerLogin />} />

        <Route path="/branch-dashboard/:branchId/:branchName" element={<BranchDashboard />}>
          <Route index element={<div>Branch Dashboard Home</div>} />
          <Route path="care-plan" element={<CarePlan />} />
          <Route path="clients" element={<Clients />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="finance" element={<Finance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/branch-dashboard/:branchId/:branchName/client/:clientId" element={<ClientDetailView />} />
        <Route path="/branch-dashboard/:branchId/:branchName/care-plan/:carePlanId" element={<CarePlanView />} />
        
        <Route path="/carer-dashboard" element={<CarerDashboard />}>
          <Route index element={<div>Carer Dashboard Home</div>} />
          <Route path="profile" element={<CarerProfile />} />
          <Route path="clients" element={<CarerClients />} />
          <Route path="client/:clientId" element={<CarerClientView />} />
          <Route path="careplans" element={<CarerCarePlans />} />
          <Route path="schedule" element={<CarerSchedule />} />
          <Route path="appointments" element={<CarerAppointments />} />
          <Route path="careplans" element={<CarerCareplans />} />
          <Route path="tasks" element={<CarerTasks />} />
          <Route path="news2" element={<CarerNews />} />
          <Route path="reports" element={<CarerReports />} />
          <Route path="payments" element={<CarerPayments />} />
          <Route path="training" element={<CarerTraining />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
