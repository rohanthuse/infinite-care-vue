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
import { BranchAgreementsTab } from "@/components/agreements/BranchAgreementsTab";
import { FormBuilderTab } from "@/components/form-builder/FormBuilderTab";
import KeyParametersContent from "@/components/keyparameters/KeyParametersContent";
import WorkflowContent from "@/components/workflow/WorkflowContent";
import NotificationsOverview from "@/components/workflow/NotificationsOverview";
import TaskMatrix from "./TaskMatrix";
import TrainingMatrix from "./TrainingMatrix";
import AccountingTab from "@/components/accounting/AccountingTab";
import { format } from "date-fns";
import { Bell, AlertCircle, Users, Calendar, FileText } from "lucide-react";

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
      navigate(`/branch-dashboard/${id}/${branchName}/clients/${client.id}/edit`);
    }
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
            onChange={handleTabChange}
          />
        </div>
        
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <>
            <DashboardStatsSection
              branchId={id}
              onNewClient={handleNewClient}
              onTabChange={handleTabChange}
            />
            <DashboardChartsSection branchId={id} />
            <DashboardActivitySection branchId={id} />
          </>
        )}
        
        {/* Other Tabs */}
        {activeTab === "key-parameters" && <KeyParametersContent branchId={id} branchName={branchName} />}
        {activeTab === "workflow" && <WorkflowContent branchId={id} branchName={branchName} />}
        {activeTab === "task-matrix" && <TaskMatrix branchId={id || "main"} branchName={displayBranchName} />}
        {activeTab === "training-matrix" && <TrainingMatrix branchId={id || "main"} branchName={displayBranchName} />}
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
        {activeTab === "accounting" && <AccountingTab branchId={id} branchName={displayBranchName} />}
        {activeTab === "care-plan" && <CareTab />}
        {activeTab === "agreements" && <BranchAgreementsTab branchId={id || ""} branchName={displayBranchName} />}
        {activeTab === "forms" && <FormBuilderTab branchId={id || ""} branchName={displayBranchName} />}
        
        {/* Notifications Tab */}
        {activeTab === "notifications" && restPath === "notifications" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">Notifications</h2>
            <p className="text-gray-500 mb-6">Branch: {displayBranchName} (ID: {id})</p>
            <NotificationsOverview branchId={id} branchName={branchName} />
          </div>
        )}
        
        {activeTab === "notifications" && restPath !== "notifications" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-4">Notifications</h2>
            <p className="text-gray-500">Branch: {branchName} (ID: {id})</p>
            
            <div className="mt-6 space-y-4">
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 flex items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">System Update</h3>
                  <p className="text-sm text-gray-600 mt-1">The Med-Infinite system will be updated tonight at 2 AM. Expected downtime: 30 minutes.</p>
                  <div className="text-xs text-gray-500 mt-2">2 hours ago</div>
                </div>
              </div>
              
              <div className="p-4 border border-amber-200 rounded-lg bg-amber-50 flex items-start">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium">New Protocol</h3>
                  <p className="text-sm text-gray-600 mt-1">Updated safety protocols have been published. Please review and acknowledge by Friday.</p>
                  <div className="text-xs text-gray-500 mt-2">Yesterday</div>
                </div>
              </div>
              
              <div className="p-4 border border-green-200 rounded-lg bg-green-50 flex items-start">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">New Client Assigned</h3>
                  <p className="text-sm text-gray-600 mt-1">Emma Thompson has been assigned to your branch. Initial assessment scheduled for next week.</p>
                  <div className="text-xs text-gray-500 mt-2">2 days ago</div>
                </div>
              </div>
              
              <div className="p-4 border border-purple-200 rounded-lg bg-purple-50 flex items-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Upcoming Training</h3>
                  <p className="text-sm text-gray-600 mt-1">Mandatory training session on new medication dispensing procedures on May 15th at 10 AM.</p>
                  <div className="text-xs text-gray-500 mt-2">3 days ago</div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-start">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium">Document Expiring</h3>
                  <p className="text-sm text-gray-600 mt-1">Annual service agreement for Robert Johnson is expiring in 15 days. Please initiate renewal process.</p>
                  <div className="text-xs text-gray-500 mt-2">5 days ago</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BranchDashboard;
