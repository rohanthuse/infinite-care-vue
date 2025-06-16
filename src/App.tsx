

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ClientProvider } from "@/contexts/ClientContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import CarerDashboard from "@/pages/CarerDashboard";
import BranchDashboard from "@/pages/BranchDashboard";
import ClientLogin from "@/pages/ClientLogin";
import CarerLogin from "@/pages/CarerLogin";
import CarerClients from "@/pages/carer/CarerClients";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClientProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/client-login" element={<ClientLogin />} />
                <Route path="/carer-login" element={<CarerLogin />} />
                <Route path="/carer-dashboard/*" element={<CarerDashboard />} />
                <Route path="/branch-dashboard/*" element={<BranchDashboard />} />
                <Route path="/client-dashboard/*" element={<ClientDashboard />} />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </ClientProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
