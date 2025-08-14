
import { Route, Navigate, Outlet } from "react-router-dom";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";
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
import CarerVisitWorkflow from "@/pages/carer/CarerVisitWorkflow";
import CarerAssignedForms from "@/pages/carer/CarerAssignedForms";

const RequireCarerAuth = () => {
  const { isAuthenticated, loading } = useCarerAuthSafe();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Get tenant slug from current path for redirection
    const tenantSlug = window.location.pathname.split('/')[1];
    return <Navigate to={`/${tenantSlug}/carer-login`} replace />;
  }

  return <Outlet />;
};

/**
 * CarerRoutes component containing all routes related to the carer dashboard
 * Returns an array of Route elements for consistent usage in App.tsx
 */
const CarerRoutes = () => [
  <Route key="carer-auth" element={<RequireCarerAuth />}>
    <Route path="carer-dashboard" element={<CarerDashboard />}>
      <Route index element={<CarerOverview />} />
      <Route path="profile" element={<CarerProfile />} />
      <Route path="schedule" element={<CarerSchedule />} />
      <Route path="appointments" element={<CarerAppointments />} />
      <Route path="careplans" element={<CarerCarePlans />} />
      <Route path="forms" element={<CarerAssignedForms />} />
      <Route path="tasks" element={<CarerTasks />} />
      <Route path="news2" element={<CarerNews2 />} />
      <Route path="reports" element={<CarerReports />} />
      <Route path="payments" element={<CarerPayments />} />
      <Route path="training" element={<CarerTraining />} />
      <Route path="clients" element={<CarerClients />} />
      <Route path="attendance" element={<CarerAttendance />} />
      <Route path="documents" element={<CarerDocuments />} />
      <Route path="visit/:appointmentId" element={<CarerVisitWorkflow />} />
    </Route>
  </Route>
];

export default CarerRoutes;
