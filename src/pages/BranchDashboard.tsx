
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { AddClientDialog } from "@/components/AddClientDialog";
import { NewBookingDialog } from "@/components/bookings/NewBookingDialog";
import { ClientDetail } from "@/components/clients/ClientDetail";
import { useQueryClient } from "@tanstack/react-query";
import { useServices } from "@/data/hooks/useServices";
import { useBookingData } from "@/components/bookings/hooks/useBookingData";
import { useBranchDashboardNavigation } from "@/hooks/useBranchDashboardNavigation";
import { useNotificationGenerator } from "@/hooks/useNotificationGenerator";

// Import refactored sections
import { DashboardStatsSection } from "@/components/branch-dashboard/DashboardStatsSection";
import { DashboardChartsSection } from "@/components/branch-dashboard/DashboardChartsSection";
import { DashboardActivitySection } from "@/components/branch-dashboard/DashboardActivitySection";
import { ClientsManagementSection } from "@/components/branch-dashboard/ClientsManagementSection";

// Import existing tab components
import { BookingsTab } from "@/components/bookings/BookingsTab";
import { CarersTab } from "@/components/carers/CarersTab";
import ReviewsTab from "@/components/reviews/ReviewsTab";
import { CommunicationsTab } from "@/components/communications/CommunicationsTab";
import { MedicationTab } from "@/components/medication/MedicationTab";
import { CareTab } from "@/components/care/CareTab";
import KeyParametersContent from "@/components/keyparameters/KeyParametersContent";
import { format } from "date-fns";

interface BranchDashboardProps {
  tab?: string;
}

const BranchDashboard: React.FC<BranchDashboardProps> = ({ tab: initialTab }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const {
    id,
    branchName,
    restPath,
    activeTab,
    handleTabChange,
    handleWorkflowNavigation
  } = useBranchDashboardNavigation();

  // Initialize notification generator for this branch
  useNotificationGenerator(id);

  const { clients: bookingClients, carers: bookingCarers } = useBookingData(id);
  const { data: services = [], isLoading: isLoadingServices, error: servicesError } = useServices();

  // Dialog states
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientDetailOpen, setClientDetailOpen] = useState<boolean>(false);
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [isUploadDocumentDialogOpen, setIsUploadDocumentDialogOpen] = useState(false);

  const displayBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  React.useEffect(() => {
    console.log("[BranchDashboard] services:", services, "isLoadingServices:", isLoadingServices, "servicesError:", servicesError);
  }, [services, isLoadingServices, servicesError]);

  const handleNewBooking = () => {
    setNewBookingDialogOpen(true);
  };

  const handleNewClient = () => {
    setAddClientDialogOpen(true);
  };

  const handleClientAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['branch-clients'] });
    queryClient.invalidateQueries({ queryKey: ['branch-statistics', id] });
    queryClient.invalidateQueries({ queryKey: ['branch-dashboard-stats', id] });
    queryClient.invalidateQueries({ queryKey: ['branch-chart-data', id] });
  };

  const handleCreateBooking = (bookingData: any) => {
    console.log("Creating new booking:", bookingData);
    setNewBookingDialogOpen(false);
  };

  const handleViewClient = (client: any) => {
    const clientForDetails = {
      ...client,
      name: `${client.first_name} ${client.last_name}`,
      location: client.address,
      avatar: client.avatar_initials,
      registeredOn: client.registered_on ? format(new Date(client.registered_on), 'dd/MM/yyyy') : 'N/A'
    };
    setSelectedClient(clientForDetails);
    setClientDetailOpen(true);
  };

  const handleCloseClientDetail = () => {
    setClientDetailOpen(false);
    setSelectedClient(null);
  };

  const handleAddNote = () => {
    console.log("Add note for client:", selectedClient?.id);
    // Implement note adding functionality
  };

  const handleScheduleAppointment = () => {
    console.log("Schedule appointment for client:", selectedClient?.id);
    setNewBookingDialogOpen(true);
  };

  const handleUploadDocument = () => {
    console.log("Upload document for client:", selectedClient?.id);
    // Implement document upload functionality
  };

  const handleEditClient = (client: any) => {
    if (id && branchName) {
      navigate(`/admin/branch-dashboard/${id}/${branchName}/clients/${client.id}/edit`);
    }
  };

  // Enhanced tab change handler that redirects to dedicated pages when needed
  const enhancedHandleTabChange = (value: string) => {
    const tabsWithDedicatedPages = [
      'workflow', 'accounting', 'agreements', 'events-logs', 'attendance',
      'form-builder', 'documents', 'notifications', 'library', 'third-party', 'reports'
    ];
    
    if (tabsWithDedicatedPages.includes(value) && id && branchName) {
      // Redirect to dedicated page with admin prefix
      const routeMap: { [key: string]: string } = {
        'workflow': '/admin/workflow',
        'accounting': '/admin/accounting',
        'agreements': '/admin/agreement',
        'events-logs': '/admin/events-logs',
        'attendance': '/admin/attendance',
        'form-builder': '/admin/form-builder',
        'documents': '/admin/documents',
        'notifications': '/admin/notifications',
        'library': '/admin/library',
        'third-party': '/admin/third-party',
        'reports': '/admin/reports'
      };
      
      const route = routeMap[value];
      if (route) {
        navigate(`${route}/${id}/${branchName}`);
        return;
      }
    }
    
    // For tabs that stay within branch dashboard
    handleTabChange(value);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      {/* Dialogs */}
      {id && (
        <AddClientDialog
          open={addClientDialogOpen}
          onOpenChange={setAddClientDialogOpen}
          branchId={id}
          onSuccess={handleClientAdded}
        />
      )}
      
      <NewBookingDialog
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        clients={bookingClients}
        carers={bookingCarers}
        services={services}
        servicesLoading={isLoadingServices}
        servicesError={servicesError}
        onCreateBooking={handleCreateBooking}
      />
      
      {selectedClient && (
        <ClientDetail
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onAddNote={() => setIsAddNoteDialogOpen(true)}
          onUploadDocument={() => setIsUploadDocumentDialogOpen(true)}
        />
      )}
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 w-full">
        <BranchInfoHeader 
          branchName={displayBranchName} 
          branchId={id || ""}
          onNewBooking={handleNewBooking}
        />
        
        <div className="mb-6">
          <TabNavigation 
            activeTab={activeTab} 
            onChange={enhancedHandleTabChange}
          />
        </div>
        
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <>
            <DashboardStatsSection
              branchId={id}
              onNewClient={handleNewClient}
              onTabChange={enhancedHandleTabChange}
            />
            <DashboardChartsSection branchId={id} />
            <DashboardActivitySection branchId={id} />
          </>
        )}
        
        {/* Tabs that stay within branch dashboard */}
        {activeTab === "key-parameters" && <KeyParametersContent branchId={id} branchName={branchName} />}
        {activeTab === "bookings" && <BookingsTab branchId={id} />}
        {activeTab === "carers" && <CarersTab branchId={id} branchName={branchName} />}
        {activeTab === "clients" && (
          <ClientsManagementSection
            branchId={id}
            onNewClient={handleNewClient}
            onViewClient={handleViewClient}
            onEditClient={handleEditClient}
          />
        )}
        {activeTab === "reviews" && <ReviewsTab branchId={id} branchName={branchName} />}
        {activeTab === "communication" && <CommunicationsTab branchId={id} branchName={branchName} />}
        {activeTab === "medication" && <MedicationTab branchId={id} branchName={branchName} />}
        {activeTab === "care-plan" && <CareTab branchId={id} branchName={branchName} />}
      </main>
    </div>
  );
};

export default BranchDashboard;
