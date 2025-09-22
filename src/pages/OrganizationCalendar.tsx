import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BranchRightSidebar } from '@/components/branch-dashboard/BranchRightSidebar';
import { OrganizationCalendarView } from '@/components/organization-calendar/OrganizationCalendarView';

export default function OrganizationCalendar() {
  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <DashboardHeader />
      <div className="flex-1 flex min-w-0">
        <BranchRightSidebar 
          activeTab="organization-calendar" 
          onChange={() => {}} 
        />
        <main className="flex-1 min-w-0 px-4 md:px-8 pt-4 pb-20 md:py-6">
          <OrganizationCalendarView />
        </main>
      </div>
    </div>
  );
}