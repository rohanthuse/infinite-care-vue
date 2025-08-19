
import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { DashboardStatsSection } from "@/components/branch-dashboard/DashboardStatsSection";
import { DashboardActivitySection } from "@/components/branch-dashboard/DashboardActivitySection";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { BookingsTab } from "@/components/bookings/BookingsTab";
import { CarersTab } from "@/components/carers/CarersTab";
import { CareTab } from "@/components/care/CareTab";
import ReviewsTab from "@/components/reviews/ReviewsTab";
import { MedicationTab } from "@/components/medication/MedicationTab";
import { useToast } from "@/hooks/use-toast";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";
import { useServices } from "@/data/hooks/useServices";
import { useBranchDashboardNavigation } from "@/hooks/useBranchDashboardNavigation";

export default function BranchDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const { id: branchId, branchName } = useParams();
  const { activeTab, handleTabChange } = useBranchDashboardNavigation();
  
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [newClientDialogOpen, setNewClientDialogOpen] = useState(false);

  const { data: services = [] } = useServices();
  const { data: carersData = [] } = useBranchCarers(branchId);

  // Transform carer data to match expected format
  const carers = carersData.map(carer => ({
    id: carer.id,
    name: `${carer.first_name} ${carer.last_name}`.trim(),
    initials: `${carer.first_name?.charAt(0) || ''}${carer.last_name?.charAt(0) || ''}`.toUpperCase(),
  }));

  const handleCreateBooking = (bookingData: any) => {
    console.log('Creating booking:', bookingData);
    setNewBookingDialogOpen(false);
    toast({
      title: "Booking Created",
      description: "The booking has been successfully created.",
    });
  };

  const handleCreateClient = (clientData: any) => {
    console.log('Creating client:', clientData);
    setNewClientDialogOpen(false);
    toast({
      title: "Client Created", 
      description: "The client has been successfully created.",
    });
  };

  const handleNewBooking = () => {
    setNewBookingDialogOpen(true);
  };

  const handleNewClient = () => {
    setNewClientDialogOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Please log in to access the dashboard.</p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            <DashboardStatsSection 
              branchId={branchId}
              onNewClient={handleNewClient}
              onTabChange={handleTabChange}
            />
            <DashboardActivitySection branchId={branchId} />
          </>
        );
      case "bookings":
        return <BookingsTab branchId={branchId} />;
      case "clients":
        return (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Clients Management</h3>
            <p className="text-gray-600">Manage your clients here. This section is currently under development.</p>
          </div>
        );
      case "carers":
        return <CarersTab branchId={branchId} branchName={branchName} />;
      case "care-plan":
        return <CareTab branchId={branchId} branchName={branchName} />;
      case "reviews":
        return <ReviewsTab branchId={branchId} branchName={branchName} />;
      case "communication":
        return (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Communication Center</h3>
            <p className="text-gray-600">Manage communications here. This section is currently under development.</p>
          </div>
        );
      case "medication":
        return <MedicationTab branchId={branchId} branchName={branchName} />;
      case "finance":
        return (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Finance Management</h3>
            <p className="text-gray-600">Manage finances here. This section is currently under development.</p>
          </div>
        );
      case "notifications":
        return (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Notifications</h3>
            <p className="text-gray-600">View notifications here. This section is currently under development.</p>
          </div>
        );
      default:
        return (
          <>
            <DashboardStatsSection 
              branchId={branchId}
              onNewClient={handleNewClient}
              onTabChange={handleTabChange}
            />
            <DashboardActivitySection branchId={branchId} />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6">
        <BranchInfoHeader
          branchName={branchName || "Branch"}
          branchId={branchId || ""}
          onNewBooking={handleNewBooking}
        />
        
        <TabNavigation
          activeTab={activeTab}
          onChange={handleTabChange}
          onNewBooking={handleNewBooking}
          onNewClient={handleNewClient}
        />
        
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </main>

      <NewBookingDialog
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        carers={carers}
        services={services}
        onCreateBooking={handleCreateBooking}
      />
    </div>
  );
}
