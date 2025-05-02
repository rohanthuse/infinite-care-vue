
import { Routes, Route, Navigate } from "react-router-dom";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientOverview from "@/pages/client/ClientOverview";
import ClientAppointments from "@/pages/client/ClientAppointments";
import ClientCarePlans from "@/pages/client/ClientCarePlans";
import ClientPayments from "@/pages/client/ClientPayments";
import ClientDocuments from "@/pages/client/ClientDocuments";
import ClientProfile from "@/pages/client/ClientProfile";
import ClientMessages from "@/pages/client/ClientMessages";
import ClientReviews from "@/pages/client/ClientReviews";
import { lazy, Suspense } from "react";

// Higher-order component to check client authentication
const RequireClientAuth = ({ children }: { children: React.ReactNode }) => {
  const isClient = localStorage.getItem("userType") === "client";
  
  if (!isClient) {
    // Redirect to login if not authenticated as client
    return <Navigate to="/client-login" replace />;
  }
  
  return <>{children}</>;
};

// Use suspense to lazy load non-essential components
const LoadingFallback = () => <div className="p-4">Loading...</div>;

// Client routes definition for use in App.tsx
const ClientRoutes = () => {
  return [
    <Route key="client-dashboard" 
      path="/client-dashboard" 
      element={
        <RequireClientAuth>
          <ClientDashboard />
        </RequireClientAuth>
      }
    >
      <Route index element={<ClientOverview />} />
      <Route path="appointments" element={<ClientAppointments />} />
      <Route path="care-plans" element={<ClientCarePlans />} />
      <Route path="reviews" element={<ClientReviews />} />
      <Route path="payments" element={<ClientPayments />} />
      <Route path="documents" element={<ClientDocuments />} />
      <Route path="messages" element={
        <Suspense fallback={<LoadingFallback />}>
          <ClientMessages />
        </Suspense>
      } />
      <Route path="profile" element={<ClientProfile />} />
    </Route>,
    <Route key="client-login" path="/client-login" element={<Navigate to="/client-login" replace />} />
  ];
};

export default ClientRoutes;
