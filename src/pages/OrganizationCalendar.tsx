import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BranchRightSidebar } from '@/components/branch-dashboard/BranchRightSidebar';
import { BranchInfoHeader } from '@/components/BranchInfoHeader';
import { OrganizationCalendarView } from '@/components/organization-calendar/OrganizationCalendarView';
import { useBranchDashboardNavigation } from '@/hooks/useBranchDashboardNavigation';
import { AuthGuard } from '@/components/AuthGuard';
import { useTenant } from '@/contexts/TenantContext';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function OrganizationCalendar() {
  const { id, branchName, activeTab, handleTabChange } = useBranchDashboardNavigation();
  const { organization, isLoading, error } = useTenant();

  const handleNewBooking = () => {
    // Handle new booking functionality - this is for the header button
    console.log('New booking requested from header');
  };

  // Show loading while tenant context is being established
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show error if tenant context failed
  if (error || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Error</h1>
          <p className="text-muted-foreground mb-4">
            Unable to access organization calendar. Please ensure you're logged in with proper permissions.
          </p>
          <a href="/login" className="text-primary hover:text-primary/80 underline">
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requiresTenant={true}>
      <div className="min-h-screen flex flex-col bg-background w-full">
        <DashboardHeader />
        <div className="flex-1 flex min-w-0">
          <BranchRightSidebar 
            activeTab={activeTab}
            onChange={handleTabChange}
          />
          <main className="flex-1 min-w-0 px-4 md:px-8 pt-4 pb-20 md:py-6">
            {branchName && id && (
              <BranchInfoHeader 
                branchName={branchName}
                branchId={id}
                onNewBooking={handleNewBooking}
              />
            )}
            <OrganizationCalendarView />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}