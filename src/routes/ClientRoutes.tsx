
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
import ClientHealthMonitoring from "@/pages/client/ClientHealthMonitoring";
import { Suspense } from "react";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";

// Higher-order component to check client authentication
const RequireClientAuth = () => {
  const { data: authData, isLoading, error } = useSimpleClientAuth();
  
  console.log('[RequireClientAuth] Auth state:', { 
    isLoading, 
    authData: authData ? { 
      userId: authData.user.id, 
      clientId: authData.client.id,
      email: authData.user.email,
      isClient: authData.isClient
    } : null,
    error: error?.message
  });
  
  if (isLoading) {
    return <div>Loading client authentication...</div>;
  }
  
  if (error || !authData || !authData.isClient) {
    console.log('[RequireClientAuth] Redirecting to login - invalid client:', error?.message);
    return <Navigate to="/client-login" replace />;
  }
  
  console.log('[RequireClientAuth] Client authenticated successfully');
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
      <Route path="health-monitoring" element={<ClientHealthMonitoring />} />
      <Route path="messages" element={<ClientMessages />} />
      <Route path="profile" element={<ClientProfile />} />
      <Route path="support" element={<ClientSupport />} />
    </Route>
  </Route>
];

export default ClientRoutes;
