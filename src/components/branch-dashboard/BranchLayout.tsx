import React from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BranchInfoHeader } from '@/components/BranchInfoHeader';
import { BranchRightSidebar } from '@/components/branch-dashboard/BranchRightSidebar';
import { useBranchDashboardNavigation } from '@/hooks/useBranchDashboardNavigation';

interface BranchLayoutProps {
  children: React.ReactNode;
  onNewBooking?: () => void;
  onNewClient?: () => void;
  onNewStaff?: () => void;
  onNewAgreement?: () => void;
  onUploadDocument?: () => void;
}

export const BranchLayout: React.FC<BranchLayoutProps> = ({
  children,
  onNewBooking,
  onNewClient,
  onNewStaff,
  onNewAgreement,
  onUploadDocument
}) => {
  const {
    id,
    branchName,
    activeTab,
    handleTabChange
  } = useBranchDashboardNavigation();

  const displayBranchName = branchName ? decodeURIComponent(branchName) : "Med-Infinite Branch";

  const handleQuickUploadDocument = () => {
    if (onUploadDocument) {
      onUploadDocument();
    }
  };

  const handleNewAgreementAction = () => {
    if (onNewAgreement) {
      onNewAgreement();
    }
  };

  const handleNewStaffAction = () => {
    if (onNewStaff) {
      onNewStaff();
    }
  };

  const handleNewBookingAction = () => {
    if (onNewBooking) {
      onNewBooking();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <DashboardHeader />
      
      <div className="flex flex-1 w-full relative pt-16">
        <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 transition-all duration-200">
          <BranchInfoHeader 
            branchName={displayBranchName} 
            branchId={id || ""}
            onNewBooking={handleNewBookingAction}
          />
          
          {children}
        </main>
        
        <BranchRightSidebar
          activeTab={activeTab}
          onChange={handleTabChange}
          onNewClient={onNewClient}
          onNewBooking={onNewBooking}
          onNewStaff={handleNewStaffAction}
          onNewAgreement={handleNewAgreementAction}
          onUploadDocument={handleQuickUploadDocument}
        />
      </div>
    </div>
  );
};