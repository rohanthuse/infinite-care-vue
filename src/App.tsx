
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import BranchDashboard from "./pages/BranchDashboard";
import BranchDetails from "./pages/BranchDetails";
import BranchAdmins from "./pages/BranchAdmins";
import Settings from "./pages/Settings";
import Services from "./pages/Services";
import ClientsList from "./pages/ClientsList";
import MedicalMental from "./pages/MedicalMental";
import BodyMapPoints from "./pages/BodyMapPoints";
import Hobbies from "./pages/Hobbies";
import Skills from "./pages/Skills";
import TypeOfWork from "./pages/TypeOfWork";
import Agreement from "./pages/Agreement";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Branch from "./pages/Branch";
import NotFound from "./pages/NotFound";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/branch-dashboard/:id/:branchName" element={<BranchDashboard />} />
        <Route path="/branch-details/:id/:branchName" element={<BranchDetails />} />
        <Route path="/branch-admins/:id/:branchName" element={<BranchAdmins />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/services/:id/:branchName" element={<Services />} />
        <Route path="/clients/:id/:branchName" element={<ClientsList />} />
        <Route path="/medical-mental/:id/:branchName" element={<MedicalMental />} />
        <Route path="/body-map-points/:id/:branchName" element={<BodyMapPoints />} />
        <Route path="/hobbies/:id/:branchName" element={<Hobbies />} />
        <Route path="/skills/:id/:branchName" element={<Skills />} />
        <Route path="/type-of-work/:id/:branchName" element={<TypeOfWork />} />
        <Route path="/agreement/:id/:branchName" element={<Agreement />} />
        <Route path="/super-admin-login" element={<SuperAdminLogin />} />
        <Route path="/branch" element={<Branch />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
