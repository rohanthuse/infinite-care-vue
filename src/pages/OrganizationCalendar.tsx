import React from 'react';
import { BranchLayout } from '@/components/branch-dashboard/BranchLayout';
import { OrganizationCalendarView } from '@/components/organization-calendar/OrganizationCalendarView';
import { AuthGuard } from '@/components/AuthGuard';
import { useTenant } from '@/contexts/TenantContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useBranchDashboardNavigation } from '@/hooks/useBranchDashboardNavigation';

export default function OrganizationCalendar() {
  const { organization, isLoading, error } = useTenant();
  const { id: branchId } = useBranchDashboardNavigation();

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
            Unable to access organisation calendar. Please ensure you're logged in with proper permissions.
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
      <BranchLayout onNewBooking={handleNewBooking}>
        <OrganizationCalendarView defaultBranchId={branchId} />
      </BranchLayout>
    </AuthGuard>
  );
}