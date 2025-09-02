
import { Route } from "react-router-dom";
import CarerDashboard from "@/pages/CarerDashboard";
import CarerOverview from "@/pages/carer/CarerOverview";
import CarerMyBookings from "@/pages/carer/CarerMyBookings";
import CarerClients from "@/pages/carer/CarerClients";
import CarerSchedule from "@/pages/carer/CarerSchedule";
import CarerMessages from "@/pages/carer/CarerMessages";
import CarerProfile from "@/pages/carer/CarerProfile";
import CarerTraining from "@/pages/carer/CarerTraining";
import CarerDocuments from "@/pages/carer/CarerDocuments";
import CarerReports from "@/pages/carer/CarerReports";
import CarerPayroll from "@/pages/carer/CarerPayroll";
import CarerAgreements from "@/pages/carer/CarerAgreements";
import { RequireCarerAuth } from "@/components/auth/RequireCarerAuth";

const CarerRoutes = () => [
  <Route key="carer-auth" element={<RequireCarerAuth />}>
    <Route path="carer-dashboard" element={<CarerDashboard />}>
      <Route index element={<CarerOverview />} />
      <Route path="bookings" element={<CarerMyBookings />} />
      <Route path="clients" element={<CarerClients />} />
      <Route path="schedule" element={<CarerSchedule />} />
      <Route path="agreements" element={<CarerAgreements />} />
      <Route path="messages" element={<CarerMessages />} />
      <Route path="training" element={<CarerTraining />} />
      <Route path="documents" element={<CarerDocuments />} />
      <Route path="reports" element={<CarerReports />} />
      <Route path="payroll" element={<CarerPayroll />} />
      <Route path="profile" element={<CarerProfile />} />
    </Route>
  </Route>
];

export default CarerRoutes;
