
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AdminRoutes from "./components/AdminRoutes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ClientLogin from "./pages/ClientLogin";
import ClientDashboard from "./pages/ClientDashboard";
import ClientOverview from "./pages/client/ClientOverview";
import ClientAppointments from "./pages/client/ClientAppointments";
import ClientCarePlans from "./pages/client/ClientCarePlans";
import ClientReviews from "./pages/client/ClientReviews";
import ClientPayments from "./pages/client/ClientPayments";
import ClientDocuments from "./pages/client/ClientDocuments";
import ClientServiceReports from "./pages/client/ClientServiceReports";
import ClientMessagesFixed from "./pages/client/ClientMessagesFixed";
import ClientProfile from "./pages/client/ClientProfile";
import ClientSupport from "./pages/client/ClientSupport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/client-login" element={<ClientLogin />} />
            
            {/* Client Dashboard Routes */}
            <Route path="/client-dashboard" element={<ClientDashboard />}>
              <Route index element={<ClientOverview />} />
              <Route path="appointments" element={<ClientAppointments />} />
              <Route path="care-plans" element={<ClientCarePlans />} />
              <Route path="reviews" element={<ClientReviews />} />
              <Route path="payments" element={<ClientPayments />} />
              <Route path="documents" element={<ClientDocuments />} />
              <Route path="service-reports" element={<ClientServiceReports />} />
              <Route path="messages" element={<ClientMessagesFixed />} />
              <Route path="profile" element={<ClientProfile />} />
              <Route path="support" element={<ClientSupport />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={<AdminRoutes />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
