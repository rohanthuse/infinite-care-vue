import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect } from "react";
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
import BranchAgreements from "@/pages/BranchAgreements";
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
import OrganizationCalendar from "@/pages/OrganizationCalendar";
import TenantLogin from "@/pages/TenantLogin";
import TenantDashboard from "@/pages/TenantDashboard";
import { BranchSidebarProvider } from "@/components/branch-dashboard/BranchSidebarProvider";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import StaffFormsManagement from "@/pages/StaffFormsManagement";
import CarerFillForm from "@/pages/carer/CarerFillForm";

const BranchAdminRedirector = () => {
  const { data: userRole } = useUserRole();
  
  useEffect(() => {
    // Only redirect branch admins to their specific branch
    // Super admins should stay on the main dashboard
    if (userRole?.role === 'branch_admin' && userRole?.branchId) {
      const branchId = userRole.branchId;
      const branchName = localStorage.getItem("currentBranchName") || "Branch";
      const encodedBranchName = encodeURIComponent(branchName);
      
      // Redirect to their assigned branch dashboard - will need tenant context
      const tenantSlug = window.location.pathname.split('/')[1];
      if (tenantSlug) {
        window.location.replace(`/${tenantSlug}/branch-dashboard/${branchId}/${encodedBranchName}`);
      } else {
        // Fallback - this shouldn't happen in path-based routing
        window.location.replace(`/branch-dashboard/${branchId}/${encodedBranchName}`);
      }
    }
  }, [userRole]);

  // Show loading while checking user role
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // For both super admins and branch admins, render the tenant dashboard
  return <TenantDashboard />;
};

const RequireAdminAuth = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

const AdminRoutes = () => [
  <Route key="admin-auth" element={<RequireAdminAuth />}>
    {/* Tenant-specific routes - these work within a tenant context */}
    <Route path="admin" element={<BranchAdminRedirector />} />
    <Route path="dashboard" element={<BranchAdminRedirector />} />
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
    <Route path="branch" element={<Branch />} />
    <Route path="branch-details/:id" element={<BranchDetails />} />
    <Route path="branch-admins" element={<BranchAdmins />} />
    <Route path="workflow" element={<Workflow />} />
    <Route path="staff-forms" element={<StaffFormsManagement />} />
    <Route path="task-matrix" element={<TaskMatrix branchId="main" branchName="Main Branch" />} />
    <Route path="training-matrix" element={<TrainingMatrix branchId="main" branchName="Main Branch" />} />
    <Route path="key-parameters" element={<KeyParameters />} />
    <Route path="booking-approvals" element={<BookingApprovals />} />
    
    {/* Branch Dashboard Routes - All wrapped with persistent sidebar */}
    <Route path="branch-dashboard/:id/:branchName/*" element={
      <BranchSidebarProvider>
        <Routes>
          <Route path="" element={<BranchDashboard />} />
          <Route path="dashboard" element={<BranchDashboard />} />
          <Route path="key-parameters" element={<BranchDashboard />} />
          <Route path="workflow" element={<BranchDashboard />} />
          <Route path="task-matrix" element={<BranchDashboard />} />
          <Route path="training-matrix" element={<BranchDashboard />} />
          <Route path="bookings" element={<BranchDashboard />} />
          <Route path="carers" element={<BranchDashboard />} />
          <Route path="clients" element={<BranchDashboard />} />
          <Route path="care-plan" element={<BranchDashboard />} />
          <Route path="reviews" element={<BranchDashboard />} />
          <Route path="communication" element={<BranchDashboard />} />
          <Route path="medication" element={<BranchDashboard />} />
          <Route path="finance" element={<Accounting />} />
          <Route path="notifications" element={<BranchDashboard />} />
          <Route path="notifications/:categoryId" element={<BranchDashboard />} />
          
          {/* Standalone pages using BranchLayout */}
          <Route path="accounting" element={<Accounting />} />
          <Route path="agreements" element={<BranchAgreements />} />
          <Route path="forms" element={<FormBuilder />} />
          
          {/* Specific Branch Dashboard Sub-pages */}
          <Route path="carers/:carerId" element={<CarerProfilePage />} />
          <Route path="recruitment/application/:candidateId" element={<ApplicationDetailsPage />} />
          <Route path="recruitment/post-job" element={<PostJobPage />} />
          <Route path="care-plan/:carePlanId" element={<CarePlanView />} />
          <Route path="organization-calendar" element={<OrganizationCalendar />} />
          <Route path="events-logs" element={<EventsLogs />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="form-builder" element={<FormBuilder />} />
          <Route path="form-builder/:formId" element={<FormBuilder />} />
          <Route path="forms/fill/:formId" element={<CarerFillForm />} />
          <Route path="documents" element={<Documents />} />
          <Route path="library" element={<Library />} />
          <Route path="third-party" element={<ThirdPartyAccess />} />
          <Route path="reports" element={<Reports />} />
          <Route path="booking-approvals" element={<BookingApprovals />} />
        </Routes>
      </BranchSidebarProvider>
    } />
  </Route>
];

export default AdminRoutes;
