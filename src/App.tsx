import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ClientProvider } from "@/contexts/ClientContext";
import Dashboard from "@/pages/Dashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import CarerDashboard from "@/pages/CarerDashboard";
import BranchDashboard from "@/pages/BranchDashboard";
import Login from "@/pages/Login";
import ClientLogin from "@/pages/ClientLogin";
import CarerLogin from "@/pages/CarerLogin";
import BranchLogin from "@/pages/BranchLogin";
import SignUp from "@/pages/SignUp";
import BookingForm from "@/components/BookingForm";
import CarerClients from "@/pages/carer/CarerClients";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClientProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/booking" element={<BookingForm />} />
              <Route path="/client-login" element={<ClientLogin />} />
              <Route path="/carer-login" element={<CarerLogin />} />
              <Route path="/branch-login" element={<BranchLogin />} />
              <Route path="/carer-dashboard/*" element={<CarerDashboard />} />
              <Route path="/branch-dashboard/*" element={<BranchDashboard />} />
              <Route path="/client-dashboard/*" element={<ClientDashboard />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </ClientProvider>
    </QueryClientProvider>
  );
}

export default App;
