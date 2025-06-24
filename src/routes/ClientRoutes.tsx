
import { Routes, Route } from "react-router-dom";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientOverview from "@/pages/client/ClientOverview";
import ClientAppointments from "@/pages/client/ClientAppointments";
import ClientCarePlans from "@/pages/client/ClientCarePlans";
import ClientReviews from "@/pages/client/ClientReviews";
import ClientPayments from "@/pages/client/ClientPayments";
import ClientDocuments from "@/pages/client/ClientDocuments";
import ClientServiceReports from "@/pages/client/ClientServiceReports";
import ClientMessages from "@/pages/client/ClientMessages";
import ClientEdit from "@/pages/client/ClientEdit";
import ClientSupport from "@/pages/client/ClientSupport";

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
        <Route path="messages" element={<ClientMessages />} />
        <Route path="profile" element={<ClientEdit />} />
        <Route path="support" element={<ClientSupport />} />
      </Route>
    </Routes>
  );
};

export default ClientRoutes;
