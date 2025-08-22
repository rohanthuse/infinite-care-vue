import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { BranchRightSidebar } from "@/components/branch-dashboard/BranchRightSidebar";

import { AddClientDialog } from "@/components/AddClientDialog";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { UnifiedUploadDialog } from "@/components/documents/UnifiedUploadDialog";
import { SignAgreementDialog } from "@/components/agreements/SignAgreementDialog";
import { ScheduleAgreementDialog } from "@/components/agreements/ScheduleAgreementDialog";
import { ClientDetail } from "@/components/clients/ClientDetail";
import { useQueryClient } from "@tanstack/react-query";
import { useServices } from "@/data/hooks/useServices";
import { useBookingData } from "@/components/bookings/hooks/useBookingData";
import { useBranchDashboardNavigation } from "@/hooks/useBranchDashboardNavigation";
import { useNotificationGenerator } from "@/hooks/useNotificationGenerator";
import { useBranchAdminAccess } from "@/hooks/useBranchAdminAccess";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useAdminPermissions, hasTabPermission } from "@/hooks/useAdminPermissions";

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
import { ThirdPartyAccessManagement } from "@/components/third-party-access/ThirdPartyAccessManagement";
import { UnifiedDocumentsList } from "@/components/documents/UnifiedDocumentsList";
import { useUnifiedDocuments } from "@/hooks/useUnifiedDocuments";
import KeyParametersContent from "@/components/keyparameters/KeyParametersContent";
import WorkflowContent from "@/components/workflow/WorkflowContent";
import NotificationsOverview from "@/components/workflow/NotificationsOverview";
import NotificationCategory from "@/components/notifications/NotificationCategory";
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
  
  // Always call all hooks unconditionally at the top level
  const { session, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useUserRole();
  const {
    id,
    branchName,
    activeTab,
    handleTabChange,
    handleWorkflowNavigation
  } = useBranchDashboardNavigation();

  // Get categoryId from URL params for notification routing
  const { categoryId } = useParams<{ categoryId?: string }>();

  // Always call branch access hook - we'll handle the logic inside
  const { data: branchAccess, isLoading: accessLoading, error: accessError } = useBranchAdminAccess(id || "");
  
  // Get admin permissions for permission-based content filtering
  const { data: permissions, isLoading: permissionsLoading } = useAdminPermissions(id);
  
  // Add unified documents hook for documents tab
  const {
    documents,
    isLoading: documentsLoading,
    deleteDocument,
    downloadDocument,
    viewDocument
  } = useUnifiedDocuments(id || '');
  
  // Debug logging for permissions
  console.log('[BranchDashboard] Permission Check:', {
    userRole: userRole?.role,
    branchId: id,
    permissionsLoading,
    permissions,
    activeTab
  });

  // Always initialize notification generator
  useNotificationGenerator(id);

  // Always call booking data hooks
  const { clients: bookingClients, carers: bookingCarers } = useBookingData(id);
  const { data: services = [], isLoading: isLoadingServices, error: servicesError } = useServices();

  // Dialog states
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientDetailOpen, setClientDetailOpen] = useState<boolean>(false);
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [isUploadDocumentDialogOpen, setIsUploadDocumentDialogOpen] = useState(false);
  
  // Quick Add dialog states
  const [isQuickUploadDialogOpen, setIsQuickUploadDialogOpen] = useState(false);
  const [isSignAgreementDialogOpen, setIsSignAgreementDialogOpen] = useState(false);
  const [isScheduleAgreementDialogOpen, setIsScheduleAgreementDialogOpen] = useState(false);

  // State for access control
  const [accessDenied, setAccessDenied] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Handle access control logic
  useEffect(() => {
    console.log('[BranchDashboard] Access Control Check:', {
      authLoading,
      roleLoading,
      accessLoading,
      userRole: userRole?.role,
      branchAccess: branchAccess?.canAccess,
      branchId: id,
      session: !!session,
      accessError: accessError?.message
    });

    // Wait for all authentication data to be loaded
    if (authLoading || roleLoading) {
      return;
    }

    // If no session, redirect to login
    if (!session) {
      console.log('[BranchDashboard] No session, redirecting to login');
      navigate('/branch-admin-login', { replace: true });
      return;
    }

    // If no branch ID, show error
    if (!id) {
      console.log('[BranchDashboard] No branch ID found');
      setAccessDenied(true);
      setIsInitializing(false);
      return;
    }

    // If no user role yet, keep loading
    if (!userRole) {
      console.log('[BranchDashboard] No user role yet, continuing to load');
      return;
    }

    // Super admins have immediate access
    if (userRole.role === 'super_admin') {
      console.log('[BranchDashboard] Super admin access granted');
      setAccessDenied(false);
      setIsInitializing(false);
      return;
    }

    // Branch admins need access verification
    if (userRole.role === 'branch_admin') {
      // Still loading access check
      if (accessLoading) {
        console.log('[BranchDashboard] Branch admin access check in progress');
        return;
      }

      // Access check completed
      if (branchAccess?.canAccess) {
        console.log('[BranchDashboard] Branch admin access granted');
        setAccessDenied(false);
        setIsInitializing(false);
      } else {
        console.log('[BranchDashboard] Branch admin access denied');
        setAccessDenied(true);
        setIsInitializing(false);
      }
      return;
    }

    // Other roles don't have access
    console.log('[BranchDashboard] User role does not have access:', userRole.role);
    setAccessDenied(true);
    setIsInitializing(false);
  }, [authLoading, roleLoading, accessLoading, session, userRole, branchAccess, id, navigate, accessError]);

  const displayBranchName = branchName ? decodeURIComponent(branchName) : "Med-Infinite Branch";

  // Show loading while initializing
  if (isInitializing || authLoading || roleLoading || (userRole?.role === 'branch_admin' && accessLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show access denied if necessary
  if (accessDenied || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            {!id ? "Branch Not Found" : "Access Denied"}
          </h1>
          <p className="text-muted-foreground mb-4">
            {!id 
              ? "The branch you're looking for could not be found."
              : "You don't have access to this branch dashboard."
            }
          </p>
          <button
            onClick={() => navigate('/branch-admin-login')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Event handlers
  const handleNewBooking = () => {
    setNewBookingDialogOpen(true);
  };

  const handleNewClient = () => {
    setAddClientDialogOpen(true);
  };

  // Quick Add handlers
  const handleQuickUploadDocument = () => {
    setIsQuickUploadDialogOpen(true);
  };

  const handleNewAgreement = () => {
    // For now, default to sign agreement - could add a choice dialog later
    setIsSignAgreementDialogOpen(true);
  };

  const handleNewStaff = () => {
    // No staff creation dialog exists yet, so show coming soon message
    console.log("New Staff feature coming soon");
  };

  const handleQuickUploadSave = async (uploadData: any) => {
    console.log("Quick upload document:", uploadData);
    setIsQuickUploadDialogOpen(false);
    // Refresh documents list
    queryClient.invalidateQueries({ queryKey: ['unified-documents', id] });
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
  };

  const handleScheduleAppointment = () => {
    console.log("Schedule appointment for client:", selectedClient?.id);
    setNewBookingDialogOpen(true);
  };

  const handleUploadDocument = () => {
    console.log("Upload document for client:", selectedClient?.id);
  };

  const handleEditClient = (client: any) => {
    if (id && branchName) {
      navigate(`/branch-dashboard/${id}/${branchName}/clients/${client.id}/edit`);
    }
  };

  const enhancedHandleTabChange = (value: string) => {
    // Check permissions for branch admins before allowing tab change
    if (userRole?.role === 'branch_admin' && !hasTabPermission(permissions || null, value)) {
      console.warn('[BranchDashboard] Access denied to tab:', value, {
        userRole: userRole?.role,
        permissions,
        tabValue: value,
        hasPermission: hasTabPermission(permissions || null, value)
      });
      return; // Silently prevent navigation to restricted tabs
    }
    
    if (value === "events-logs" && id && branchName) {
      navigate(`/branch-dashboard/${id}/${branchName}/events-logs`);
    } else {
      handleTabChange(value);
    }
  };

  // Helper function to check if user can access a specific tab content
  const canAccessTab = (tabValue: string): boolean => {
    // Super admins can access everything
    if (userRole?.role === 'super_admin') {
      return true;
    }
    
    // Branch admins need permissions
    if (userRole?.role === 'branch_admin') {
      return hasTabPermission(permissions || null, tabValue);
    }
    
    // Other roles can access everything (for now)
    return true;
  };

  // Component to show access denied for restricted content
  const AccessDeniedTab = ({ tabName }: { tabName: string }) => (
    <div className="bg-card rounded-lg border border-border shadow-sm p-8 text-center">
      <div className="text-destructive text-6xl mb-4">🔒</div>
      <h2 className="text-2xl font-bold text-card-foreground mb-2">Access Restricted</h2>
      <p className="text-muted-foreground mb-4">
        You don't have permission to access the {tabName} section.
      </p>
      <p className="text-sm text-muted-foreground">
        Contact your administrator if you need access to this feature.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
        <DashboardHeader />
        
        <div className="flex flex-1 w-full relative">
          <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 transition-all duration-200">
            <BranchInfoHeader 
              branchName={displayBranchName} 
              branchId={id || ""}
              onNewBooking={handleNewBooking}
            />
            
            {/* Main Content */}
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              canAccessTab("dashboard") ? (
                <>
                  <DashboardStatsSection
                    branchId={id}
                    onNewClient={handleNewClient}
                    onTabChange={enhancedHandleTabChange}
                  />
                  <DashboardChartsSection branchId={id} />
                  <DashboardActivitySection branchId={id} />
                </>
              ) : (
                <AccessDeniedTab tabName="Dashboard" />
              )
            )}
            
            {/* Other Tabs with Permission Checks */}
            {activeTab === "key-parameters" && (
              canAccessTab("key-parameters") ? (
                <KeyParametersContent branchId={id} branchName={branchName} />
              ) : (
                <AccessDeniedTab tabName="Key Parameters" />
              )
            )}
            
            {activeTab === "workflow" && (
              canAccessTab("workflow") ? (
                <WorkflowContent branchId={id} branchName={branchName} />
              ) : (
                <AccessDeniedTab tabName="Workflow" />
              )
            )}
            
            {activeTab === "task-matrix" && (
              canAccessTab("task-matrix") ? (
                <TaskMatrix branchId={id || "main"} branchName={displayBranchName} />
              ) : (
                <AccessDeniedTab tabName="Task Matrix" />
              )
            )}
            
            {activeTab === "training-matrix" && (
              canAccessTab("training-matrix") ? (
                <TrainingMatrix branchId={id || "main"} branchName={displayBranchName} />
              ) : (
                <AccessDeniedTab tabName="Training Matrix" />
              )
            )}
            
            {activeTab === "bookings" && (
              canAccessTab("bookings") ? (
                <BookingsTab branchId={id} />
              ) : (
                <AccessDeniedTab tabName="Bookings" />
              )
            )}
            
            {activeTab === "clients" && (
              canAccessTab("clients") ? (
                <ClientsManagementSection 
                  branchId={id}
                  onNewClient={handleNewClient}
                  onViewClient={handleViewClient}
                  onEditClient={handleEditClient}
                />
              ) : (
                <AccessDeniedTab tabName="Clients" />
              )
            )}
            
            {activeTab === "carers" && (
              canAccessTab("carers") ? (
                <CarersTab branchId={id} branchName={branchName} />
              ) : (
                <AccessDeniedTab tabName="Staff" />
              )
            )}
            
            {activeTab === "reviews" && (
              canAccessTab("reviews") ? (
                <ReviewsTab branchId={id} />
              ) : (
                <AccessDeniedTab tabName="Reviews" />
              )
            )}
            
            {activeTab === "communication" && (
              canAccessTab("communication") ? (
                <CommunicationsTab branchId={id} branchName={branchName} />
              ) : (
                <AccessDeniedTab tabName="Communication" />
              )
            )}
            
            {activeTab === "medication" && (
              canAccessTab("medication") ? (
                <MedicationTab branchId={id} branchName={branchName} />
              ) : (
                <AccessDeniedTab tabName="Medication" />
              )
            )}
            
            {activeTab === "care-plan" && (
              canAccessTab("care-plan") ? (
                <CareTab branchId={id} branchName={branchName} />
              ) : (
                <AccessDeniedTab tabName="Care Plan" />
              )
            )}
            
            {activeTab === "agreements" && (
              canAccessTab("agreements") ? (
                <BranchAgreementsTab branchId={id} branchName={branchName} />
              ) : (
                <AccessDeniedTab tabName="Agreements" />
              )
            )}
            
            {activeTab === "form-builder" && (
              canAccessTab("form-builder") ? (
                <FormBuilderTab branchId={id} branchName={branchName} />
              ) : (
                <AccessDeniedTab tabName="Form Builder" />
              )
            )}
            
            {activeTab === "third-party" && (
              canAccessTab("third-party") ? (
                <ThirdPartyAccessManagement branchId={id} />
              ) : (
                <AccessDeniedTab tabName="Third Party Access" />
              )
            )}
            
            {activeTab === "documents" && (
              canAccessTab("documents") ? (
                <UnifiedDocumentsList 
                  documents={documents} 
                  isLoading={documentsLoading} 
                  onViewDocument={viewDocument}
                  onDownloadDocument={downloadDocument}
                  onDeleteDocument={deleteDocument}
                  branchId={id || ""}
                />
              ) : (
                <AccessDeniedTab tabName="Documents" />
              )
            )}
            
            {activeTab === "notifications" && (
              canAccessTab("notifications") ? (
                categoryId ? (
                  <NotificationCategory categoryId={categoryId || ""} />
                ) : (
                  <NotificationsOverview branchId={id} branchName={branchName} />
                )
              ) : (
                <AccessDeniedTab tabName="Notifications" />
              )
            )}
            
            {activeTab === "finance" && (
              canAccessTab("finance") ? (
                <AccountingTab branchId={id} branchName={branchName} />
              ) : (
                <AccessDeniedTab tabName="Finance" />
              )
            )}
          </main>
          
          <BranchRightSidebar
            activeTab={activeTab}
            onChange={enhancedHandleTabChange}
            onNewClient={handleNewClient}
            onNewBooking={handleNewBooking}
            onNewStaff={handleNewStaff}
            onNewAgreement={handleNewAgreement}
            onUploadDocument={handleQuickUploadDocument}
          />
        </div>
        
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
          carers={bookingCarers}
          services={services}
          onCreateBooking={handleCreateBooking}
          branchId={id}
        />
        
        {selectedClient && (
          <ClientDetail
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onAddNote={() => setIsAddNoteDialogOpen(true)}
            onUploadDocument={() => setIsUploadDocumentDialogOpen(true)}
          />
        )}

        {/* Quick Add Dialogs */}
        <UnifiedUploadDialog
          open={isQuickUploadDialogOpen}
          onOpenChange={setIsQuickUploadDialogOpen}
          onSave={handleQuickUploadSave}
        />

        <SignAgreementDialog
          open={isSignAgreementDialogOpen}
          onOpenChange={setIsSignAgreementDialogOpen}
          branchId={id || ""}
        />

        <ScheduleAgreementDialog
          open={isScheduleAgreementDialogOpen}
          onOpenChange={setIsScheduleAgreementDialogOpen}
          branchId={id || ""}
        />
      </div>
  );
};

export default BranchDashboard;
