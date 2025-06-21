
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
import ClientEdit from "@/pages/client/ClientEdit";
import Accounting from "@/pages/Accounting";

const RequireAdminAuth = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    // Redirect to login page if not authenticated
    return <Navigate to="/super-admin-login" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<RequireAdminAuth />}>
        {/* Default admin route redirect */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        
        {/* Dashboard routes */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="notifications/:categoryId" element={<Notifications />} />
        
        {/* Service management routes */}
        <Route path="services" element={<Services />} />
        <Route path="settings" element={<Settings />} />
        <Route path="agreement" element={<Agreement />} />
        <Route path="agreement/:id/:branchName" element={<Agreement />} />
        
        {/* Parameter management routes */}
        <Route path="hobbies" element={<Hobbies />} />
        <Route path="skills" element={<Skills />} />
        <Route path="medical-mental" element={<MedicalMental />} />
        <Route path="type-of-work" element={<TypeOfWork />} />
        <Route path="body-map-points" element={<BodyMapPoints />} />
        
        {/* Branch management routes */}
        <Route path="branch" element={<Branch />} />
        <Route path="branch-details/:id" element={<BranchDetails />} />
        <Route path="branch-admins" element={<BranchAdmins />} />
        
        {/* Workflow and matrix routes */}
        <Route path="workflow" element={<Workflow />} />
        <Route path="workflow/:id/:branchName" element={<Workflow />} />
        <Route path="task-matrix" element={<TaskMatrix branchId="main" branchName="Main Branch" />} />
        <Route path="task-matrix/:id/:branchName" element={<TaskMatrix />} />
        <Route path="training-matrix" element={<TrainingMatrix branchId="main" branchName="Main Branch" />} />
        <Route path="training-matrix/:id/:branchName" element={<TrainingMatrix />} />
        <Route path="key-parameters" element={<KeyParameters />} />
        <Route path="booking-approvals" element={<BookingApprovals />} />
        
        {/* Accounting routes */}
        <Route path="accounting" element={<Accounting />} />
        <Route path="accounting/:id/:branchName" element={<Accounting />} />
        
        {/* Attendance routes */}
        <Route path="attendance" element={<Attendance />} />
        <Route path="attendance/:id/:branchName" element={<Attendance />} />
        
        {/* Events and logs routes */}
        <Route path="events-logs" element={<EventsLogs />} />
        <Route path="events-logs/:id/:branchName" element={<EventsLogs />} />
        
        {/* Form builder routes */}
        <Route path="form-builder" element={<FormBuilder />} />
        <Route path="form-builder/:id/:branchName" element={<FormBuilder />} />
        <Route path="form-builder/:formId" element={<FormBuilder />} />
        <Route path="form-builder/:id/:branchName/:formId" element={<FormBuilder />} />
        
        {/* Documents routes */}
        <Route path="documents" element={<Documents />} />
        <Route path="documents/:id/:branchName" element={<Documents />} />
        
        {/* Library routes */}
        <Route path="library" element={<Library />} />
        <Route path="library/:id/:branchName" element={<Library />} />
        
        {/* Third party access routes */}
        <Route path="third-party" element={<ThirdPartyAccess />} />
        <Route path="third-party/:id/:branchName" element={<ThirdPartyAccess />} />
        
        {/* Reports routes */}
        <Route path="reports" element={<Reports />} />
        <Route path="reports/:id/:branchName" element={<Reports />} />
        
        {/* Notifications with branch context */}
        <Route path="notifications/:id/:branchName" element={<Notifications />} />
        <Route path="notifications/:id/:branchName/:categoryId" element={<Notifications />} />
        
        {/* Branch dashboard routes - Fixed to properly handle nested routing */}
        <Route path="branch-dashboard/:id/:branchName" element={<BranchDashboard />} />
        <Route path="branch-dashboard/:id/:branchName/*" element={<BranchDashboard />} />
        <Route path="branch-dashboard/:id/:branchName/carers/:carerId" element={<CarerProfilePage />} />
        <Route path="branch-dashboard/:id/:branchName/recruitment/application/:candidateId" element={<ApplicationDetailsPage />} />
        <Route path="branch-dashboard/:id/:branchName/recruitment/post-job" element={<PostJobPage />} />
        <Route path="branch-dashboard/:id/:branchName/care-plan/:carePlanId" element={<CarePlanView />} />
        <Route path="branch-dashboard/:id/:branchName/clients/:clientId/edit" element={<ClientEdit />} />
        <Route path="branch-dashboard/:id/:branchName/events-logs" element={<EventsLogs />} />
        <Route path="branch-dashboard/:id/:branchName/attendance" element={<Attendance />} />
        <Route path="branch-dashboard/:id/:branchName/forms" element={<BranchDashboard />} />
        <Route path="branch-dashboard/:id/:branchName/form-builder" element={<FormBuilder />} />
        <Route path="branch-dashboard/:id/:branchName/form-builder/:formId" element={<FormBuilder />} />
        <Route path="branch-dashboard/:id/:branchName/documents" element={<Documents />} />
        <Route path="branch-dashboard/:id/:branchName/library" element={<Library />} />
        <Route path="branch-dashboard/:id/:branchName/third-party" element={<ThirdPartyAccess />} />
        <Route path="branch-dashboard/:id/:branchName/reports" element={<Reports />} />
        <Route path="branch-dashboard/:id/:branchName/accounting" element={<Accounting />} />
        <Route path="branch-dashboard/:id/:branchName/booking-approvals" element={<BookingApprovals />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
