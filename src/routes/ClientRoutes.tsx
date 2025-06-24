
import { Route, Routes } from "react-router-dom";
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

// Use suspense to lazy load non-essential components
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Client routes definition - returns JSX Routes component
const ClientRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<ClientDashboard />}>
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
    </Routes>
  );
};

export default ClientRoutes;
