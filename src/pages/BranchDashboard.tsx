import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { TabNavigation } from "@/components/TabNavigation";
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show access denied if necessary
  if (accessDenied || !id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {!id ? "Branch Not Found" : "Access Denied"}
          </h1>
          <p className="text-gray-600 mb-4">
            {!id 
              ? "The branch you're looking for could not be found."
              : "You don't have access to this branch dashboard."
            }
          </p>
          <button
            onClick={() => navigate('/branch-admin-login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
      <div className="text-red-500 text-6xl mb-4">🔒</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
      <p className="text-gray-600 mb-4">
        You don't have permission to access the {tabName} section.
      </p>
      <p className="text-sm text-gray-500">
        Contact your administrator if you need access to this feature.
      </p>
    </div>
  );

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
            onNewClient={handleNewClient}
            onNewBooking={handleNewBooking}
            onNewStaff={handleNewStaff}
            onNewAgreement={handleNewAgreement}
            onUploadDocument={handleQuickUploadDocument}
          />
        </div>
        
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
        
        {activeTab === "carers" && (
          canAccessTab("carers") ? (
            <CarersTab branchId={id} branchName={branchName} />
          ) : (
            <AccessDeniedTab tabName="Staff" />
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
        
        {activeTab === "reviews" && (
          canAccessTab("reviews") ? (
            <ReviewsTab branchId={id} branchName={branchName} />
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
        
        {activeTab === "accounting" && (
          canAccessTab("finance") ? (
            <AccountingTab branchId={id} branchName={displayBranchName} />
          ) : (
            <AccessDeniedTab tabName="Accounting" />
          )
        )}
        
        {activeTab === "finance" && (
          canAccessTab("finance") ? (
            <AccountingTab branchId={id} branchName={displayBranchName} />
          ) : (
            <AccessDeniedTab tabName="Finance" />
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
            <BranchAgreementsTab branchId={id || ""} branchName={displayBranchName} />
          ) : (
            <AccessDeniedTab tabName="Agreements" />
          )
        )}
        
        {activeTab === "forms" && (
          canAccessTab("form-builder") ? (
            <FormBuilderTab branchId={id || ""} branchName={displayBranchName} />
          ) : (
            <AccessDeniedTab tabName="Form Builder" />
          )
        )}

        {activeTab === "form-builder" && (
          canAccessTab("form-builder") ? (
            <FormBuilderTab branchId={id || ""} branchName={displayBranchName} />
          ) : (
            <AccessDeniedTab tabName="Form Builder" />
          )
        )}
        
        {/* Events & Logs fallback - redirect to dedicated page */}
        {activeTab === "events-logs" && (() => {
          React.useEffect(() => {
            if (id && branchName) {
              navigate(`/branch-dashboard/${id}/${branchName}/events-logs`);
            }
          }, []);
          return (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">Redirecting to Events & Logs...</h2>
              <p className="text-gray-500">Loading Events & Logs page...</p>
            </div>
          );
        })()}
        
        {/* Documents Tab */}
        {activeTab === "documents" && (
          canAccessTab("documents") ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Documents & Resources</h2>
                    <p className="text-gray-500 mt-1">
                      Manage documents for {displayBranchName} - {documents.length} documents
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <UnifiedDocumentsList
                  documents={documents}
                  onViewDocument={viewDocument}
                  onDownloadDocument={downloadDocument}
                  onDeleteDocument={async (documentId: string) => {
                    if (window.confirm('Are you sure you want to delete this document?')) {
                      await deleteDocument(documentId);
                    }
                  }}
                  isLoading={documentsLoading}
                />
              </div>
            </div>
          ) : (
            <AccessDeniedTab tabName="Documents" />
          )
        )}

        {/* Third Party Access Tab */}
        {activeTab === "third-party" && (
          canAccessTab("third-party") ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Third Party Access</h2>
                    <p className="text-gray-500 mt-1">
                      Manage external access for {displayBranchName}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <ThirdPartyAccessManagement branchId={id || ""} />
              </div>
            </div>
          ) : (
            <AccessDeniedTab tabName="Third Party Access" />
          )
        )}

        {/* Library Tab */}
        {activeTab === "library" && (
          canAccessTab("library") ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Resource Library</h2>
                    <p className="text-gray-500 mt-1">
                      Training materials and guides for {displayBranchName}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-500">Resource library functionality coming soon...</p>
              </div>
            </div>
          ) : (
            <AccessDeniedTab tabName="Library" />
          )
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          canAccessTab("reports") ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Reports & Analytics</h2>
                    <p className="text-gray-500 mt-1">
                      Data analysis and reporting for {displayBranchName}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-500">Reports functionality coming soon...</p>
              </div>
            </div>
          ) : (
            <AccessDeniedTab tabName="Reports" />
          )
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          canAccessTab("notifications") ? (
            categoryId ? (
              // Render specific notification category
              <NotificationCategory 
                categoryId={categoryId} 
                branchId={id || ""} 
                branchName={branchName || ""} 
              />
            ) : (
              // Render notifications overview
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-4">Notifications</h2>
                <p className="text-gray-500 mb-6">Branch: {displayBranchName} (ID: {id})</p>
                <NotificationsOverview branchId={id} branchName={branchName} />
            
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
            )
          ) : (
            <AccessDeniedTab tabName="Notifications" />
          )
        )}
      </main>
    </div>
  );
};

export default BranchDashboard;
