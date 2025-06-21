
import { Routes, Route, Outlet } from "react-router-dom";
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
import Accounting from "@/pages/Accounting";
import ClientEdit from "@/pages/client/ClientEdit";
import { AuthGuard } from "@/components/auth/AuthGuard";

const RequireAdminAuth = () => {
  return (
    <AuthGuard redirectTo="/super-admin-login">
      <Outlet />
    </AuthGuard>
  );
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<RequireAdminAuth />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="branch" element={<Branch />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="notifications/:categoryId" element={<Notifications />} />
        <Route path="services" element={<Services />} />
        <Route path="settings" element={<Settings />} />
        <Route path="agreement" element={<Agreement />} />
        <Route path="hobbies" element={<Hobbies />} />
        <Route path="skills" element={<Skills />} />
        <Route path="medical-mental" element={<MedicalMental />} />
        <Route path="type-of-work" element={<TypeOfWork />} />
        <Route path="body-map-points" element={<BodyMapPoints />} />
        <Route path="branch-details/:id" element={<BranchDetails />} />
        <Route path="branch-admins" element={<BranchAdmins />} />
        <Route path="workflow" element={<Workflow />} />
        <Route path="task-matrix" element={<TaskMatrix branchId="main" branchName="Main Branch" />} />
        <Route path="training-matrix" element={<TrainingMatrix branchId="main" branchName="Main Branch" />} />
        <Route path="key-parameters" element={<KeyParameters />} />
        <Route path="booking-approvals" element={<BookingApprovals />} />
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
        <Route path="branch-dashboard/:id/:branchName/booking-approvals" element={<BookingApprovals />} />
        <Route path="accounting/:id/:branchName" element={<Accounting />} />
        <Route path="accounting/:id/:branchName/:tab" element={<Accounting />} />
        <Route path="reports/:id/:branchName" element={<Reports />} />
        <Route path="reports/:id/:branchName/:tab" element={<Reports />} />
        <Route path="workflow/:id/:branchName" element={<Workflow />} />
        <Route path="workflow/:id/:branchName/:tab" element={<Workflow />} />
        <Route path="training/:id/:branchName" element={<TrainingMatrix />} />
        <Route path="training/:id/:branchName/:tab" element={<TrainingMatrix />} />
        <Route path="tasks/:id/:branchName" element={<TaskMatrix />} />
        <Route path="tasks/:id/:branchName/:tab" element={<TaskMatrix />} />
        <Route path="form-builder/:id/:branchName" element={<FormBuilder />} />
        <Route path="form-builder/:id/:branchName/:tab" element={<FormBuilder />} />
        <Route path="agreement/:id/:branchName" element={<Agreement />} />
        <Route path="agreement/:id/:branchName/:tab" element={<Agreement />} />
        <Route path="attendance/:id/:branchName" element={<Attendance />} />
        <Route path="attendance/:id/:branchName/:tab" element={<Attendance />} />
        <Route path="booking-approvals/:id/:branchName" element={<BookingApprovals />} />
        <Route path="library/:id/:branchName" element={<Library />} />
        <Route path="library/:id/:branchName/:tab" element={<Library />} />
        <Route path="documents/:id/:branchName" element={<Documents />} />
        <Route path="documents/:id/:branchName/:tab" element={<Documents />} />
        <Route path="events-logs/:id/:branchName" element={<EventsLogs />} />
        <Route path="events-logs/:id/:branchName/:tab" element={<EventsLogs />} />
        <Route path="notifications/:id/:branchName" element={<Notifications />} />
        <Route path="notifications/:id/:branchName/:tab" element={<Notifications />} />
        <Route path="care-plan/:id" element={<CarePlanView />} />
        <Route path="carer-profile/:id" element={<CarerProfilePage />} />
        <Route path="third-party/:id/:branchName" element={<ThirdPartyAccess />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
