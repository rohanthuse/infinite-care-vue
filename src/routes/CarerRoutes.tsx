
import { Route, Routes } from "react-router-dom";
import CarerDashboard from "@/pages/CarerDashboard";
import CarerOverview from "@/pages/carer/CarerOverview";
import CarerProfile from "@/pages/carer/CarerProfile";
import CarerSchedule from "@/pages/carer/CarerSchedule";
import CarerAppointments from "@/pages/carer/CarerAppointments";
import CarerCarePlans from "@/pages/carer/CarerCarePlans";
import CarerTasks from "@/pages/carer/CarerTasks";
import CarerNews2 from "@/pages/carer/CarerNews2";
import CarerReports from "@/pages/carer/CarerReports";
import CarerPayments from "@/pages/carer/CarerPayments";
import CarerTraining from "@/pages/carer/CarerTraining";
import CarerClients from "@/pages/carer/CarerClients";
import CarerAttendance from "@/pages/carer/CarerAttendance";
import CarerDocuments from "@/pages/carer/CarerDocuments";

/**
 * CarerRoutes component containing all routes related to the carer dashboard
 * This allows us to keep carer routes separate from other parts of the application
 */
const CarerRoutes = () => {
  return (
    <Route path="/carer-dashboard" element={<CarerDashboard />}>
      <Route index element={<CarerOverview />} />
      <Route path="profile" element={<CarerProfile />} />
      <Route path="schedule" element={<CarerSchedule />} />
      <Route path="appointments" element={<CarerAppointments />} />
      <Route path="careplans" element={<CarerCarePlans />} />
      <Route path="tasks" element={<CarerTasks />} />
      <Route path="news2" element={<CarerNews2 />} />
      <Route path="reports" element={<CarerReports />} />
      <Route path="payments" element={<CarerPayments />} />
      <Route path="training" element={<CarerTraining />} />
      <Route path="clients" element={<CarerClients />} />
      <Route path="attendance" element={<CarerAttendance />} />
      <Route path="documents" element={<CarerDocuments />} />
    </Route>
  );
};

export default CarerRoutes;
