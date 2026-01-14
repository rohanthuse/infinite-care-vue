
import React, { useState } from "react";
import { X, Download, Share2, Ban } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { exportClientProfileToPDF } from "@/lib/exportEvents";
import { useNavigate, useParams } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { useClientSuspensions } from "@/hooks/useClientSuspensions";
import { BackButton } from "@/components/navigation/BackButton";

import { ClientSideTabNav } from "./ClientSideTabNav";
import { ClientOverviewTab } from "./tabs/ClientOverviewTab";
import { PersonalInfoTab } from "./tabs/PersonalInfoTab";
import { GeneralTab } from "./tabs/GeneralTab";
import { NotesTab } from "./tabs/NotesTab";
import MessagesTab from "./tabs/MessagesTab";
import { SuspendTab } from "./tabs/SuspendTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { AppointmentsTab } from "./tabs/AppointmentsTab";
import { BillingTab } from "./tabs/BillingTab";
import { CarePlansTab } from "./tabs/CarePlansTab";
import { EventsLogsTab } from "./tabs/EventsLogsTab";
import { ClientRatesTab } from "./tabs/ClientRatesTab";
import { ClientHobbiesTab } from "./tabs/ClientHobbiesTab";
import { ReviewsTab } from "./tabs/ReviewsTab";
import { HandoverSummaryTab } from "./tabs/HandoverSummaryTab";
import { ClientMedicationsTab } from "./tabs/ClientMedicationsTab";
import { ClientNews2Tab } from "./tabs/ClientNews2Tab";
import { VisitRecordsTab } from "./tabs/VisitRecordsTab";
import { ActivitiesTab } from "./tabs/ActivitiesTab";
import { ClientComplianceTab } from "./tabs/ClientComplianceTab";
import { ClientKeyContactsTab } from "./tabs/ClientKeyContactsTab";
import { AdminServiceReportsTab } from "../service-reports/AdminServiceReportsTab";
import { ServiceReportsErrorBoundary } from "../service-reports/ServiceReportsErrorBoundary";
import { useAdminClientDetail, useAdminUpdateClient } from "@/hooks/useAdminClientData";
import { ClientProfileSharingDialog } from "./ClientProfileSharingDialog";
import { useToast } from "@/hooks/use-toast";

interface ClientDetailProps {
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    status: string;
    avatar: string;
    region: string;
    registeredOn: string;
  } | null;
  onClose: () => void;
  isEditMode?: boolean;
  onAddNote?: () => void;
  onUploadDocument?: () => void;
  onAddEvent?: () => void;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ 
  client, 
  onClose,
  isEditMode = false,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sharingDialogOpen, setSharingDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(isEditMode);
  const navigate = useNavigate();
  const params = useParams();
  const { tenantSlug } = useTenant();
  const { toast } = useToast();
  
  const branchId = params.id || '';
  const branchName = params.branchName || '';
  
  // Fetch real client data
  const { data: realClientData, isLoading, refetch } = useAdminClientDetail(client?.id || '');
  const { data: suspensionData } = useClientSuspensions(client?.id || '');
  const updateClientMutation = useAdminUpdateClient();

  // Sync isEditMode prop with internal isEditing state
  React.useEffect(() => {
    setIsEditing(isEditMode);
  }, [isEditMode]);

  // Refetch data when the modal opens
  React.useEffect(() => {
    if (client?.id) {
      refetch();
    }
  }, [client?.id, refetch]);

  if (!client) return null;

  // Use real data if available, otherwise fallback to prop data
  const clientData = realClientData || client;
  const displayName = realClientData ? 
    `${realClientData.preferred_name || realClientData.first_name || ''} ${realClientData.last_name || ''}`.trim() : 
    client.name;

  const handlePrintClientProfile = async () => {
    try {
      await exportClientProfileToPDF(client.id);
      toast({
        title: "Success",
        description: "Client profile exported successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export client profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (updatedData: any) => {
    try {
      console.log('[ClientDetail] Saving client data:', {
        clientId: client?.id,
        updates: updatedData
      });
      
      await updateClientMutation.mutateAsync({
        clientId: client?.id || '',
        updates: updatedData
      });
      
      toast({
        title: "Success",
        description: "Client information has been updated successfully.",
      });
      
      setIsEditing(false);
    } catch (error: any) {
      console.error('[ClientDetail] Update error:', error);
      
      const errorMessage = error?.message || 
                          error?.details || 
                          'Failed to update client information. Please try again.';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (isEditMode) {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-center text-foreground">Loading client details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <BackButton 
              onClick={onClose}
              label="Back"
              variant="ghost"
            />
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
              {realClientData?.avatar_initials || client.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
                {suspensionData?.is_suspended && (
                  <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                    <Ban className="h-3 w-3" />
                    SUSPENDED
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{realClientData?.address || client.location || 'No address available'}</span>
                <span>•</span>
                <span>Registered: {realClientData?.registered_on || client.registeredOn}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateClientMutation.isPending}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setSharingDialogOpen(true)} className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
                <Button variant="outline" onClick={handlePrintClientProfile} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-1 min-h-0">
          <div className="flex-shrink-0">
            <ClientSideTabNav activeTab={activeTab} onChange={setActiveTab} />
          </div>
          
          <div className="flex-1 overflow-y-auto min-w-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <TabsContent value="overview" className="p-6 m-0">
                  <ClientOverviewTab 
                    client={realClientData || client} 
                    branchId={branchId}
                  />
                </TabsContent>
                
                <TabsContent value="personal" className="p-6 m-0">
                  <PersonalInfoTab 
                    client={realClientData || client}
                    isEditing={isEditing}
                    onSave={handleSave}
                    isSaving={updateClientMutation.isPending}
                  />
                </TabsContent>
                
                <TabsContent value="keycontacts" className="p-6 m-0">
                  <ClientKeyContactsTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="general" className="p-6 m-0">
                  <GeneralTab clientId={client.id} branchId={branchId} />
                </TabsContent>
                
                <TabsContent value="compliance" className="p-6 m-0">
                  <ClientComplianceTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="notes" className="p-6 m-0">
                  <NotesTab clientId={client.id} clientName={displayName} />
                </TabsContent>
                
                <TabsContent value="messages" className="p-6 m-0">
                  <MessagesTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="reviews" className="p-6 m-0">
                  <ReviewsTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="service-reports" className="p-6 m-0">
                  <ServiceReportsErrorBoundary clientId={client.id}>
                    <AdminServiceReportsTab 
                      clientId={client.id} 
                      branchId={branchId} 
                      branchName={decodeURIComponent(branchName)}
                      clientName={client.name}
                    />
                  </ServiceReportsErrorBoundary>
                </TabsContent>
                
                <TabsContent value="medications" className="p-6 m-0">
                  <ClientMedicationsTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="visits" className="p-6 m-0">
                  <VisitRecordsTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="activities" className="p-6 m-0">
                  <ActivitiesTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="news2" className="p-6 m-0">
                  <ClientNews2Tab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="suspend" className="p-6 m-0">
                  <SuspendTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="documents" className="p-6 m-0">
                  <DocumentsTab clientId={client.id} clientName={displayName} />
                </TabsContent>
                
                <TabsContent value="appointments" className="p-6 m-0">
                  <AppointmentsTab clientId={client.id} clientName={displayName} />
                </TabsContent>
                
                <TabsContent value="billing" className="p-6 m-0">
                  <BillingTab clientId={client.id} branchId={branchId} />
                </TabsContent>
                
                <TabsContent value="careplans" className="p-6 m-0">
                  <CarePlansTab clientId={client.id} clientName={displayName} />
                </TabsContent>
                
                <TabsContent value="eventslogs" className="p-6 m-0">
                  <EventsLogsTab clientId={client.id} branchId={branchId} clientName={displayName} />
                </TabsContent>
                
                <TabsContent value="rates" className="p-6 m-0">
                  <ClientRatesTab clientId={client.id} branchId={branchId} />
                </TabsContent>
                
                <TabsContent value="hobbies" className="p-6 m-0">
                  <ClientHobbiesTab clientId={client.id} />
                </TabsContent>
                
                <TabsContent value="handover" className="p-6 m-0">
                  <HandoverSummaryTab 
                    clientId={client.id}
                    clientName={displayName}
                    clientPhone={realClientData?.phone || realClientData?.mobile_number || client?.phone || undefined}
                    clientAddress={realClientData?.address || client?.location || undefined}
                  />
                </TabsContent>
              </Tabs>
            </div>
        </div>

        <ClientProfileSharingDialog
          open={sharingDialogOpen}
          onOpenChange={setSharingDialogOpen}
          client={client}
          branchId={branchId}
        />
      </div>
    </div>
  );
};
