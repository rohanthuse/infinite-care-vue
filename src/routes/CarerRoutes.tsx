import { Route, Navigate, Outlet } from "react-router-dom";
import { useUnifiedCarerAuth } from "@/hooks/useUnifiedCarerAuth";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, LogOut } from "lucide-react";
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
import CarerClientDetail from "@/pages/carer/CarerClientDetail";
import CarerAttendance from "@/pages/carer/CarerAttendance";
import CarerDocuments from "@/pages/carer/CarerDocuments";
import CarerVisitWorkflow from "@/pages/carer/CarerVisitWorkflow";
import CarerAssignedForms from "@/pages/carer/CarerAssignedForms";
import CarerFillForm from "@/pages/carer/CarerFillForm";
import CarerLibrary from "@/pages/carer/CarerLibrary";
import CarerLeave from "@/pages/carer/CarerLeave";
import CarerNotifications from "@/pages/carer/CarerNotifications";
import CarerMessages from "@/pages/carer/CarerMessages";
import CarerAgreements from "@/pages/carer/CarerAgreements";
import CarerMyTasks from "@/pages/carer/CarerMyTasks";
import CarerEventsLogs from "@/pages/carer/CarerEventsLogs";
import { CarerReportsTab } from "@/components/carer/CarerReportsTab";
import { ServiceReportsErrorBoundary } from "@/components/service-reports/ServiceReportsErrorBoundary";
import React from "react";
import { useAuth } from "@/contexts/UnifiedAuthProvider";
import { CarerSidebarProvider } from "@/components/carer/CarerSidebarProvider";

const RequireCarerAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const { isAuthenticated, loading, error, signOut, isCarerRole, carerProfile } = useUnifiedCarerAuth();
  const [showTimeout, setShowTimeout] = React.useState(false);
  const isFreshLogin = sessionStorage.getItem('freshLogin') === 'true';

  console.log('[RequireCarerAuth] State:', { 
    isAuthenticated, 
    loading, 
    error, 
    isFreshLogin,
    isCarerRole,
    hasProfile: !!carerProfile,
    authInitialized: auth.initialized
  });

  // Clear fresh login flag when successfully authenticated
  React.useEffect(() => {
    if (isAuthenticated && !loading) {
      console.log('[RequireCarerAuth] Authentication successful, clearing freshLogin flag');
      sessionStorage.removeItem('freshLogin');
    }
  }, [isAuthenticated, loading]);

  // Show timeout UI after 5 seconds of loading (reduced from 8)
  React.useEffect(() => {
    if (loading && !isFreshLogin) {
      const timeoutId = setTimeout(() => {
        console.warn('[RequireCarerAuth] Timeout reached after 5 seconds');
        setShowTimeout(true);
      }, 5000);

      return () => clearTimeout(timeoutId);
    } else {
      setShowTimeout(false);
    }
  }, [loading, isFreshLogin]);

  // Safety timeout - force redirect to login after 10 seconds
  React.useEffect(() => {
    if (loading) {
      const safetyTimeout = setTimeout(() => {
        console.error('[RequireCarerAuth] Safety timeout (10s) - forcing login redirect');
        window.location.href = '/login';
      }, 10000);
      return () => clearTimeout(safetyTimeout);
    }
  }, [loading]);

  // Show loading state with timeout protection
  if (loading) {
    // Skip timeout UI for fresh logins
    if (isFreshLogin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Setting up your dashboard...</p>
          </div>
        </div>
      );
    }

    if (showTimeout) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-2">
              <AlertCircle className="h-12 w-12 text-warning mx-auto" />
              <h2 className="text-2xl font-semibold">Loading Taking Longer</h2>
              <p className="text-muted-foreground">
                Authentication is taking longer than expected. This might be due to network issues.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
              <Button
                onClick={async () => {
                  await signOut();
                  window.location.href = '/login';
                }}
                variant="outline"
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Return to Login
              </Button>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if authentication failed
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="space-y-2">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-semibold">Authentication Error</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>

          <Button
            onClick={() => window.location.href = '/login'}
            variant="default"
            className="w-full"
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  // Wait for auth provider to finish initializing before making redirect decisions
  if (!auth.initialized) {
    console.log('[RequireCarerAuth] Auth still initializing, waiting...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (after initialization completes)
  if (!isAuthenticated) {
    if (isFreshLogin && loading) {
      console.log('[RequireCarerAuth] Fresh login still loading profile, waiting...');
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      );
    }
    
    console.warn('[RequireCarerAuth] Not authenticated after initialization, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * CarerRoutes component containing all routes related to the carer dashboard
 * Returns an array of Route elements for consistent usage in App.tsx
 */
const CarerRoutes = () => [
  <Route 
    key="carer-dashboard" 
    path="carer-dashboard" 
    element={
      <RequireCarerAuth>
        <CarerSidebarProvider>
          <CarerDashboard />
        </CarerSidebarProvider>
      </RequireCarerAuth>
    }
  >
    <Route index element={<CarerOverview />} />
    <Route path="profile" element={<CarerProfile />} />
    <Route path="schedule" element={<CarerSchedule />} />
    <Route path="appointments" element={<CarerAppointments />} />
    <Route path="careplans" element={<CarerCarePlans />} />
    <Route path="agreements" element={<CarerAgreements />} />
    <Route path="forms" element={<CarerAssignedForms />} />
    <Route path="forms/:formId" element={<CarerFillForm />} />
    <Route path="library" element={<CarerLibrary />} />
    <Route path="tasks" element={<CarerTasks />} />
    <Route path="my-tasks" element={<CarerMyTasks />} />
    <Route path="events-logs" element={<CarerEventsLogs />} />
    <Route path="news2" element={<CarerNews2 />} />
    <Route path="reports" element={<CarerReports />} />
    <Route path="service-reports" element={<ServiceReportsErrorBoundary><CarerReportsTab /></ServiceReportsErrorBoundary>} />
    <Route path="payments" element={<CarerPayments />} />
    <Route path="training" element={<CarerTraining />} />
    <Route path="clients" element={<Navigate to=".." replace />} />
    <Route path="clients/:clientId" element={<Navigate to=".." replace />} />
    <Route path="attendance" element={<CarerAttendance />} />
    <Route path="documents" element={<CarerDocuments />} />
    <Route path="visit/:appointmentId" element={<CarerVisitWorkflow />} />
    <Route path="messages" element={<CarerMessages />} />
    <Route path="notifications" element={<CarerNotifications />} />
    <Route path="leave" element={<CarerLeave />} />
  </Route>
];

export default CarerRoutes;
