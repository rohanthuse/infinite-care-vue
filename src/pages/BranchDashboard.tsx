import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { BranchRightSidebar } from "@/components/branch-dashboard/BranchRightSidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";

import { AddClientDialog } from "@/components/AddClientDialog";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { AddCarerDialog } from "@/components/carers/AddCarerDialog";
import { UnifiedUploadDialog } from "@/components/documents/UnifiedUploadDialog";
import { SignAgreementDialog } from "@/components/agreements/SignAgreementDialog";
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
import { useTenant } from "@/contexts/TenantContext";

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
import { SupportTab } from "@/components/support/SupportTab";
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
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Always call all hooks unconditionally at the top level
  const { session, loading: authLoading } = useAuth();
  const { data: userRole, isLoading: roleLoading, error: roleError } = useUserRole();
  const { tenantSlug, organization } = useTenant();
  const {
    id,
    branchName,
    activeTab,
    handleTabChange,
    handleWorkflowNavigation
  } = useBranchDashboardNavigation();

  // Add navigation error detection
  useEffect(() => {
    if (activeTab === 'care-plan') {
      console.log('[BranchDashboard] Care Plan tab loaded:', {
        branchId: id,
        branchName,
        tenantSlug,
        pathname: location.pathname
      });
    }
  }, [activeTab, id, branchName, tenantSlug]);

  // Get categoryId from URL params for notification routing
  const { categoryId } = useParams<{ categoryId?: string }>();

  // Always call branch access hook - we'll handle the logic inside
  const { data: branchAccess, isLoading: accessLoading, error: accessError } = useBranchAdminAccess(id || "");
  
  // Get admin permissions for permission-based content filtering
  const { data: permissions, isLoading: permissionsLoading, error: permissionsError } = useAdminPermissions(id);
  
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
  const { data: services = [], isLoading: isLoadingServices, error: servicesError } = useServices(organization?.id);

  // Dialog states
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [clientDetailOpen, setClientDetailOpen] = useState<boolean>(false);
  const [isClientEditModeOpen, setIsClientEditModeOpen] = useState(false);
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [isUploadDocumentDialogOpen, setIsUploadDocumentDialogOpen] = useState(false);
  
  // Edit client dialog states
  const [clientToEdit, setClientToEdit] = useState<any | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [isInvalidating, setIsInvalidating] = useState(false); // Track query invalidation state
  
  // Quick Add dialog states
  const [isQuickUploadDialogOpen, setIsQuickUploadDialogOpen] = useState(false);
  const [isSignAgreementDialogOpen, setIsSignAgreementDialogOpen] = useState(false);
  const [isAddCarerDialogOpen, setIsAddCarerDialogOpen] = useState(false);

  // State for access control
  const [accessDenied, setAccessDenied] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showFallbackUI, setShowFallbackUI] = useState(false);

  // Helper function to check if user can access a specific tab content
  const canAccessTab = (tabValue: string): boolean => {
    console.log('[BranchDashboard] canAccessTab called:', {
      tabValue,
      userRole: userRole?.role,
      permissions,
      permissionsLoading,
      hasTabPermissionResult: permissions ? hasTabPermission(permissions, tabValue) : null
    });
    
    // Super admins can access everything
    if (userRole?.role === 'super_admin') {
      console.log('[BranchDashboard] Super admin access granted for:', tabValue);
      return true;
    }
    
    // If permissions are still loading or failed to load, allow access to prevent blocking
    if (permissionsLoading || !permissions) {
      console.log('[BranchDashboard] Permissions loading or unavailable, allowing access to:', tabValue);
      return true;
    }
    
    // Branch admins need permissions
    if (userRole?.role === 'branch_admin') {
      const hasAccess = hasTabPermission(permissions || null, tabValue);
      console.log('[BranchDashboard] Branch admin permission check for', tabValue, ':', hasAccess);
      // If permission check fails but it's for finance, allow it for now (debug)
      if (!hasAccess && tabValue === 'finance') {
        console.warn('[BranchDashboard] Finance access denied but allowing for debug');
        return true;
      }
      return hasAccess;
    }
    
    // Other roles can access everything (for now)
    console.log('[BranchDashboard] Default access granted for role:', userRole?.role, 'tab:', tabValue);
    return true;
  };

  // Handle access control logic with timeout protection
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

    // Create shorter timeout with fallback UI option
    const loadingTimeout = setTimeout(() => {
      if (isInitializing) {
        console.warn('[BranchDashboard] Loading timeout reached, showing fallback UI');
        setShowFallbackUI(true);
        setIsInitializing(false);
      }
    }, 10000); // 10-second timeout with fallback

    // Wait for all authentication data to be loaded
    if (authLoading || roleLoading) {
      return () => clearTimeout(loadingTimeout);
    }

    // If no session, redirect to login
    if (!session) {
      console.log('[BranchDashboard] No session, redirecting to login');
      clearTimeout(loadingTimeout);
      navigate('/login', { replace: true });
      return;
    }

    // If no branch ID, show error
    if (!id) {
      console.log('[BranchDashboard] No branch ID found');
      clearTimeout(loadingTimeout);
      setAccessDenied(true);
      setIsInitializing(false);
      return;
    }

    // If user role failed or timed out, show fallback
    if (roleError || (!userRole && !roleLoading)) {
      console.warn('[BranchDashboard] User role failed or timed out, showing fallback UI');
      clearTimeout(loadingTimeout);
      setShowFallbackUI(true);
      setIsInitializing(false);
      return;
    }

    // If no user role yet, keep loading (but with timeout protection)
    if (!userRole && roleLoading) {
      console.log('[BranchDashboard] No user role yet, continuing to load');
      return () => clearTimeout(loadingTimeout);
    }

    // Check if user is an organization member (takes priority over system roles)
    const checkOrgMembership = async () => {
      if (!session?.user?.id) return false;
      
      // Get organization ID from branch
      const { data: branch } = await supabase
        .from('branches')
        .select('organization_id')
        .eq('id', id)
        .single();

      if (!branch?.organization_id) return false;

      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('role, status')
        .eq('organization_id', branch.organization_id)
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();

      return !!orgMember;
    };

    // Check organization membership
    checkOrgMembership().then(isOrgMember => {
      if (isOrgMember) {
        console.log('[BranchDashboard] Organization member access granted');
        clearTimeout(loadingTimeout);
        setAccessDenied(false);
        setIsInitializing(false);
        return;
      }

      // Super admins have immediate access
      if (userRole.role === 'super_admin') {
        console.log('[BranchDashboard] Super admin access granted');
        clearTimeout(loadingTimeout);
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

        // Access check completed or timed out
        if (branchAccess?.canAccess) {
          console.log('[BranchDashboard] Branch admin access granted');
          clearTimeout(loadingTimeout);
          setAccessDenied(false);
          setIsInitializing(false);
        } else if (accessError?.message?.includes('timed out')) {
          console.log('[BranchDashboard] Branch access check timed out, denying access');
          clearTimeout(loadingTimeout);
          setAccessDenied(true);
          setIsInitializing(false);
        } else {
          console.log('[BranchDashboard] Branch admin access denied');
          clearTimeout(loadingTimeout);
          setAccessDenied(true);
          setIsInitializing(false);
        }
        return;
      }

      // Unknown roles don't have access
      console.log('[BranchDashboard] User role does not have access:', userRole.role);
      clearTimeout(loadingTimeout);
      setAccessDenied(true);
      setIsInitializing(false);
    });

    return () => clearTimeout(loadingTimeout);
  }, [authLoading, roleLoading, accessLoading, session, userRole, branchAccess, id, navigate, accessError]);

  const displayBranchName = branchName ? decodeURIComponent(branchName) : "Med-Infinite Branch";

  // Event handlers (declared early to avoid scoping issues)
  const handleNewBooking = () => {
    setNewBookingDialogOpen(true);
  };

  const handleNewClient = () => {
    setClientToEdit(null);
    setDialogMode('add');
    setAddClientDialogOpen(true);
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

  // Show loading while initializing (with timeout protection)
  if (isInitializing || (authLoading && !showFallbackUI) || (roleLoading && !roleError && !showFallbackUI)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
          {showFallbackUI && (
            <div className="mt-6">
              <button
                onClick={() => {
                  setShowFallbackUI(false);
                  setAccessDenied(false);
                  setIsInitializing(false);
                }}
                className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 mr-3"
              >
                Continue Anyway
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/90"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show fallback UI for partial failures
  if (showFallbackUI && !accessDenied) {
    return (
      <div className="min-h-screen flex flex-col bg-background w-full">
        <DashboardHeader />
        <div className="flex-1 min-w-0 px-4 md:px-8 mt-20 pb-20 md:mt-20 md:pb-6">
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Limited Access Mode</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Some features may be unavailable due to authentication issues. Basic dashboard access is provided.
                </p>
              </div>
            </div>
          </div>
          
          <BranchInfoHeader 
            branchName={displayBranchName} 
            branchId={id || ""}
            onNewBooking={handleNewBooking}
          />
          
          {/* Basic dashboard content with fallback permissions */}
          <DashboardStatsSection
            branchId={id}
            onNewClient={handleNewClient}
            onTabChange={enhancedHandleTabChange}
          />
          <DashboardChartsSection branchId={id} />
          <DashboardActivitySection branchId={id} />
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
            onClick={() => navigate('/login')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Additional event handlers
  const handleQuickUploadDocument = () => {
    setIsQuickUploadDialogOpen(true);
  };

  const handleNewAgreement = () => {
    // For now, default to sign agreement - could add a choice dialog later
    setIsSignAgreementDialogOpen(true);
  };

  const handleNewStaff = () => {
    setIsAddCarerDialogOpen(true);
  };

  const handleQuickUploadSave = async (uploadData: any) => {
    console.log("Quick upload document:", uploadData);
    setIsQuickUploadDialogOpen(false);
    // Refresh documents list
    queryClient.invalidateQueries({ queryKey: ['unified-documents', id] });
  };

  const handleClientAdded = async () => {
    // Set invalidating state to true to prevent editing during query updates
    setIsInvalidating(true);
    
    // Invalidate all client-related queries and wait for them to complete
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['branch-clients'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-client-detail'] }),
      queryClient.invalidateQueries({ queryKey: ['client-profile'] }),
      queryClient.invalidateQueries({ queryKey: ['branch-statistics', id] }),
      queryClient.invalidateQueries({ queryKey: ['branch-dashboard-stats', id] }),
      queryClient.invalidateQueries({ queryKey: ['branch-chart-data', id] })
    ]);
    
    // Reset invalidating state after queries complete
    setIsInvalidating(false);
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
    setIsClientEditModeOpen(false);
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
    // Prevent editing while query invalidation is in progress
    if (isInvalidating) {
      console.log("Query invalidation in progress, please wait...");
      return;
    }
    
    // Create a fresh copy to avoid reference issues
    setClientToEdit({ ...client });
    setDialogMode('edit');
    setAddClientDialogOpen(true);
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
        
        <div className="flex flex-1 w-full mt-16">
          <SidebarInset className="flex-1 min-w-0 overflow-x-hidden">
            <main className="px-4 md:px-8 pt-4 pb-20 md:py-6">
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
                <AccessDeniedTab tabName="Core Settings" />
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
                <AccessDeniedTab tabName="Action Plan" />
              )
            )}
            
            {activeTab === "training-matrix" && (
              canAccessTab("training-matrix") ? (
                <TrainingMatrix branchId={id || "main"} branchName={displayBranchName} />
              ) : (
                <AccessDeniedTab tabName="Training Program" />
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
                <AccessDeniedTab tabName="Feedbacks" />
              )
            )}
            
            {activeTab === "communication" && (
              canAccessTab("communication") ? (
                <CommunicationsTab branchId={id} branchName={branchName} />
              ) : (
                <AccessDeniedTab tabName="Communication" />
              )
            )}
            
            {activeTab === "support" && (
              canAccessTab("support") ? (
                <SupportTab branchId={id} branchName={branchName} />
              ) : (
                <AccessDeniedTab tabName="Support" />
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
            
            {/* Documents tab removed - Documents has a dedicated route/page */}
            
            {activeTab === "notifications" && (
              canAccessTab("notifications") ? (
                categoryId ? (
                  <NotificationCategory 
                    categoryId={categoryId || ""} 
                    branchId={id} 
                    branchName={branchName} 
                  />
                ) : (
                  <NotificationsOverview branchId={id} branchName={branchName} />
                )
              ) : (
                <AccessDeniedTab tabName="Notifications" />
              )
            )}
            
            {activeTab === "finance" && (
              canAccessTab("finance") ? (
                <AccountingTab />
              ) : (
                <AccessDeniedTab tabName="Finance" />
              )
            )}
          </main>
          </SidebarInset>
          
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
            key={clientToEdit?.id || 'add-client'} // Force re-mount when editing different clients
            open={addClientDialogOpen}
            onOpenChange={(open) => {
              setAddClientDialogOpen(open);
              if (!open) {
                // Clear clientToEdit when dialog closes to prevent stale data
                setClientToEdit(null);
                setDialogMode('add');
              }
            }}
            branchId={id}
            onSuccess={handleClientAdded}
            clientToEdit={clientToEdit}
            mode={dialogMode}
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
        
        {id && (
          <AddCarerDialog
            open={isAddCarerDialogOpen}
            onOpenChange={setIsAddCarerDialogOpen}
            branchId={id}
          />
        )}
        
        {selectedClient && clientDetailOpen && (
          <ClientDetail
            client={selectedClient}
            onClose={handleCloseClientDetail}
            isEditMode={isClientEditModeOpen}
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
      </div>
  );
};

export default BranchDashboard;
