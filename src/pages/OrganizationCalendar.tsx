import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BranchRightSidebar } from '@/components/branch-dashboard/BranchRightSidebar';
import { BranchInfoHeader } from '@/components/BranchInfoHeader';
import { OrganizationCalendarView } from '@/components/organization-calendar/OrganizationCalendarView';
import { useBranchDashboardNavigation } from '@/hooks/useBranchDashboardNavigation';

export default function OrganizationCalendar() {
  const { id, branchName, activeTab, handleTabChange } = useBranchDashboardNavigation();

  const handleNewBooking = () => {
    // Handle new booking functionality
    console.log('New booking requested');
  };

  return (
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
  );
}