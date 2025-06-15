
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/Dashboard";
import Services from "@/pages/Services";
import Settings from "@/pages/Settings";
import Hobbies from "@/pages/Hobbies";
import Skills from "@/pages/Skills";
import MedicalMental from "@/pages/MedicalMental";
import TypeOfWork from "@/pages/TypeOfWork";
import BodyMapPoints from "@/pages/BodyMapPoints";
import Branch from "@/pages/Branch";
import BranchDetails from "@/pages/BranchDetails";
import BranchDashboard from "@/pages/BranchDashboard";
import BranchAdmins from "@/pages/BranchAdmins";
import Agreement from "@/pages/Agreement";
import CarerProfilePage from "@/pages/CarerProfilePage";
import ApplicationDetailsPage from "@/components/carers/ApplicationDetailsPage";
import PostJobPage from "@/components/carers/PostJobPage";
import Notifications from "@/pages/Notifications";
import Workflow from "@/pages/Workflow";
import KeyParameters from "@/pages/KeyParameters";
import CarePlanView from "@/pages/CarePlanView";
import TaskMatrix from "@/pages/TaskMatrix";
import TrainingMatrix from "@/pages/TrainingMatrix";
import EventsLogs from "@/pages/EventsLogs";
import Attendance from "@/pages/Attendance";
import FormBuilder from "@/pages/FormBuilder";
import Documents from "@/pages/Documents";
import Library from "@/pages/Library";
import ThirdPartyAccess from "@/pages/ThirdPartyAccess";
import Reports from "@/pages/Reports";
import BookingApprovals from "@/pages/BookingApprovals";

const RequireAdminAuth = () => {
  const { session, loading } = useAuth();

  if (loading) {
    // You can replace this with a beautiful spinner
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    // Redirect to login page if not authenticated
    return <Navigate to="/super-admin" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

const AdminRoutes = () => {
  return (
    <Route element={<RequireAdminAuth />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/notifications/:categoryId" element={<Notifications />} />
      <Route path="/services" element={<Services />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/agreement" element={<Agreement />} />
      <Route path="/hobbies" element={<Hobbies />} />
      <Route path="/skills" element={<Skills />} />
      <Route path="/medical-mental" element={<MedicalMental />} />
      <Route path="/type-of-work" element={<TypeOfWork />} />
      <Route path="/body-map-points" element={<BodyMapPoints />} />
      <Route path="/branch" element={<Branch />} />
      <Route path="/branch-details/:id" element={<BranchDetails />} />
      <Route path="/branch-admins" element={<BranchAdmins />} />
      <Route path="/workflow" element={<Workflow />} />
      <Route path="/task-matrix" element={<TaskMatrix branchId="main" branchName="Main Branch" />} />
      <Route path="/training-matrix" element={<TrainingMatrix branchId="main" branchName="Main Branch" />} />
      <Route path="/key-parameters" element={<KeyParameters />} />
      <Route path="/booking-approvals" element={<BookingApprovals />} />
      <Route path="/branch-dashboard/:id/:branchName" element={<BranchDashboard />} />
      <Route path="/branch-dashboard/:id/:branchName/*" element={<BranchDashboard />} />
      <Route path="/branch-dashboard/:id/:branchName/carers/:carerId" element={<CarerProfilePage />} />
      <Route path="/branch-dashboard/:id/:branchName/recruitment/application/:candidateId" element={<ApplicationDetailsPage />} />
      <Route path="/branch-dashboard/:id/:branchName/recruitment/post-job" element={<PostJobPage />} />
      <Route path="/branch-dashboard/:id/:branchName/care-plan/:carePlanId" element={<CarePlanView />} />
      <Route path="/branch-dashboard/:id/:branchName/events-logs" element={<EventsLogs />} />
      <Route path="/branch-dashboard/:id/:branchName/attendance" element={<Attendance />} />
      <Route path="/branch-dashboard/:id/:branchName/form-builder" element={<FormBuilder />} />
      <Route path="/branch-dashboard/:id/:branchName/form-builder/:formId" element={<FormBuilder />} />
      <Route path="/branch-dashboard/:id/:branchName/documents" element={<Documents />} />
      <Route path="/branch-dashboard/:id/:branchName/library" element={<Library />} />
      <Route path="/branch-dashboard/:id/:branchName/third-party" element={<ThirdPartyAccess />} />
      <Route path="/branch-dashboard/:id/:branchName/reports" element={<Reports />} />
      <Route path="/branch-dashboard/:id/:branchName/booking-approvals" element={<BookingApprovals />} />
    </Route>
  );
};

export default AdminRoutes;
