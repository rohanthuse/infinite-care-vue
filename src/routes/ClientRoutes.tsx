
import { Route, Navigate, Outlet } from "react-router-dom";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientOverview from "@/pages/client/ClientOverview";
import ClientAppointments from "@/pages/client/ClientAppointments";
import ClientCarePlans from "@/pages/client/ClientCarePlans";
import ClientPayments from "@/pages/client/ClientPayments";
import ClientDocuments from "@/pages/client/ClientDocuments";
import ClientProfile from "@/pages/client/ClientProfile";
import ClientMessages from "@/pages/client/ClientMessages";
import ClientReviews from "@/pages/client/ClientReviews";
import ClientSupport from "@/pages/client/ClientSupport";
import ClientServiceReports from "@/pages/client/ClientServiceReports";
import { Suspense } from "react";

// Higher-order component to check client authentication
const RequireClientAuth = () => {
  const isClient = localStorage.getItem("userType") === "client";
  
  if (!isClient) {
    // Redirect to login if not authenticated as client
    return <Navigate to="/client-login" replace />;
  }
  
  return <Outlet />;
};

// Use suspense to lazy load non-essential components
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Client routes definition for use in App.tsx - returns array for consistency
const ClientRoutes = () => [
  <Route key="client-auth" element={<RequireClientAuth />}>
    <Route path="/client-dashboard" element={<ClientDashboard />}>
      <Route index element={<ClientOverview />} />
      <Route path="appointments" element={<ClientAppointments />} />
      <Route path="care-plans" element={<ClientCarePlans />} />
      <Route path="reviews" element={<ClientReviews />} />
      <Route path="payments" element={<ClientPayments />} />
      <Route path="documents" element={<ClientDocuments />} />
      <Route path="service-reports" element={<ClientServiceReports />} />
      <Route path="messages" element={
        <Suspense fallback={<LoadingFallback />}>
          <ClientMessages />
        </Suspense>
      } />
      <Route path="profile" element={<ClientProfile />} />
      <Route path="support" element={<ClientSupport />} />
    </Route>
  </Route>
];

export default ClientRoutes;
