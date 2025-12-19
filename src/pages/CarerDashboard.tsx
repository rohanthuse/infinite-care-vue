import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { CarerHeader } from "@/components/carer/CarerHeader";
import { CarerSubHeader } from "@/components/carer/CarerSubHeader";
import { CarerRightSidebar } from "@/components/carer/CarerRightSidebar";
import { CarerMobileNav } from "@/components/carer/CarerMobileNav";
import { SidebarInset } from "@/components/ui/sidebar";
import { useUnifiedCarerAuth } from "@/hooks/useUnifiedCarerAuth";
import { useCarerContext } from "@/hooks/useCarerContext";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { CarerAttendanceCheckInModal } from "@/components/carer/CarerAttendanceCheckInModal";
import { useTriggerAlertProcessing } from "@/hooks/useLateBookingAlerts";

const CarerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, carerProfile } = useUnifiedCarerAuth();
  const { data: carerContext } = useCarerContext();
  const { tenantSlug } = useCarerNavigation();
  const { mutate: triggerAlertProcessing } = useTriggerAlertProcessing();

  // Process late/missed booking alerts on mount and every 2 minutes
  useEffect(() => {
    if (isAuthenticated) {
      triggerAlertProcessing();
      
      const interval = setInterval(() => {
        triggerAlertProcessing();
      }, 2 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, triggerAlertProcessing]);

  // Check authentication status - only redirect if truly unauthenticated
  // Use a ref to prevent redirect during active logout process
  const isLoggingOut = React.useRef(false);

  useEffect(() => {
    if (!loading && !isAuthenticated && !isLoggingOut.current) {
      console.log('[CarerDashboard] User not authenticated, redirecting to login');
      const loginPath = tenantSlug ? `/${tenantSlug}/carer-login` : "/carer-login";
      
      // Set flag to prevent race conditions
      isLoggingOut.current = true;
      
      // Small delay to allow signOut to complete its own navigation
      setTimeout(() => {
        // Only navigate if we're still unauthenticated
        if (!isAuthenticated) {
          navigate(loginPath, { replace: true });
        }
      }, 100);
    }
    
    // Reset flag when authenticated
    if (isAuthenticated) {
      isLoggingOut.current = false;
    }
  }, [isAuthenticated, loading, navigate, tenantSlug]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 w-full pt-[72px] pb-20 lg:pb-0">
      <CarerHeader />
      
      {/* Attendance Check-In Popup - shows only if not checked in today */}
      <CarerAttendanceCheckInModal />
      
      <div className="flex flex-1 w-full">
        {/* Main Content Area */}
        <SidebarInset className="flex-1 min-w-0 overflow-x-hidden">
          <main className="w-full max-w-full px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
            <CarerSubHeader />
            <Outlet />
          </main>
        </SidebarInset>
        
        {/* Right Sidebar - Only visible on desktop */}
        <CarerRightSidebar />
      </div>

      {/* Mobile Bottom Navigation */}
      <CarerMobileNav />
    </div>
  );
};

export default CarerDashboard;

