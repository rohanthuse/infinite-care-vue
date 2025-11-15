
import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { CarerHeader } from "@/components/carer/CarerHeader";
import { SidebarInset } from "@/components/ui/sidebar";
import { CarerRightSidebar } from "@/components/carer/CarerRightSidebar";
import { useUnifiedCarerAuth } from "@/hooks/useUnifiedCarerAuth";
import { useCarerContext } from "@/hooks/useCarerContext";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";

const CarerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, carerProfile } = useUnifiedCarerAuth();
  const { data: carerContext } = useCarerContext();
  const { tenantSlug } = useCarerNavigation();

  // Check authentication status - only redirect if truly unauthenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('[CarerDashboard] User not authenticated, redirecting to login');
      const loginPath = tenantSlug ? `/${tenantSlug}/carer-login` : "/carer-login";
      navigate(loginPath);
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <CarerHeader />
      
      <div className="flex flex-1 w-full">
        <SidebarInset className="flex-1 min-w-0 w-full">
          <main className="w-full max-w-full px-4 sm:px-6 md:px-8 lg:px-10 pt-4 pb-20 md:py-6">
            <Outlet />
          </main>
        </SidebarInset>
        
        <CarerRightSidebar />
      </div>
    </div>
  );
};

export default CarerDashboard;
